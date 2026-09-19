import type { Repositories, InsightsSummary } from './types';
import { reconcileCardHistory } from '../reconciliation';
import { calculateRetrievability, DEFAULT_FSRS_CONFIG } from '../engine/fsrsAdapter';

export class InsightsService {
  constructor(private repos: Repositories) {}

  async getInsights(): Promise<InsightsSummary> {
    const [items, cards] = await Promise.all([
      this.repos.knowledge.list(),
      this.repos.reviewCards.list(),
    ]);

    // Distinguish active items from needs_review items and archived items
    const activeItems = items.filter((i) => i.status === 'active');
    const activeItemIds = new Set(activeItems.map((i) => i.id));
    const activeCards = cards.filter((c) => !c.suspended && activeItemIds.has(c.knowledgeItemId));

    const paramSetsList = await this.repos.parameterSets.list();
    const paramSetsDict = Object.fromEntries(paramSetsList.map((p) => [p.id, p]));

    const stageCounts = {
      new: 0,
      learning: 0,
      review: 0,
      relearning: 0,
    };

    let totalRetrievability = 0;
    let cardCountForR = 0;

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    let reviewedTodayCount = 0;
    const reconciliationErrors: Array<{ cardId: string; message: string }> = [];

    for (const card of activeCards) {
      const events = await this.repos.reviewEvents.listForCard(card.id);
      
      // Check events reviewed today
      for (const ev of events) {
        if (new Date(ev.reviewTimestamp).getTime() >= todayStart) {
          reviewedTodayCount++;
        }
      }

      const reconciliation = reconcileCardHistory(card, events, paramSetsDict);
      if (reconciliation.ok) {
        const state = reconciliation.state;
        stageCounts[state.state]++;

        // New cards have never been reviewed; they MUST NOT contribute fabricated retrievability
        if (state.state !== 'new') {
          const r = calculateRetrievability(state, now, DEFAULT_FSRS_CONFIG);
          totalRetrievability += r;
          cardCountForR++;
        }
      } else {
        reconciliationErrors.push({
          cardId: card.id,
          message: reconciliation.message,
        });
      }
    }

    // Truthful retrievability: null if zero cards have review history
    const averageRetrievability = cardCountForR > 0
      ? Math.round((totalRetrievability / cardCountForR) * 100)
      : null;

    const needsReviewCount = items.filter((i) => i.status === 'needs_review').length;

    return {
      totalActiveItems: activeItems.length,
      totalActiveCards: activeCards.length,
      averageRetrievability,
      needsReviewCount,
      reviewedTodayCount,
      stageCounts,
      reconciliationErrors: reconciliationErrors.length > 0 ? reconciliationErrors : undefined,
    };
  }
}
