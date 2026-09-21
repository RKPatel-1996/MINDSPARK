import { describe, it, expect, beforeEach } from 'vitest';
import { createInMemoryRepositories } from '../persistence/memory/inMemoryRepositories';
import { bootstrapUserRepositories, DEFAULT_SETTINGS } from '../application/bootstrapService';
import { ReviewService } from '../application/reviewService';
import { InsightsService } from '../application/insightsService';
import { SettingsService } from '../application/settingsService';
import { LibraryService } from '../application/libraryService';
import { seedInitialLibrary, importDraftPayload } from '../application/importService';
import { createSignedOutRepositories } from '../persistence/signedOut/signedOutRepositories';
import type { Repositories } from '../application/types';
import type { KnowledgeItem } from '../domain/knowledge';
import type { ReviewCard } from '../domain/card';
import type { ReviewEvent } from '../domain/event';
import type { ReviewEventRepository, SyncMetadata, ReceivedEventPage } from '../persistence/repository/interfaces';
import { generateId } from '../domain/id';
import { CANONICAL_TAXONOMY_REGISTRY } from '../application/canonicalTaxonomy';

describe('MindSpark V2 Phase 3B1 Acceptance Gates Regression Test Suite', () => {
  let repos: Repositories;

  beforeEach(async () => {
    repos = createInMemoryRepositories();
    await bootstrapUserRepositories(repos);
  });

  const createTestItemWithCards = async (
    cardCount = 2,
    domainId = 'computing',
    topicId = 'linux'
  ): Promise<{ item: KnowledgeItem; cards: ReviewCard[] }> => {
    const itemId = generateId();
    const item: KnowledgeItem = {
      id: itemId,
      title: `Concept ${itemId.slice(0, 6)}`,
      content: 'Concept content for regression testing.',
      status: 'active',
      taxonomy: {
        domainId,
        topicId,
        subtopicId: 'shell',
      },
      tags: ['concept'],
      schemaVersion: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const cards: ReviewCard[] = [];
    for (let i = 0; i < cardCount; i++) {
      const cardId = generateId();
      cards.push({
        id: cardId,
        knowledgeItemId: itemId,
        type: 'flashcard',
        front: `Front question ${i + 1}`,
        back: `Back answer ${i + 1}`,
        suspended: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        schemaVersion: 1,
      });
    }

    await repos.knowledge.createKnowledgeBundle(item, cards);
    return { item, cards };
  };

  // -------------------------------------------------------------------------
  // GATE 1: Same-Day Context Survives App Reload (Sibling Burial & Daily Limits)
  // -------------------------------------------------------------------------
  describe('Gate 1: Same-Day Context Survives App Reload', () => {
    it('sibling burial is reconstructed from ReviewEvent evidence across ReviewService reconstruction', async () => {
      const { item, cards } = await createTestItemWithCards(2);
      const [cardA, cardB] = cards;

      // Session 1: Review Card A
      const service1 = new ReviewService(repos);
      const q1 = await service1.getNextReview();
      expect(q1.status).toBe('ready');
      if (q1.status !== 'ready') return;

      const activeCard = q1.active.card;
      const siblingCard = activeCard.id === cardA.id ? cardB : cardA;

      await service1.submitReview({
        card: activeCard,
        knowledgeItem: item,
        currentState: q1.active.cardState,
        rating: 'good',
        objectiveCorrect: null,
        guessedOrStruggled: false,
      });

      // Immediate in-session check
      expect(service1.isCardBuried(siblingCard.id)).toBe(true);
      expect(service1.isCardBuried(activeCard.id)).toBe(false);

      // Sibling burial MUST NOT reset when resetSession() is called
      service1.resetSession();
      expect(service1.isCardBuried(siblingCard.id)).toBe(true);

      // Now simulate app reload by creating an entirely new ReviewService instance with fresh in-memory state
      const service2 = new ReviewService(repos);
      
      // Before calling getNextReview, syncDayContext reconstructs the burial context from authoritative events
      const dayContext = await service2.syncDayContext();
      expect(dayContext.buriedCardIds.has(siblingCard.id)).toBe(true);
      expect(dayContext.buriedCardIds.has(activeCard.id)).toBe(false);
      expect(service2.isCardBuried(siblingCard.id)).toBe(true);

      // Sibling Card B must be excluded from getNextReview
      const q2 = await service2.getNextReview();
      if (q2.status === 'ready') {
        expect(q2.active.card.id).not.toBe(siblingCard.id);
      }
    });

    it('newCardDailyLimit reconstructs from local-day ReviewEvent evidence across service reconstruction', async () => {
      // Set daily limit to 1
      await repos.settings.save({ ...DEFAULT_SETTINGS, newCardDailyLimit: 1 });

      // Create two separate knowledge items (each with 1 card)
      const item1 = await createTestItemWithCards(1, 'computing', 'linux');
      const item2 = await createTestItemWithCards(1, 'bioinformatics', 'sequence-analysis');

      const service1 = new ReviewService(repos);
      const q1 = await service1.getNextReview();
      expect(q1.status).toBe('ready');
      if (q1.status !== 'ready') return;

      // Review item1's card
      await service1.submitReview({
        card: q1.active.card,
        knowledgeItem: q1.active.knowledgeItem,
        currentState: q1.active.cardState,
        rating: 'good',
        objectiveCorrect: null,
        guessedOrStruggled: false,
      });

      // Simulate app reload: reconstruct new ReviewService instance
      const service2 = new ReviewService(repos);
      const dayContext = await service2.syncDayContext();
      expect(dayContext.newCardsIntroducedToday).toBe(1);

      // Now attempt to get next review on service2: limit of 1 has been exhausted today!
      const q2 = await service2.getNextReview();
      // Because limit is 1, and 1 new card was introduced today, no more new cards should be presented
      expect(q2.status).toBe('caught_up');
      if (q2.status === 'caught_up') {
        expect(q2.message).toContain('caught up');
      }
    });
  });

  // -------------------------------------------------------------------------
  // GATE 2: In-Process Overlay Validation & Reconciliation from Repository
  // -------------------------------------------------------------------------
  describe('Gate 2: In-Process Overlay Validation & Persistence Reconciliation', () => {
    it('in-process pending overlay is immediate; subsequent service recovers authoritative state', async () => {
      const { item, cards } = await createTestItemWithCards(1);
      const card = cards[0];

      let resolveAppend!: () => void;
      const appendPromise = new Promise<void>((resolve) => {
        resolveAppend = resolve;
      });

      const originalAppend = repos.reviewEvents.append.bind(repos.reviewEvents);
      repos.reviewEvents.append = async (event) => {
        await appendPromise;
        return originalAppend(event);
      };

      const service1 = new ReviewService(repos);
      const q1 = await service1.getNextReview();
      if (q1.status !== 'ready') return;

      const submitPromise = service1.submitReview({
        card,
        knowledgeItem: item,
        currentState: q1.active.cardState,
        rating: 'good',
        objectiveCorrect: null,
        guessedOrStruggled: false,
      });

      // Returns immediately without waiting for slow append
      const submitRes = await submitPromise;
      expect(submitRes.provisionalState.reps).toBe(1);
      expect(service1.getPendingWritesCount()).toBe(1);

      // Overlay is visible to service1
      const overlayEvents = await service1.getEventsForCard(card.id);
      expect(overlayEvents.length).toBe(1);

      // Let append complete
      resolveAppend();
      await new Promise((r) => setTimeout(r, 10));
      expect(service1.getPendingWritesCount()).toBe(0);

      // A reconstructed service instance queries repository events and reconciles state properly
      const service2 = new ReviewService(repos);
      const repoEvents = await service2.getEventsForCard(card.id);
      expect(repoEvents.length).toBe(1);
      expect(repoEvents[0].id).toBe(submitRes.event.id);
    });

    it('models pending cache reconstruction: event persists in local cache while remote ack is unresolved; reconstructed service reconciles event and reports pending_writes', async () => {
      // Create a deterministic fake persistent-cache repository model
      class FakePersistentCacheEventRepo implements ReviewEventRepository {
        public localCache: ReviewEvent[] = [];
        public remoteAckPending = false;
        private remoteAckDeferred: Array<() => void> = [];
        private syncMeta: SyncMetadata = {
          state: 'synced',
          hasPendingWrites: false,
          fromCache: false,
        };
        private syncListeners = new Set<(m: SyncMetadata) => void>();
        private cardListeners = new Map<string, Set<(events: ReviewEvent[], meta: SyncMetadata) => void>>();

        getSyncMetadata(): SyncMetadata {
          return { ...this.syncMeta };
        }

        observeSyncState(cb: (m: SyncMetadata) => void): () => void {
          this.syncListeners.add(cb);
          cb({ ...this.syncMeta });
          return () => this.syncListeners.delete(cb);
        }

        observeForCard(cardId: string, cb: (events: ReviewEvent[], meta: SyncMetadata) => void): () => void {
          if (!this.cardListeners.has(cardId)) {
            this.cardListeners.set(cardId, new Set());
          }
          this.cardListeners.get(cardId)!.add(cb);
          this.listForCard(cardId).then((evs) => cb(evs, { ...this.syncMeta }));
          return () => this.cardListeners.get(cardId)?.delete(cb);
        }

        async append(event: ReviewEvent): Promise<void> {
          // 1. Immediately written to local persistent cache
          this.localCache.push(JSON.parse(JSON.stringify(event)));
          this.remoteAckPending = true;
          this.syncMeta = {
            state: 'pending_writes',
            hasPendingWrites: true,
            fromCache: false,
          };
          this.syncListeners.forEach((l) => l({ ...this.syncMeta }));

          // 2. Remote acknowledgment remains unresolved
          return new Promise<void>((resolve) => {
            this.remoteAckDeferred.push(() => {
              this.remoteAckPending = false;
              this.syncMeta = {
                state: 'synced',
                hasPendingWrites: false,
                fromCache: false,
              };
              this.syncListeners.forEach((l) => l({ ...this.syncMeta }));
              resolve();
            });
          });
        }

        resolveRemoteAck(): void {
          const list = [...this.remoteAckDeferred];
          this.remoteAckDeferred = [];
          list.forEach((cb) => cb());
        }

        async get(id: string): Promise<ReviewEvent | null> {
          const e = this.localCache.find((x) => x.id === id);
          return e ? JSON.parse(JSON.stringify(e)) : null;
        }

        async list(): Promise<ReviewEvent[]> {
          return this.localCache
            .slice()
            .sort((a, b) => {
              const difference = new Date(a.reviewTimestamp).getTime()
                - new Date(b.reviewTimestamp).getTime();
              return difference || a.id.localeCompare(b.id);
            })
            .map((event) => JSON.parse(JSON.stringify(event)));
        }

        async listForCard(cardId: string): Promise<ReviewEvent[]> {
          return this.localCache
            .filter((e) => e.cardId === cardId)
            .sort((a, b) => new Date(a.reviewTimestamp).getTime() - new Date(b.reviewTimestamp).getTime())
            .map((e) => JSON.parse(JSON.stringify(e)));
        }

        async listReceivedAfter(): Promise<ReceivedEventPage> {
          return {
            events: this.localCache.map((e) => ({
              event: e,
              serverReceivedAt: { seconds: 1, nanoseconds: 0 },
            })),
            nextWatermark: undefined,
          };
        }
      }

      const persistentEventRepo = new FakePersistentCacheEventRepo();
      const customRepos: Repositories = {
        ...repos,
        reviewEvents: persistentEventRepo,
      };

      const { item, cards } = await createTestItemWithCards(1);
      const card = cards[0];

      // 1. Submit ReviewEvent on service1
      const service1 = new ReviewService(customRepos);
      const q1 = await service1.getNextReview();
      if (q1.status !== 'ready') throw new Error('Expected ready card');

      const submitRes = await service1.submitReview({
        card,
        knowledgeItem: item,
        currentState: q1.active.cardState,
        rating: 'good',
        objectiveCorrect: null,
        guessedOrStruggled: false,
      });

      // 2. Repository has written event into local persistent cache immediately
      expect(persistentEventRepo.localCache.length).toBe(1);
      expect(persistentEventRepo.localCache[0].id).toBe(submitRes.event.id);

      // 3. Remote acknowledgment remains unresolved
      expect(persistentEventRepo.remoteAckPending).toBe(true);
      expect(persistentEventRepo.getSyncMetadata().hasPendingWrites).toBe(true);

      // 4. Destroy ReviewService
      service1.destroy();

      // 5. Create new ReviewService
      const service2 = new ReviewService(customRepos);

      // 6. New service reads event from repository/cache BEFORE remote acknowledgment resolves
      const cacheEvents = await service2.getEventsForCard(card.id);
      expect(cacheEvents.length).toBe(1);
      expect(cacheEvents[0].id).toBe(submitRes.event.id);

      // 7. Reconciliation sees the event (reconciled card state shows 1 rep, not 0)
      const dayContext = await service2.syncDayContext();
      expect(dayContext.newCardsIntroducedToday).toBe(1);

      // 8. Sync state is NOT falsely 'synced' — it truthfully reports pending_writes!
      const syncStateOnReload = service2.getCurrentSyncState();
      expect(syncStateOnReload).toBe('pending_writes');
      expect(syncStateOnReload).not.toBe('synced');

      // 9. Now remote acknowledgment resolves
      persistentEventRepo.resolveRemoteAck();
      await new Promise((r) => setTimeout(r, 10));

      // After remote ack resolves, sync state transitions to synced
      expect(service2.getCurrentSyncState()).toBe('synced');
      service2.destroy();
    });
  });

  // -------------------------------------------------------------------------
  // GATE 3: Atomic Knowledge-Bundle Import
  // -------------------------------------------------------------------------
  describe('Gate 3: Atomic Knowledge-Bundle Import', () => {
    it('createKnowledgeBundle commits KnowledgeItem and its cards as a single atomic unit', async () => {
      const { item, cards } = await createTestItemWithCards(3);

      const fetchedItem = await repos.knowledge.get(item.id);
      expect(fetchedItem).toBeDefined();
      expect(fetchedItem?.id).toBe(item.id);

      const fetchedCards = await repos.reviewCards.listForKnowledgeItem(item.id);
      expect(fetchedCards.length).toBe(3);
    });

    it('rolls back completely if bundle insertion fails', async () => {
      const inMemory = createInMemoryRepositories();
      const itemId = generateId();
      const item: KnowledgeItem = {
        id: itemId,
        title: 'Atomic Test',
        content: 'Content',
        status: 'active',
        taxonomy: { domainId: 'domain-system-design', topicId: 'topic-distributed-caching' },
        tags: ['test'],
        schemaVersion: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Force card creation failure on 2nd card
      const cardRepo = inMemory.reviewCards as any;
      let count = 0;
      const originalRawSet = cardRepo.rawSet.bind(cardRepo);
      cardRepo.rawSet = (id: string, card: any) => {
        count++;
        if (count === 2) throw new Error('Database write error');
        return originalRawSet(id, card);
      };

      const cards: ReviewCard[] = [
        { id: 'c1', knowledgeItemId: itemId, type: 'flashcard', front: '1', back: '1', suspended: false, createdAt: '', updatedAt: '', schemaVersion: 1 },
        { id: 'c2', knowledgeItemId: itemId, type: 'flashcard', front: '2', back: '2', suspended: false, createdAt: '', updatedAt: '', schemaVersion: 1 },
      ];

      await expect(inMemory.knowledge.createKnowledgeBundle(item, cards)).rejects.toThrow('Database write error');

      // Assert rollback: item is NOT present, card 1 is NOT present
      const fetchedItem = await inMemory.knowledge.get(itemId);
      expect(fetchedItem).toBeNull();
      const fetchedCard1 = await inMemory.reviewCards.get('c1');
      expect(fetchedCard1).toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  // GATE 4: Seed Idempotency
  // -------------------------------------------------------------------------
  describe('Gate 4: Seed Idempotency', () => {
    it('running the standard seed twice does not duplicate items (results in 0 new items)', async () => {
      const firstRun = await seedInitialLibrary(repos);
      expect(firstRun.accepted).toBe(32);
      expect(firstRun.skippedExisting).toBe(0);

      const itemsAfterFirst = await repos.knowledge.list();
      expect(itemsAfterFirst.length).toBe(32);

      // Second seed run
      const secondRun = await seedInitialLibrary(repos);
      expect(secondRun.accepted).toBe(0);
      expect(secondRun.skippedExisting).toBe(32);

      const itemsAfterSecond = await repos.knowledge.list();
      expect(itemsAfterSecond.length).toBe(32); // Still 32 items, NOT 64
    });
  });

  // -------------------------------------------------------------------------
  // GATE 5: Evidence-Based New-Card Limit
  // -------------------------------------------------------------------------
  describe('Gate 5: Evidence-Based New-Card Limit', () => {
    it('derives introduction counts from ReviewEvents for the current local day', async () => {
      const reviewService = new ReviewService(repos);
      const { newCardsIntroducedToday: initialCount } = await reviewService.syncDayContext();
      expect(initialCount).toBe(0);

      const { item, cards } = await createTestItemWithCards(1);
      const card = cards[0];

      // Record a review event today
      await repos.reviewEvents.append({
        id: generateId(),
        cardId: card.id,
        knowledgeItemId: item.id,
        reviewTimestamp: new Date().toISOString(),
        rating: 'good',
        cardType: 'flashcard',
        objectiveCorrect: null,
        guessedOrStruggled: false,
        deviceId: 'dev-1',
        schedulerMetadata: {
          algorithm: 'fsrs-6',
          implementation: 'ts-fsrs',
          implementationVersion: '5.4.2',
          parameterSetId: 'fsrs-6-default',
          scheduledDays: 3,
          stability: 2.5,
          difficulty: 4.0,
          desiredRetention: 0.9,
        },
        schemaVersion: 1,
      });

      const { newCardsIntroducedToday: updatedCount } = await reviewService.syncDayContext();
      expect(updatedCount).toBe(1);
    });
  });

  // -------------------------------------------------------------------------
  // GATE 6: Visible Reconciliation Errors
  // -------------------------------------------------------------------------
  describe('Gate 6: Visible Reconciliation Errors', () => {
    it('surfaces actionable error in ReviewQueueState rather than silent skipping', async () => {
      const { item, cards } = await createTestItemWithCards(1);
      const card = cards[0];

      // Inject corrupted review event
      await repos.reviewEvents.append({
        id: generateId(),
        cardId: card.id,
        knowledgeItemId: item.id,
        reviewTimestamp: new Date().toISOString(),
        rating: 'CORRUPTED_RATING' as any,
        cardType: 'flashcard',
        objectiveCorrect: null,
        guessedOrStruggled: false,
        deviceId: 'dev-1',
        schedulerMetadata: {} as any,
        schemaVersion: 1,
      });

      const reviewService = new ReviewService(repos);
      const queue = await reviewService.getNextReview();

      expect(queue.status).toBe('error');
      if (queue.status === 'error') {
        expect(queue.cardId).toBe(card.id);
        expect(queue.message).toContain('Reconciliation failure');
      }
    });
  });

  // -------------------------------------------------------------------------
  // GATE 7: No Active Parameter Set Fallback
  // -------------------------------------------------------------------------
  describe('Gate 7: No Active Parameter Set Fallback', () => {
    it('fails explicitly when the active scheduler parameter set is missing', async () => {
      await repos.settings.save({
        ...DEFAULT_SETTINGS,
        activeParameterSetId: 'non-existent-parameter-set-id',
      });

      await createTestItemWithCards(1);
      const reviewService = new ReviewService(repos);
      const queue = await reviewService.getNextReview();

      expect(queue.status).toBe('error');
      if (queue.status === 'error') {
        expect(queue.message).toContain('Configuration corruption');
        expect(queue.message).toContain('non-existent-parameter-set-id');
      }
    });
  });

  // -------------------------------------------------------------------------
  // GATE 8: Complete Sync State Tracking
  // -------------------------------------------------------------------------
  describe('Gate 8: Complete Sync State Tracking', () => {
    it('transitions faithfully between synced, pending_writes, offline_or_cache, and error', () => {
      const reviewService = new ReviewService(repos);
      expect(reviewService.getCurrentSyncState()).toBe('synced');

      // Set offline / from cache
      reviewService.setSyncMetadata({ fromCache: true });
      expect(reviewService.getCurrentSyncState()).toBe('offline_or_cache');

      // Set pending write
      reviewService.setSyncMetadata({ hasPendingWrites: true });
      expect(reviewService.getCurrentSyncState()).toBe('pending_writes');

      // Set error
      reviewService.setSyncMetadata({ state: 'error' });
      expect(reviewService.getCurrentSyncState()).toBe('error');

      // Clear error and restore synced
      reviewService.setSyncMetadata({ state: 'synced' });
      expect(reviewService.getCurrentSyncState()).toBe('synced');
    });
  });

  // -------------------------------------------------------------------------
  // GATE 9: No Silent Ephemeral Production Mode
  // -------------------------------------------------------------------------
  describe('Gate 9: No Silent Ephemeral Production Mode', () => {
    it('signed-out repositories throw explicit error preventing silent disposable writes', async () => {
      const signedOutRepos = createSignedOutRepositories();

      await expect(
        signedOutRepos.knowledge.create({
          id: 'k1',
          title: 'T',
          content: 'C',
          status: 'active',
          taxonomy: { domainId: 'd', topicId: 't' },
          tags: [],
          schemaVersion: 1,
          createdAt: '',
          updatedAt: '',
        })
      ).rejects.toThrow(/Authentication required/);

      await expect(
        signedOutRepos.reviewEvents.append({
          id: 'e1',
          cardId: 'c1',
          knowledgeItemId: 'k1',
          reviewTimestamp: '',
          rating: 'good',
          cardType: 'flashcard',
          objectiveCorrect: null,
          guessedOrStruggled: false,
          deviceId: 'd1',
          schedulerMetadata: {} as any,
          schemaVersion: 1,
        })
      ).rejects.toThrow(/Authentication required/);

      await expect(
        signedOutRepos.settings.save(DEFAULT_SETTINGS)
      ).rejects.toThrow(/Authentication required/);
    });
  });

  // -------------------------------------------------------------------------
  // GATE 10: Controlled Knowledge Editing
  // -------------------------------------------------------------------------
  describe('Gate 10: Controlled Knowledge Editing', () => {
    it('validates taxonomy and tags against TaxonomyRegistry and preserves item identity', async () => {
      const { item } = await createTestItemWithCards(1);
      const libraryService = new LibraryService(repos);

      // Valid update with canonical domain/topic/subtopic/tags
      const validUpdated: KnowledgeItem = {
        ...item,
        title: 'Updated Title',
        taxonomy: {
          domainId: 'computing',
          topicId: 'linux',
          subtopicId: 'shell',
        },
        tags: ['concept', 'command'],
      };
      const saved = await libraryService.updateKnowledgeItem(validUpdated);
      expect(saved.title).toBe('Updated Title');
      expect(saved.id).toBe(item.id);
      expect(saved.status).toBe('active');

      // Invalid domain rejection
      const invalidDomain: KnowledgeItem = {
        ...item,
        taxonomy: {
          domainId: 'invalid-nonexistent-domain',
          topicId: 'linux',
        },
      };
      await expect(libraryService.updateKnowledgeItem(invalidDomain)).rejects.toThrow(/Unknown domain ID/);

      // Invalid tag rejection
      const invalidTag: KnowledgeItem = {
        ...item,
        tags: ['unapproved-random-tag'],
      };
      await expect(libraryService.updateKnowledgeItem(invalidTag)).rejects.toThrow(/Disallowed or unknown tag/);
    });
  });

  // -------------------------------------------------------------------------
  // GATE 11: First-Use Insights
  // -------------------------------------------------------------------------
  describe('Gate 11: First-Use Insights', () => {
    it('reports averageRetrievability as null (not fabricated 100%) and 0 cards in learning/review', async () => {
      await createTestItemWithCards(3);

      const insightsService = new InsightsService(repos);
      const insights = await insightsService.getInsights();

      expect(insights.totalActiveItems).toBe(1);
      expect(insights.totalActiveCards).toBe(3);
      expect(insights.reviewedTodayCount).toBe(0);

      // Must be null, NOT fabricated 100%
      expect(insights.averageRetrievability).toBeNull();

      // Cards in learning and review must accurately be 0
      expect(insights.stageCounts.learning).toBe(0);
      expect(insights.stageCounts.review).toBe(0);
      expect(insights.stageCounts.relearning).toBe(0);
      expect(insights.stageCounts.new).toBe(3);
    });
  });

  // -------------------------------------------------------------------------
  // SIBLING BURIAL MULTI-DEVICE MERGE
  // -------------------------------------------------------------------------
  describe('Sibling Burial: Multi-Device Merged Reviews Edge Case', () => {
    it('does not bury already-reviewed siblings when two cards from the same KnowledgeItem merge after independent reviews', async () => {
      // Create KnowledgeItem with 3 cards: cardA, cardB, cardC
      const item: KnowledgeItem = {
        id: 'ki-multidevice',
        title: 'Multi-Device Knowledge',
        content: 'Testing multi-device sibling burial',
        status: 'active',
        taxonomy: { domainId: 'computing', topicId: 'linux', subtopicId: 'shell' },
        tags: ['multi-device'],
        schemaVersion: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const cardA: ReviewCard = {
        id: 'card-device-A',
        knowledgeItemId: item.id,
        type: 'flashcard',
        front: 'Front A',
        back: 'Back A',
        suspended: false,
        schemaVersion: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const cardB: ReviewCard = {
        id: 'card-device-B',
        knowledgeItemId: item.id,
        type: 'flashcard',
        front: 'Front B',
        back: 'Back B',
        suspended: false,
        schemaVersion: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const cardC: ReviewCard = {
        id: 'card-device-C',
        knowledgeItemId: item.id,
        type: 'flashcard',
        front: 'Front C',
        back: 'Back C',
        suspended: false,
        schemaVersion: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await repos.knowledge.createKnowledgeBundle(item, [cardA, cardB, cardC]);

      const now = new Date('2026-09-15T14:00:00.000Z');
      const todayReviewTime = '2026-09-15T12:00:00.000Z';

      // Device 1 reviewed cardA today
      await repos.reviewEvents.append({
        id: 'rev-ev-dev1-A',
        cardId: cardA.id,
        knowledgeItemId: item.id,
        reviewTimestamp: todayReviewTime,
        rating: 'good',
        cardType: 'flashcard',
        objectiveCorrect: null,
        guessedOrStruggled: false,
        deviceId: 'device-phone',
        schedulerMetadata: {
          algorithm: 'fsrs-6',
          implementation: 'ts-fsrs',
          implementationVersion: '5.4.2',
          parameterSetId: 'fsrs-6-default',
          scheduledDays: 3,
          stability: 3.0,
          difficulty: 5.0,
          desiredRetention: 0.9,
        },
        schemaVersion: 1,
      });

      // Device 2 independently reviewed cardB today (offline, then merged)
      await repos.reviewEvents.append({
        id: 'rev-ev-dev2-B',
        cardId: cardB.id,
        knowledgeItemId: item.id,
        reviewTimestamp: todayReviewTime,
        rating: 'good',
        cardType: 'flashcard',
        objectiveCorrect: null,
        guessedOrStruggled: false,
        deviceId: 'device-laptop',
        schedulerMetadata: {
          algorithm: 'fsrs-6',
          implementation: 'ts-fsrs',
          implementationVersion: '5.4.2',
          parameterSetId: 'fsrs-6-default',
          scheduledDays: 3,
          stability: 3.0,
          difficulty: 5.0,
          desiredRetention: 0.9,
        },
        schemaVersion: 1,
      });

      // Card C was NOT reviewed today

      const reviewService = new ReviewService(repos);
      const { buriedCardIds } = await reviewService.syncDayContext(now);

      // Card C must be buried because it belongs to ki-multidevice and was not reviewed today
      expect(buriedCardIds.has(cardC.id)).toBe(true);

      // Card A and Card B must NOT be buried merely because the other was reviewed!
      expect(buriedCardIds.has(cardA.id)).toBe(false);
      expect(buriedCardIds.has(cardB.id)).toBe(false);

      expect(reviewService.isCardBuried(cardA.id)).toBe(false);
      expect(reviewService.isCardBuried(cardB.id)).toBe(false);
      expect(reviewService.isCardBuried(cardC.id)).toBe(true);
    });
  });
});
