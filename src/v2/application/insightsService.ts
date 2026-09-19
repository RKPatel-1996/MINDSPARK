import type { Repositories, InsightsSummary } from './types';
import { reconcileCardHistory } from '../reconciliation';
import { calculateRetrievability, DEFAULT_FSRS_CONFIG } from '../engine/fsrsAdapter';

interface WeakAreaAccumulator {
  domainId: string;
  topicId: string;
  reviewedCardCount: number;
  totalRetrievability: number;
}

export class InsightsService {
  constructor(private repos: Repositories) {}

  async getInsights(): Promise<InsightsSummary> {
    const [items, cards, taxonomy] = await Promise.all([
      this.repos.knowledge.list(),
      this.repos.reviewCards.list(),
      this.repos.taxonomy.get(),
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
    const activeItemsById = new Map(activeItems.map((item) => [item.id, item]));
    const weakAreasByDomainAndTopic = new Map<string, Map<string, WeakAreaAccumulator>>();

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

          const item = activeItemsById.get(card.knowledgeItemId);
          if (item) {
            let topicsById = weakAreasByDomainAndTopic.get(item.taxonomy.domainId);
            if (!topicsById) {
              topicsById = new Map();
              weakAreasByDomainAndTopic.set(item.taxonomy.domainId, topicsById);
            }

            let weakArea = topicsById.get(item.taxonomy.topicId);
            if (!weakArea) {
              weakArea = {
                domainId: item.taxonomy.domainId,
                topicId: item.taxonomy.topicId,
                reviewedCardCount: 0,
                totalRetrievability: 0,
              };
              topicsById.set(item.taxonomy.topicId, weakArea);
            }

            weakArea.reviewedCardCount++;
            weakArea.totalRetrievability += r;
          }
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
    const domainNames = new Map(taxonomy?.domains.map((domain) => [domain.id, domain.name]));
    const topicNames = new Map(taxonomy?.topics.map((topic) => [topic.id, topic.name]));
    const weakAreas = Array.from(weakAreasByDomainAndTopic.values())
      .flatMap((topicsById) => Array.from(topicsById.values()))
      .map((weakArea) => ({
        domainId: weakArea.domainId,
        domainName: domainNames.get(weakArea.domainId) ?? weakArea.domainId,
        topicId: weakArea.topicId,
        topicName: topicNames.get(weakArea.topicId) ?? weakArea.topicId,
        reviewedCardCount: weakArea.reviewedCardCount,
        averageRetrievability: Math.round(
          (weakArea.totalRetrievability / weakArea.reviewedCardCount) * 100,
        ),
      }))
      .sort((left, right) => (
        left.averageRetrievability - right.averageRetrievability
        || right.reviewedCardCount - left.reviewedCardCount
        || left.topicId.localeCompare(right.topicId)
      ))
      .slice(0, 5);

    return {
      totalActiveItems: activeItems.length,
      totalActiveCards: activeCards.length,
      averageRetrievability,
      weakAreas,
      needsReviewCount,
      reviewedTodayCount,
      stageCounts,
      reconciliationErrors: reconciliationErrors.length > 0 ? reconciliationErrors : undefined,
    };
  }
}
