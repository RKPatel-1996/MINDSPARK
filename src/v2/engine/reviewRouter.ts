import type { ReviewCard } from '../domain/card';
import type { KnowledgeItem } from '../domain/knowledge';
import type { CardState, CardStage } from '../domain/cardState';
import { calculateRetrievability, DEFAULT_FSRS_CONFIG, type FSRSConfig } from './fsrsAdapter';

export interface CandidateCardBundle {
  card: ReviewCard;
  knowledgeItem: KnowledgeItem;
  cardState: CardState;
}

export interface RouterConfig {
  /**
   * Maximum number of new cards introduced in a single calendar day.
   * Conservative default is 5.
   */
  maxDailyNewCards: number;

  /**
   * Lookahead horizon in hours for opportunistic early reviews
   * when neither due nor new cards are available.
   * Default is 24 hours.
   */
  reserveHorizonHours: number;

  /**
   * Retrievability tolerance within which two review cards are considered
   * "similarly urgent" for topic diversity tie-breaking. Default 0.02 (2%).
   */
  retrievabilityTolerance: number;

  /**
   * Milliseconds tolerance for learning/relearning due time comparison.
   * Default is 60,000 ms (1 minute).
   */
  learningDueToleranceMs: number;

  fsrsConfig: FSRSConfig;
}

export const DEFAULT_ROUTER_CONFIG: Readonly<RouterConfig> = Object.freeze({
  maxDailyNewCards: 5,
  reserveHorizonHours: 24,
  retrievabilityTolerance: 0.02,
  learningDueToleranceMs: 60_000,
  fsrsConfig: DEFAULT_FSRS_CONFIG,
});

export interface RouterContext {
  /**
   * Current evaluation timestamp. Defaults to new Date() if omitted.
   */
  now?: Date;

  /**
   * Card IDs specifically buried for the active burying period (e.g. siblings of reviewed cards).
   * After reviewing card A, sibling cards B, C are buried, while card A itself is governed purely by its FSRS due time.
   */
  buriedCardIds?: Iterable<string>;

  /**
   * KnowledgeItem IDs buried for the active burying period. Kept for backwards compatibility.
   */
  buriedKnowledgeItemIds?: Iterable<string>;

  /**
   * Alias for backwards compatibility with session-level contexts.
   */
  reviewedKnowledgeItemIds?: Iterable<string>;

  /**
   * Ordered list of recently reviewed topic IDs, most recent first.
   * Used as a tie-breaker when multiple candidates are similarly urgent.
   */
  recentTopicIds?: string[];

  /**
   * Number of new cards already introduced today.
   */
  newCardsIntroducedToday?: number;

  /**
   * Router policy configuration overrides.
   */
  config?: Partial<RouterConfig>;
}

export type RouterSelectionReason =
  | 'relearning_due'
  | 'learning_due'
  | 'review_due'
  | 'new_card'
  | 'near_due_reserve';

export interface RouterSelectionEvidence {
  due: string;
  retrievability: number;
  state: CardStage;
  topicId: string;
  tier: 'learning_relearning' | 'review_due' | 'new_card' | 'near_due_reserve';
}

export interface RouterStats {
  totalEvaluated: number;
  activeCandidates: number;
  buriedCount: number;
  suspendedCount: number;
  archivedCount: number;
  needsReviewCount: number;
  learningDueCount: number;
  reviewDueCount: number;
  newEligibleCount: number;
  nearDueReserveCount: number;
}

export type RouterResult =
  | {
      status: 'selected';
      card: ReviewCard;
      knowledgeItem: KnowledgeItem;
      cardState: CardState;
      reason: RouterSelectionReason;
      evidence: RouterSelectionEvidence;
      stats: RouterStats;
    }
  | {
      status: 'caught_up';
      card: null;
      knowledgeItem: null;
      cardState: null;
      reason: 'caught_up';
      message: string;
      stats: RouterStats;
    };

interface InternalCandidate extends CandidateCardBundle {
  retrievability: number;
  dueTimeMs: number;
}

/**
 * Pure function: Selects the next highest-value card worth reviewing now.
 * 
 * Strict Router Policy:
 * 1. Exclude inactive/archived/needs_review items and genuinely suspended cards.
 *    (Distinguishes archivedCount and needsReviewCount in stats)
 * 2. Exclude sibling cards of knowledge items buried for the active burying period.
 * 3. Tier 1: Eligible learning/relearning cards whose due time has arrived.
 * 4. Tier 2: Normal review cards whose due time has arrived (lower retrievability first).
 * 5. Tier 3: New cards, only if no cards are due and daily limit is not reached.
 * 6. Tier 4: Near-due reserve cards within horizon, only if neither due nor new cards exist.
 * 7. Else: Return explicit caught-up result.
 */
