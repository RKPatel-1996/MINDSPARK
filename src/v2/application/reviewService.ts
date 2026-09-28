import type { Repositories, ReviewQueueState, ReviewSubmissionInput, ReviewSubmissionResult } from './types';
import type { ReviewCard } from '../domain/card';
import type { KnowledgeItem } from '../domain/knowledge';
import type { ReviewEvent } from '../domain/event';
import type { SchedulerParameterSet } from '../domain/schedulerParameterSet';
import type { SyncState, SyncMetadata } from '../persistence/repository/interfaces';
import { reconcileCardHistory } from '../reconciliation';
import { applyReviewToCard } from '../reconciliation/reviewApplication';
import { selectNextCard, type CandidateCardBundle, type RouterContext } from '../engine/reviewRouter';
import { getOrCreateDeviceId } from '../local/deviceIdentity';
import { DEFAULT_SETTINGS } from './bootstrapService';

/**
 * Calculates the start timestamp (in milliseconds) of the local review day.
 * Uses local calendar date at midnight (00:00:00.000 local time).
 * All ReviewEvents recorded with a reviewTimestamp on or after this boundary
 * belong to the current local review day for sibling burial and new-card daily limits.
 */
export function getLocalDayStart(date: Date = new Date()): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0).getTime();
}

export class ReviewService {
  private explicitBuriedCardIds = new Set<string>();
  private derivedBuriedCardIds = new Set<string>();
  private recentTopicIds: string[] = [];
  private cachedParameterSets: Record<string, SchedulerParameterSet> | null = null;
  
  // Pending write overlay for offline-first responsiveness
  private pendingEvents = new Map<string, ReviewEvent>();
  private failedEvents = new Map<string, { event: ReviewEvent; error: string }>();
  private retryingFailedEventIds = new Set<string>();
  private pendingWritesCount = 0;
  private isOfflineOrCache = false;
  private repoHasPendingWrites = false;
  private repoIsOfflineOrCache = false;
  private lastSyncError: string | null = null;
  private syncListeners = new Set<(state: SyncState, count: number, error?: string) => void>();
  private unsubscribeRepoSync?: () => void;
  private unsubscribeActiveCard?: () => void;
  private activeObservedCardId: string | null = null;

  constructor(private repos: Repositories) {
    const initialSyncMeta = this.repos.reviewEvents.getSyncMetadata?.();
    if (initialSyncMeta) {
      this.applyRepoSyncMetadata(initialSyncMeta);
    }
    if (this.repos.reviewEvents.observeSyncState) {
      this.unsubscribeRepoSync = this.repos.reviewEvents.observeSyncState((meta) => {
        this.applyRepoSyncMetadata(meta);
      });
    }
  }

  destroy(): void {
    if (this.unsubscribeRepoSync) {
      this.unsubscribeRepoSync();
      this.unsubscribeRepoSync = undefined;
    }
    if (this.unsubscribeActiveCard) {
      this.unsubscribeActiveCard();
      this.unsubscribeActiveCard = undefined;
    }
    this.syncListeners.clear();
  }

  /**
   * Force the next scheduling operation to re-read scheduler parameter sets.
   */
  invalidateParameterSetCache(): void {
    this.cachedParameterSets = null;
  }

  private applyRepoSyncMetadata(meta: SyncMetadata): void {
    if (meta.rejectedEvents?.length) {
      for (const event of meta.rejectedEvents) {
        this.pendingEvents.set(event.id, event);
        if (!this.failedEvents.has(event.id)) {
          this.failedEvents.set(event.id, {
            event,
            error: 'Review persistence was rejected.',
          });
        }
      }
    }

    if (this.failedEvents.size > 0) {
      this.lastSyncError =
        this.failedEvents.values().next().value?.error ??
        'Review persistence failed.';
    } else if (meta.state === 'error') {
      this.lastSyncError = 'Sync failure';
    } else {
      this.lastSyncError = null;
    }

    this.repoHasPendingWrites = Boolean(meta.hasPendingWrites);
    this.repoIsOfflineOrCache = Boolean(meta.fromCache);
    this.notifySyncListeners();
  }

  /**
   * Reset transient within-session topic alternation memory.
   * MUST NOT reset same-day sibling burial or new-card introduction counts,
   * which are derived from immutable ReviewEvent evidence.
   */
  resetSession(): void {
    this.recentTopicIds = [];
  }

