import type { KnowledgeItem } from '../domain/knowledge';
import type { ReviewCard } from '../domain/card';
import type { CardState, CardStage } from '../domain/cardState';
import type { ReviewEvent, ReviewRating } from '../domain/event';
import type { RouterSelectionEvidence, RouterSelectionReason, RouterStats } from '../engine/reviewRouter';
import type { Repositories } from '../persistence/memory/inMemoryRepositories';

export type { Repositories };

export interface ActiveReviewItem {
  card: ReviewCard;
  knowledgeItem: KnowledgeItem;
  cardState: CardState;
  reason: RouterSelectionReason;
  evidence: RouterSelectionEvidence;
  stats: RouterStats;
}

export type ReviewQueueState =
  | { status: 'loading' }
  | { status: 'empty'; message: string }
  | { status: 'caught_up'; message: string; stats: RouterStats }
  | { status: 'ready'; active: ActiveReviewItem }
  | { status: 'error'; message: string; cardId?: string; details?: string };

export interface ReviewSubmissionInput {
  card: ReviewCard;
  knowledgeItem: KnowledgeItem;
  currentState: CardState;
  rating: ReviewRating;
  objectiveCorrect: boolean | null;
  guessedOrStruggled: boolean;
  durationMs?: number;
}

export interface ReviewSubmissionResult {
  provisionalState: CardState;
  event: ReviewEvent;
}

export interface KnowledgeItemWithCards {
  item: KnowledgeItem;
  cards: ReviewCard[];
  cardStates: Record<string, CardState>;
  reconciliationErrors?: Record<string, string>;
}

export interface InsightsSummary {
  totalActiveItems: number;
  totalActiveCards: number;
  averageRetrievability: number | null;
  needsReviewCount: number;
  reviewedTodayCount: number;
  stageCounts: {
    new: number;
    learning: number;
    review: number;
    relearning: number;
  };
  reconciliationErrors?: Array<{ cardId: string; message: string }>;
}