export function selectNextCard(
  candidates: readonly CandidateCardBundle[],
  context: RouterContext = {},
): RouterResult {
  const now = context.now ?? new Date();
  const nowMs = now.getTime();

  const config: RouterConfig = {
    ...DEFAULT_ROUTER_CONFIG,
    ...context.config,
    fsrsConfig: {
      ...DEFAULT_ROUTER_CONFIG.fsrsConfig,
      ...context.config?.fsrsConfig,
    },
  };

  const buriedCardIds = new Set<string>(context.buriedCardIds ?? []);
  const buriedKnowledgeItemIds = new Set<string>([
    ...(context.buriedKnowledgeItemIds ?? []),
    ...(context.reviewedKnowledgeItemIds ?? []),
  ]);

  const mostRecentTopicId = context.recentTopicIds && context.recentTopicIds.length > 0
    ? context.recentTopicIds[0]
    : undefined;
  const newCardsIntroducedToday = context.newCardsIntroducedToday ?? 0;

  const stats: RouterStats = {
    totalEvaluated: candidates.length,
    activeCandidates: 0,
    buriedCount: 0,
    suspendedCount: 0,
    archivedCount: 0,
    needsReviewCount: 0,
    learningDueCount: 0,
    reviewDueCount: 0,
    newEligibleCount: 0,
    nearDueReserveCount: 0,
  };

  const learningDueList: InternalCandidate[] = [];
  const reviewDueList: InternalCandidate[] = [];
  const newCardList: InternalCandidate[] = [];
  const nearDueReserveList: InternalCandidate[] = [];

  const reserveHorizonMs = config.reserveHorizonHours * 60 * 60 * 1000;

  for (const bundle of candidates) {
    const { card, knowledgeItem, cardState } = bundle;

    // 1. Check knowledge item status with explicit accounting
    if (knowledgeItem.status === 'archived') {
      stats.archivedCount++;
      continue;
    }
    if (knowledgeItem.status === 'needs_review') {
      stats.needsReviewCount++;
      continue;
    }
    if (knowledgeItem.status !== 'active') {
      stats.archivedCount++;
      continue;
    }

    // 2. Check card suspension status (all genuinely suspended cards excluded)
    if (card.suspended) {
      stats.suspendedCount++;
      continue;
    }

    // 3. Sibling burying check
    if (buriedCardIds.has(card.id) || buriedKnowledgeItemIds.has(knowledgeItem.id)) {
      stats.buriedCount++;
      continue;
    }

    stats.activeCandidates++;

    const dueTimeMs = new Date(cardState.due).getTime();
    const retrievability = calculateRetrievability(cardState, now, config.fsrsConfig);
    const internal: InternalCandidate = {
      ...bundle,
      retrievability,
      dueTimeMs,
    };

    // Classify into tiers
    if (cardState.state === 'learning' || cardState.state === 'relearning') {
      if (dueTimeMs <= nowMs) {
        learningDueList.push(internal);
        stats.learningDueCount++;
      }
    } else if (cardState.state === 'review') {
      if (dueTimeMs <= nowMs) {
        reviewDueList.push(internal);
        stats.reviewDueCount++;
      } else if (dueTimeMs <= nowMs + reserveHorizonMs) {
        nearDueReserveList.push(internal);
        stats.nearDueReserveCount++;
      }
    } else if (cardState.state === 'new') {
      if (newCardsIntroducedToday < config.maxDailyNewCards) {
        newCardList.push(internal);
        stats.newEligibleCount++;
      }
    }
  }

  // Tier 1: Learning / Relearning due
  if (learningDueList.length > 0) {
    learningDueList.sort((a, b) => {
      const timeDiff = a.dueTimeMs - b.dueTimeMs;
      // If due times are within tolerance, mildly prefer different recent topic
      if (Math.abs(timeDiff) <= config.learningDueToleranceMs && mostRecentTopicId) {
        const aMatches = a.knowledgeItem.taxonomy.topicId === mostRecentTopicId;
        const bMatches = b.knowledgeItem.taxonomy.topicId === mostRecentTopicId;
        if (aMatches !== bMatches) {
          return aMatches ? 1 : -1;
        }
      }
      return timeDiff;
    });

    const chosen = learningDueList[0];
    const reason: RouterSelectionReason =
      chosen.cardState.state === 'relearning' ? 'relearning_due' : 'learning_due';

    return {
      status: 'selected',
      card: chosen.card,
      knowledgeItem: chosen.knowledgeItem,
      cardState: chosen.cardState,
      reason,
      evidence: {
        due: chosen.cardState.due,
        retrievability: chosen.retrievability,
        state: chosen.cardState.state,
        topicId: chosen.knowledgeItem.taxonomy.topicId,
        tier: 'learning_relearning',
      },
      stats,
    };
  }

  // Tier 2: Normal review due
  if (reviewDueList.length > 0) {
    reviewDueList.sort((a, b) => {
      const rDiff = a.retrievability - b.retrievability;
      // Lower retrievability is more urgent.
      // If retrievability is within tolerance, mildly prefer a different recent topic.
      // Urgency strictly overrides diversity when retrievability difference exceeds tolerance.
      if (Math.abs(rDiff) <= config.retrievabilityTolerance && mostRecentTopicId) {
        const aMatches = a.knowledgeItem.taxonomy.topicId === mostRecentTopicId;
        const bMatches = b.knowledgeItem.taxonomy.topicId === mostRecentTopicId;
        if (aMatches !== bMatches) {
          return aMatches ? 1 : -1; // Non-matching topic comes first
        }
      }
      return rDiff;
    });

    const chosen = reviewDueList[0];
    return {
      status: 'selected',
      card: chosen.card,
      knowledgeItem: chosen.knowledgeItem,
      cardState: chosen.cardState,
      reason: 'review_due',
      evidence: {
        due: chosen.cardState.due,
        retrievability: chosen.retrievability,
        state: chosen.cardState.state,
        topicId: chosen.knowledgeItem.taxonomy.topicId,
        tier: 'review_due',
      },
      stats,
    };
  }

  // Tier 3: New cards (only when there are no due cards)
  if (newCardList.length > 0) {
    newCardList.sort((a, b) => {
      if (mostRecentTopicId) {
        const aMatches = a.knowledgeItem.taxonomy.topicId === mostRecentTopicId;
        const bMatches = b.knowledgeItem.taxonomy.topicId === mostRecentTopicId;
        if (aMatches !== bMatches) {
          return aMatches ? 1 : -1;
        }
      }
      return (a.card.createdAt as string).localeCompare(b.card.createdAt as string);
    });

    const chosen = newCardList[0];
    return {
      status: 'selected',
      card: chosen.card,
      knowledgeItem: chosen.knowledgeItem,
      cardState: chosen.cardState,
      reason: 'new_card',
      evidence: {
        due: chosen.cardState.due,
        retrievability: 0,
        state: 'new',
        topicId: chosen.knowledgeItem.taxonomy.topicId,
        tier: 'new_card',
      },
      stats,
    };
  }

  // Tier 4: Near-due reserve cards (only when neither due nor new candidates exist)
  if (nearDueReserveList.length > 0) {
    nearDueReserveList.sort((a, b) => {
      // Sort by due time ascending (soonest due first)
      const dueDiff = a.dueTimeMs - b.dueTimeMs;
      if (Math.abs(dueDiff) <= config.learningDueToleranceMs && mostRecentTopicId) {
        const aMatches = a.knowledgeItem.taxonomy.topicId === mostRecentTopicId;
        const bMatches = b.knowledgeItem.taxonomy.topicId === mostRecentTopicId;
        if (aMatches !== bMatches) {
          return aMatches ? 1 : -1;
        }
      }
      return dueDiff;
    });

    const chosen = nearDueReserveList[0];
    return {
      status: 'selected',
      card: chosen.card,
      knowledgeItem: chosen.knowledgeItem,
      cardState: chosen.cardState,
      reason: 'near_due_reserve',
      evidence: {
        due: chosen.cardState.due,
        retrievability: chosen.retrievability,
        state: chosen.cardState.state,
        topicId: chosen.knowledgeItem.taxonomy.topicId,
        tier: 'near_due_reserve',
      },
      stats,
    };
  }

  // Tier 5: Caught up
  return {
    status: 'caught_up',
    card: null,
    knowledgeItem: null,
    cardState: null,
    reason: 'caught_up',
    message: 'All caught up! No reviews are currently due.',
    stats,
  };
}