  /**
   * Observe sync status transitions (synced, pending_writes, offline_or_cache, error).
   */
  onSyncStateChange(listener: (state: SyncState, count: number, error?: string) => void): () => void {
    this.syncListeners.add(listener);
    listener(this.getCurrentSyncState(), this.pendingWritesCount, this.lastSyncError ?? undefined);
    return () => {
      this.syncListeners.delete(listener);
    };
  }

  getCurrentSyncState(): SyncState {
    if (this.lastSyncError) return 'error';
    if (this.pendingWritesCount > 0 || this.repoHasPendingWrites) return 'pending_writes';
    if (this.isOfflineOrCache || this.repoIsOfflineOrCache) return 'offline_or_cache';
    return 'synced';
  }

  setSyncMetadata(meta: { state?: SyncState; fromCache?: boolean; hasPendingWrites?: boolean }): void {
    if (meta.fromCache !== undefined) {
      this.isOfflineOrCache = meta.fromCache;
    }
    if (meta.hasPendingWrites !== undefined) {
      this.repoHasPendingWrites = meta.hasPendingWrites;
    }
    if (meta.state === 'error') {
      this.lastSyncError = 'Sync failure';
    } else if (meta.state === 'synced') {
      this.lastSyncError = null;
      this.isOfflineOrCache = false;
      this.repoIsOfflineOrCache = false;
      this.repoHasPendingWrites = false;
      this.pendingWritesCount = 0;
    }
    this.notifySyncListeners();
  }

  getFailedReviewSubmissions(): Array<{ event: ReviewEvent; error: string }> {
    return Array.from(this.failedEvents.values()).map(({ event, error }) => ({
      event,
      error,
    }));
  }

