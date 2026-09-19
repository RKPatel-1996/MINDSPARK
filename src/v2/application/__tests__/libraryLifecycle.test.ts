import { describe, it, expect, beforeEach } from 'vitest';
import { createInMemoryRepositories } from '../../persistence/memory/inMemoryRepositories';
import { seedInitialLibrary } from '../importService';
import { LibraryService } from '../libraryService';
import { ReviewService } from '../reviewService';
import type { Repositories } from '../types';
import { ALLOWED_LIFECYCLE_TRANSITIONS, validateLifecycleTransition } from '../../domain/lifecycle';

describe('Library KnowledgeItem Lifecycle Transitions (Task 3/5)', () => {
  let repos: Repositories;
  let libraryService: LibraryService;

  beforeEach(async () => {
    repos = createInMemoryRepositories();
    await seedInitialLibrary(repos);
    libraryService = new LibraryService(repos);
  });

  describe('Allowed transitions authority', () => {
    it('defines exactly the 5 allowed transitions', () => {
      expect(ALLOWED_LIFECYCLE_TRANSITIONS.length).toBe(5);
      expect(ALLOWED_LIFECYCLE_TRANSITIONS.map((t) => `${t.from}->${t.to}`)).toEqual([
        'active->needs_review',
        'active->archived',
        'needs_review->active',
        'needs_review->archived',
        'archived->active',
      ]);
    });

    it('validates allowed transitions correctly', () => {
      expect(validateLifecycleTransition('active', 'needs_review').valid).toBe(true);
      expect(validateLifecycleTransition('needs_review', 'active').valid).toBe(true);
      expect(validateLifecycleTransition('active', 'archived').valid).toBe(true);
      expect(validateLifecycleTransition('needs_review', 'archived').valid).toBe(true);
      expect(validateLifecycleTransition('archived', 'active').valid).toBe(true);
    });

    it('rejects forbidden and no-op transitions', () => {
      expect(validateLifecycleTransition('archived', 'needs_review').valid).toBe(false);
      expect(validateLifecycleTransition('active', 'active').valid).toBe(false);
      expect(validateLifecycleTransition('needs_review', 'needs_review').valid).toBe(false);
      expect(validateLifecycleTransition('archived', 'archived').valid).toBe(false);
    });
  });

  describe('Service transitions', () => {
    it('succeeds on active -> needs_review', async () => {
      const items = await repos.knowledge.list();
      const activeItem = items.find((i) => i.status === 'active')!;
      expect(activeItem).toBeDefined();

      const res = await libraryService.transitionKnowledgeItemStatus(activeItem.id, 'needs_review');
      expect(res.success).toBe(true);
      if (!res.success) return;

      expect(res.item.status).toBe('needs_review');
      const persisted = await repos.knowledge.get(activeItem.id);
      expect(persisted?.status).toBe('needs_review');
    });

    it('succeeds on needs_review -> active', async () => {
      const items = await repos.knowledge.list();
      const item = items[0];
      await repos.knowledge.updateStatus(item.id, 'needs_review', new Date().toISOString());

      const res = await libraryService.transitionKnowledgeItemStatus(item.id, 'active');
      expect(res.success).toBe(true);
      if (!res.success) return;

      expect(res.item.status).toBe('active');
      const persisted = await repos.knowledge.get(item.id);
      expect(persisted?.status).toBe('active');
    });

    it('succeeds on active -> archived', async () => {
      const items = await repos.knowledge.list();
      const activeItem = items.find((i) => i.status === 'active')!;

      const res = await libraryService.transitionKnowledgeItemStatus(activeItem.id, 'archived');
      expect(res.success).toBe(true);
      if (!res.success) return;

      expect(res.item.status).toBe('archived');
      const persisted = await repos.knowledge.get(activeItem.id);
      expect(persisted?.status).toBe('archived');
    });

    it('succeeds on needs_review -> archived', async () => {
      const items = await repos.knowledge.list();
      const item = items[0];
      await repos.knowledge.updateStatus(item.id, 'needs_review', new Date().toISOString());

      const res = await libraryService.transitionKnowledgeItemStatus(item.id, 'archived');
      expect(res.success).toBe(true);
      if (!res.success) return;

      expect(res.item.status).toBe('archived');
      const persisted = await repos.knowledge.get(item.id);
      expect(persisted?.status).toBe('archived');
    });

    it('succeeds on archived -> active (restore)', async () => {
      const items = await repos.knowledge.list();
      const item = items[0];
      await repos.knowledge.updateStatus(item.id, 'archived', new Date().toISOString());

      const res = await libraryService.transitionKnowledgeItemStatus(item.id, 'active');
      expect(res.success).toBe(true);
      if (!res.success) return;

      expect(res.item.status).toBe('active');
      const persisted = await repos.knowledge.get(item.id);
      expect(persisted?.status).toBe('active');
    });

    it('structurally rejects unsupported transitions (archived -> needs_review)', async () => {
      const items = await repos.knowledge.list();
      const item = items[0];
      await repos.knowledge.updateStatus(item.id, 'archived', new Date().toISOString());

      const res = await libraryService.transitionKnowledgeItemStatus(item.id, 'needs_review');
      expect(res.success).toBe(false);
      if ('error' in res) {
        expect(res.error.type).toBe('invalid_transition');
        if (res.error.type === 'invalid_transition') {
          expect(res.error.from).toBe('archived');
          expect(res.error.to).toBe('needs_review');
        }
      }

      // Ensure persistence did not change
      const persisted = await repos.knowledge.get(item.id);
      expect(persisted?.status).toBe('archived');
    });

    it('rejects transition for non-existent item', async () => {
      const res = await libraryService.transitionKnowledgeItemStatus('non-existent-id', 'archived');
      expect(res.success).toBe(false);
      if ('error' in res) {
        expect(res.error.type).toBe('item_not_found');
      }
    });

    it('preserves status during content edits (updateKnowledgeItem does not change status)', async () => {
      const items = await repos.knowledge.list();
      const item = items[0];
      await repos.knowledge.updateStatus(item.id, 'needs_review', new Date().toISOString());

      await libraryService.updateKnowledgeItem({
        ...item,
        title: 'Updated Title',
        content: 'Updated Content',
        explanationMarkdown: 'Updated Explanation',
        tags: item.tags,
      });

      const updated = await repos.knowledge.get(item.id);
      expect(updated?.title).toBe('Updated Title');
      expect(updated?.status).toBe('needs_review'); // Status is unaffected
    });

    it('preserves cards, ReviewEvents, and CardState/FSRS data across lifecycle transitions', async () => {
      const reviewService = new ReviewService(repos);
      const queue = await reviewService.getNextReview();
      expect(queue.status).toBe('ready');
      if (queue.status !== 'ready') return;

      const targetItemId = queue.active.knowledgeItem.id;
      const targetCardId = queue.active.card.id;

      // Perform a review to generate ReviewEvent and non-default CardState
      const isObjective = queue.active.card.type === 'mcq' || queue.active.card.type === 'true_false';
      await reviewService.submitReview({
        card: queue.active.card,
        knowledgeItem: queue.active.knowledgeItem,
        currentState: queue.active.cardState,
        rating: 'good',
        objectiveCorrect: isObjective ? true : null,
        guessedOrStruggled: false,
        durationMs: 3500,
      });

      const itemsBefore = await libraryService.listKnowledgeItems();
      const bundleBefore = itemsBefore.find((b) => b.item.id === targetItemId);
      expect(bundleBefore).toBeDefined();
      expect(bundleBefore?.cardStates[targetCardId]?.reps).toBe(1);

      const eventsBefore = await repos.reviewEvents.listForCard(targetCardId);
      expect(eventsBefore.length).toBe(1);

      // Perform transitions: active -> needs_review -> archived -> active
      const toReview = await libraryService.transitionKnowledgeItemStatus(targetItemId, 'needs_review');
      expect(toReview.success).toBe(true);

      const toArchive = await libraryService.transitionKnowledgeItemStatus(targetItemId, 'archived');
      expect(toArchive.success).toBe(true);

      const toRestore = await libraryService.transitionKnowledgeItemStatus(targetItemId, 'active');
      expect(toRestore.success).toBe(true);

      // Verify cards, states, and review history are completely intact
      const itemsAfter = await libraryService.listKnowledgeItems();
      const bundleAfter = itemsAfter.find((b) => b.item.id === targetItemId);
      expect(bundleAfter?.cards.map((c) => c.id)).toEqual(bundleBefore?.cards.map((c) => c.id));
      expect(bundleAfter?.cardStates[targetCardId]).toEqual(bundleBefore?.cardStates[targetCardId]);

      const eventsAfter = await repos.reviewEvents.listForCard(targetCardId);
      expect(eventsAfter.length).toBe(1);
      expect(eventsAfter[0].id).toBe(eventsBefore[0].id);
      expect(eventsAfter[0].rating).toBe('good');
    });

    it('returns typed error and does not mutate status when persistence fails', async () => {
      const items = await repos.knowledge.list();
      const item = items[0];
      const originalStatus = item.status;

      // Mock updateStatus failure
      repos.knowledge.updateStatus = async () => {
        throw new Error('Disk failure / Firestore write rejected');
      };

      const res = await libraryService.transitionKnowledgeItemStatus(item.id, 'archived');
      expect(res.success).toBe(false);
      if ('error' in res) {
        expect(res.error.type).toBe('persistence_failure');
        expect(res.error.message).toContain('Disk failure / Firestore write rejected');
      }

      // Persistence was not changed
      const current = await repos.knowledge.get(item.id);
      expect(current?.status).toBe(originalStatus);
    });
  });
});