  async retryFailedReviewEvent(eventId: string): Promise<void> {
    const failed = this.failedEvents.get(eventId);

    if (!failed || this.retryingFailedEventIds.has(eventId)) return;

    this.retryingFailedEventIds.add(eventId);
    this.pendingWritesCount++;
    this.notifySyncListeners();

    try {
      await this.repos.reviewEvents.append(failed.event);
      this.failedEvents.delete(eventId);
      this.pendingEvents.delete(eventId);
      this.lastSyncError =
        this.failedEvents.values().next().value?.error ?? null;
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err);
      this.pendingEvents.set(eventId, failed.event);
      this.failedEvents.set(eventId, { event: failed.event, error });
      this.lastSyncError = error;
      throw err;
    } finally {
      this.retryingFailedEventIds.delete(eventId);
      this.pendingWritesCount = Math.max(0, this.pendingWritesCount - 1);
      this.notifySyncListeners();
    }
  }

  getPendingWritesCount(): number {
    return this.pendingWritesCount;
  }

  getLastSyncError(): string | null {
    return this.lastSyncError;
  }

  private notifySyncListeners(): void {
    const state = this.getCurrentSyncState();
    const count = this.pendingWritesCount;
    const error = this.lastSyncError ?? undefined;
    for (const listener of this.syncListeners) {
      listener(state, count, error);
    }
  }

  /**
   * Directly buries specific cards for today.
   */
  buryCard(cardId: string): void {
    this.explicitBuriedCardIds.add(cardId);
    this.derivedBuriedCardIds.add(cardId);
  }

  getBuriedCount(): number {
    return this.derivedBuriedCardIds.size;
  }

  isCardBuried(cardId: string): boolean {
    return this.derivedBuriedCardIds.has(cardId);
  }

  /**
   * Reconstructs current-local-day review context from authoritative ReviewEvents and the repository.
   * Derives both sibling-burial context and new-card introduction counts so they survive service reconstruction.
   */
  private compareReviewEvents(
    left: ReviewEvent,
    right: ReviewEvent
  ): number {
    const timestampDifference =
      new Date(left.reviewTimestamp).getTime()
      - new Date(right.reviewTimestamp).getTime();

    return timestampDifference !== 0
      ? timestampDifference
      : left.id.localeCompare(right.id);
  }

  private mergePendingEventsForCard(
    cardId: string,
    repoEvents: readonly ReviewEvent[]
  ): ReviewEvent[] {
    const merged =
      new Map<string, ReviewEvent>();

    for (const event of repoEvents) {
      merged.set(event.id, event);
    }

    for (const [eventId, event] of this.pendingEvents) {
      if (event.cardId === cardId) {
        merged.set(eventId, event);
      }
    }

    return Array.from(merged.values())
      .sort(
        (left, right) =>
          this.compareReviewEvents(
            left,
            right
          )
      );
  }

  private async getEventsForCards(
    cardIds: readonly string[]
  ): Promise<Map<string, ReviewEvent[]>> {
    const uniqueCardIds =
      Array.from(new Set(cardIds));

    const repoHistories =
      await this.repos.reviewEvents.listForCards(
        uniqueCardIds
      );

    const mergedByCardId =
      new Map<
        string,
        Map<string, ReviewEvent>
      >(
        uniqueCardIds.map(
          (cardId) => [
            cardId,
            new Map(
              (
                repoHistories.get(cardId)
                ?? []
              ).map(
                (event) => [
                  event.id,
                  event,
                ]
              )
            ),
          ]
        )
      );

    for (
      const [
        eventId,
        event,
      ] of this.pendingEvents
    ) {
      const cardEvents =
        mergedByCardId.get(
          event.cardId
        );

      if (cardEvents) {
        cardEvents.set(
          eventId,
          event
        );
      }
    }

    return new Map(
      Array.from(
        mergedByCardId.entries()
      ).map(
        ([
          cardId,
          eventsById,
        ]) => [
          cardId,
          Array.from(
            eventsById.values()
          ).sort(
            (left, right) =>
              this.compareReviewEvents(
                left,
                right
              )
          ),
        ]
      )
    );
  }

  private deriveDayContext(
    allCards: readonly ReviewCard[],
    eventsByCardId: ReadonlyMap<
      string,
      ReviewEvent[]
    >,
    now: Date
  ): {
    buriedCardIds: Set<string>;
    newCardsIntroducedToday: number;
  } {
    const todayStartMs =
      getLocalDayStart(now);

    const itemToCardIds =
      new Map<string, string[]>();

    for (const card of allCards) {
      const existing =
        itemToCardIds.get(
          card.knowledgeItemId
        ) ?? [];

      existing.push(card.id);

      itemToCardIds.set(
        card.knowledgeItemId,
        existing
      );
    }

    let newCardsIntroducedToday = 0;

    const reviewedTodayCardIds =
      new Set<string>();

    const itemsWithReviewsToday =
      new Set<string>();

    for (const card of allCards) {
      const events =
        eventsByCardId.get(
          card.id
        ) ?? [];

      if (events.length === 0) {
        continue;
      }

      // First-ever review event occurred today -> counts toward the
      // daily new-card introduction limit.
      const firstEventTime =
        new Date(
          events[0].reviewTimestamp
        ).getTime();

      if (
        firstEventTime
        >= todayStartMs
      ) {
        newCardsIntroducedToday++;
      }

      const lastEventTime =
        new Date(
          events[
            events.length - 1
          ].reviewTimestamp
        ).getTime();

      if (
        lastEventTime
        >= todayStartMs
      ) {
        reviewedTodayCardIds.add(
          card.id
        );

        itemsWithReviewsToday.add(
          card.knowledgeItemId
        );
      }
    }

    // Derive sibling burial exactly as before:
    // a sibling is buried only when another card from its item was
    // reviewed today and the sibling itself was not.
    const buried =
      new Set<string>(
        this.explicitBuriedCardIds
      );

    for (
      const itemId
      of itemsWithReviewsToday
    ) {
      const siblings =
        itemToCardIds.get(
          itemId
        ) ?? [];

      for (
        const siblingId
        of siblings
      ) {
        if (
          !reviewedTodayCardIds.has(
            siblingId
          )
        ) {
          buried.add(
            siblingId
          );
        }
      }
    }

    this.derivedBuriedCardIds =
      buried;

    return {
      buriedCardIds: buried,
      newCardsIntroducedToday,
    };
  }

  async syncDayContext(
    now: Date = new Date()
  ): Promise<{
    buriedCardIds: Set<string>;
    newCardsIntroducedToday: number;
  }> {
    const allCards =
      await this.repos.reviewCards.list();

    const eventsByCardId =
      await this.getEventsForCards(
        allCards.map(
          (card) => card.id
        )
      );

    return this.deriveDayContext(
      allCards,
      eventsByCardId,
      now
    );
  }

  /**
   * Fetches events for a true single-card workflow, merging repository
   * evidence with the in-process pending overlay by immutable event ID.
   */
  async getEventsForCard(
    cardId: string
  ): Promise<ReviewEvent[]> {
    const repoEvents =
      await this.repos.reviewEvents
        .listForCard(cardId);

    return this.mergePendingEventsForCard(
      cardId,
      repoEvents
    );
  }
  private async getParameterSetsDict(): Promise<Record<string, SchedulerParameterSet>> {
    if (this.cachedParameterSets) {
      return this.cachedParameterSets;
    }
    const list = await this.repos.parameterSets.list();
    const dict: Record<string, SchedulerParameterSet> = {};
    for (const ps of list) {
      dict[ps.id] = ps;
    }
    this.cachedParameterSets = dict;
    return dict;
  }

  /**
   * Evaluates all candidates and returns the next prioritized card via Review Router.
   * Derives daily new card count and sibling burial context from authoritative ReviewEvents
   * so scheduling context survives app reloads.
   */
  async getNextReview(): Promise<ReviewQueueState> {
    const [allItems, allCards, settings] = await Promise.all([
      this.repos.knowledge.list(),
      this.repos.reviewCards.list(),
      this.repos.settings.get().then((s) => s ?? DEFAULT_SETTINGS),
    ]);

    if (allItems.length === 0 || allCards.length === 0) {
      return {
        status: 'empty',
        message: 'No knowledge available yet. Import your first knowledge packet to begin retrieval practice.',
      };
    }

    const parameterSets = await this.getParameterSetsDict();
    
    // Validate active parameter set exists; configuration corruption must be surfaced explicitly
    if (!parameterSets[settings.activeParameterSetId]) {
      return {
        status: 'error',
        message: `Configuration corruption: Active scheduler parameter set "${settings.activeParameterSetId}" was not found in the repository.`,
        details: 'Active parameter set missing from parameterSets collection',
      };
    }

    const itemMap = new Map<string, KnowledgeItem>();
    for (const item of allItems) {
      itemMap.set(item.id, item);
    }

    const now = new Date();
    const eventsByCardId = await this.getEventsForCards(
      allCards.map((card) => card.id)
    );
    const { buriedCardIds, newCardsIntroducedToday } = this.deriveDayContext(
      allCards,
      eventsByCardId,
      now
    );
    const candidateBundles: CandidateCardBundle[] = [];

    // Reconcile card states deterministically from events
    for (const card of allCards) {
      const knowledgeItem = itemMap.get(card.knowledgeItemId);
      if (!knowledgeItem) continue;

      const events = eventsByCardId.get(card.id) ?? [];

      const reconciliation = reconcileCardHistory(card, events, parameterSets);

      if (!reconciliation.ok) {
        // DO NOT SILENTLY SKIP RECONCILIATION ERRORS
        return {
          status: 'error',
          message: `Reconciliation failure for card ${card.id}: ${reconciliation.message}`,
          cardId: card.id,
          details: reconciliation.message,
        };
      }

      candidateBundles.push({
        card,
        knowledgeItem,
        cardState: reconciliation.state,
      });
    }

    if (candidateBundles.length === 0) {
      return {
        status: 'empty',
        message: 'No active cards available in the library.',
      };
    }

    const routerContext: RouterContext = {
      now,
      buriedCardIds,
      recentTopicIds: this.recentTopicIds,
      newCardsIntroducedToday,
      config: {
        maxDailyNewCards: settings.newCardDailyLimit,
        reserveHorizonHours: settings.reserveHorizonHours,
        fsrsConfig: {
          desiredRetention: settings.desiredRetention,
        },
      },
    };

    const routerResult = selectNextCard(candidateBundles, routerContext);

    if (routerResult.status === 'selected') {
      // Connect observeForCard for live sync updates on the active review card
      if (this.activeObservedCardId !== routerResult.card.id) {
        if (this.unsubscribeActiveCard) {
          this.unsubscribeActiveCard();
        }
        this.activeObservedCardId = routerResult.card.id;
        this.unsubscribeActiveCard = this.repos.reviewEvents.observeForCard(
          routerResult.card.id,
          (_events, meta) => {
            this.applyRepoSyncMetadata(meta);
          }
        );
      }

      return {
        status: 'ready',
        active: {
          card: routerResult.card,
          knowledgeItem: routerResult.knowledgeItem,
          cardState: routerResult.cardState,
          reason: routerResult.reason,
          evidence: routerResult.evidence,
          stats: routerResult.stats,
        },
      };
    } else {
      return {
        status: 'caught_up',
        message: routerResult.message,
        stats: routerResult.stats,
      };
    }
  }

  /**
   * Applies the review outcome, creates an immutable ReviewEvent, places it in the
   * in-process pending overlay, initiates remote persistence asynchronously, buries sibling cards,
   * and immediately returns provisional state without waiting for remote acknowledgement.
   */
  async submitReview(input: ReviewSubmissionInput): Promise<ReviewSubmissionResult> {
    const { card, knowledgeItem, currentState, rating, objectiveCorrect, guessedOrStruggled, durationMs } = input;

    const deviceResult = await getOrCreateDeviceId();
    const settings = (await this.repos.settings.get()) ?? DEFAULT_SETTINGS;
    const parameterSets = await this.getParameterSetsDict();
    
    // Missing parameter set is configuration corruption
    const parameterSet = parameterSets[settings.activeParameterSetId];
    if (!parameterSet) {
      throw new Error(
        `Configuration corruption: Active scheduler parameter set "${settings.activeParameterSetId}" was not found in the repository.`
      );
    }

    const reviewTimestamp = new Date().toISOString();

    const applicationResult = applyReviewToCard({
      card,
      currentState,
      rating,
      objectiveCorrect,
      guessedOrStruggled,
      deviceId: deviceResult.deviceId,
      reviewTimestamp,
      desiredRetention: settings.desiredRetention,
      parameterSet,
      schemaVersion: 1,
      durationMs,
    });

    const event = applicationResult.event;

    // 1. Add to in-process pending event overlay immediately so next router query sees it
    this.pendingEvents.set(event.id, event);
    this.pendingWritesCount++;
    this.lastSyncError = null;
    this.notifySyncListeners();

    // 2. Initiate non-blocking persistence (enters local persistent cache; does not block UI)
    this.repos.reviewEvents.append(event)
      .then(() => {
        this.pendingEvents.delete(event.id);
        this.pendingWritesCount = Math.max(0, this.pendingWritesCount - 1);
        this.notifySyncListeners();
      })
      .catch((err) => {
        this.pendingWritesCount = Math.max(0, this.pendingWritesCount - 1);
        const msg = err instanceof Error ? err.message : String(err);
        this.pendingEvents.set(event.id, event);
        this.failedEvents.set(event.id, { event, error: msg });
        this.lastSyncError = msg;
        this.notifySyncListeners();
      });

    // 3. Genuine Sibling Burying:
    // Sibling cards belonging to the same KnowledgeItem are buried for today.
    // Card A itself is NOT buried; its return is governed strictly by FSRS due time.
    const allSiblingCards = await this.repos.reviewCards.listForKnowledgeItem(knowledgeItem.id);
    for (const sib of allSiblingCards) {
      if (sib.id !== card.id) {
        this.derivedBuriedCardIds.add(sib.id);
      }
    }

    // 4. Track recent topic diversity
    if (knowledgeItem.taxonomy.topicId) {
      this.recentTopicIds = [
        knowledgeItem.taxonomy.topicId,
        ...this.recentTopicIds.filter((t) => t !== knowledgeItem.taxonomy.topicId),
      ].slice(0, 10);
    }

    // Return provisional result immediately!
    return applicationResult;
  }

  /**
   * Flags a knowledge item as needing review/attention.
   */
  async flagKnowledgeItem(knowledgeItemId: string): Promise<void> {
    const item = await this.repos.knowledge.get(knowledgeItemId);
    if (item) {
      const nextStatus = item.status === 'needs_review' ? 'active' : 'needs_review';
      await this.repos.knowledge.update({
        ...item,
        status: nextStatus,
        updatedAt: new Date().toISOString(),
      });
    }
  }
}
