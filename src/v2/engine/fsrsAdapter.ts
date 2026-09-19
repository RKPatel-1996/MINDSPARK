import {
  fsrs,
  createEmptyCard,
  generatorParameters,
  Rating,
  State,
  type Card as FSRSCard,
  type RecordLogItem,
} from 'ts-fsrs';
import type { CardState, CardStage } from '../domain/cardState';
import {
  DEFAULT_SCHEDULER_IDENTITY,
  type ReviewRating,
  type SchedulerMetadata,
} from '../domain/event';
import {
  DEFAULT_PARAMETER_SET,
  type SchedulerParameterSet,
} from '../domain/schedulerParameterSet';

/**
 * FSRS Configuration
 * Centralized rather than scattered constants.
 * Default desired retention is 0.90 per V2 architecture specification.
 */
export interface FSRSConfig {
  desiredRetention: number;
  enableFuzz?: boolean;
  parameterSet?: SchedulerParameterSet;
}

export const DEFAULT_FSRS_CONFIG: Readonly<FSRSConfig> = Object.freeze({
  desiredRetention: 0.90,
  enableFuzz: false, // Keep scheduling deterministic for pure testability and stable queues
  parameterSet: DEFAULT_PARAMETER_SET,
});

/**
 * State and Rating mappings between domain representations and ts-fsrs enums
 */
export function domainStageToFsrsState(stage: CardStage): State {
  switch (stage) {
    case 'new':
      return State.New;
    case 'learning':
      return State.Learning;
    case 'review':
      return State.Review;
    case 'relearning':
      return State.Relearning;
  }
}

export function fsrsStateToDomainStage(state: State): CardStage {
  switch (state) {
    case State.New:
      return 'new';
    case State.Learning:
      return 'learning';
    case State.Review:
      return 'review';
    case State.Relearning:
      return 'relearning';
    default:
      return 'review';
  }
}

export function domainRatingToFsrsRating(rating: ReviewRating): Rating {
  switch (rating) {
    case 'again':
      return Rating.Again;
    case 'hard':
      return Rating.Hard;
    case 'good':
      return Rating.Good;
    case 'easy':
      return Rating.Easy;
  }
}

export function fsrsRatingToDomainRating(rating: Rating): ReviewRating {
  switch (rating) {
    case Rating.Again:
      return 'again';
    case Rating.Hard:
      return 'hard';
    case Rating.Good:
      return 'good';
    case Rating.Easy:
      return 'easy';
    default:
      return 'again';
  }
}

/**
 * Converts domain CardState to ts-fsrs internal Card.
 * Restores learning_steps directly from domain.learningSteps (never derived from reps).
 */
export function domainToFsrsCard(domain: CardState): FSRSCard {
  return {
    due: new Date(domain.due),
    stability: domain.stability,
    difficulty: domain.difficulty,
    elapsed_days: domain.elapsedDays,
    scheduled_days: domain.scheduledDays,
    reps: domain.reps,
    lapses: domain.lapses,
    state: domainStageToFsrsState(domain.state),
    last_review: domain.lastReview ? new Date(domain.lastReview) : undefined,
    learning_steps: domain.learningSteps,
  };
}

/**
 * Converts ts-fsrs Card back to domain CardState.
 * Explicitly copies fsrsCard.learning_steps without rounding errors.
 */
export function fsrsToDomainCard(fsrsCard: FSRSCard, cardId: string): CardState {
  return {
    cardId,
    due: fsrsCard.due.toISOString(),
    stability: fsrsCard.stability,
    difficulty: fsrsCard.difficulty,
    elapsedDays: fsrsCard.elapsed_days,
    scheduledDays: fsrsCard.scheduled_days,
    reps: fsrsCard.reps,
    lapses: fsrsCard.lapses,
    learningSteps: fsrsCard.learning_steps ?? 0,
    state: fsrsStateToDomainStage(fsrsCard.state),
    lastReview: fsrsCard.last_review ? fsrsCard.last_review.toISOString() : undefined,
    schemaVersion: 1,
  };
}

export function getFsrsInstance(config: FSRSConfig = DEFAULT_FSRS_CONFIG) {
  const pSet = config.parameterSet ?? DEFAULT_PARAMETER_SET;
  const params = generatorParameters({
    request_retention: config.desiredRetention,
    maximum_interval: pSet.maximumInterval,
    enable_fuzz: config.enableFuzz ?? false,
    w: [...pSet.weights] as any,
    learning_steps: [...pSet.learningSteps] as any,
    relearning_steps: [...pSet.relearningSteps] as any,
    enable_short_term: pSet.enableShortTerm,
  });
  return fsrs(params);
}

/**
 * Creates initial CardState for a newly registered ReviewCard.
 * Always initializes learningSteps = 0.
 */
export function createInitialCardState(cardId: string, now: Date = new Date()): CardState {
  const empty = createEmptyCard(now);
  return fsrsToDomainCard(empty, cardId);
}

export interface ScheduledReviewResult {
  nextState: CardState;
  intervalDays: number;
  stability: number;
  difficulty: number;
  scheduledDays: number;
  schedulerMetadata: SchedulerMetadata;
}

/**
 * Schedules a review for a card using FSRS mathematics without custom multipliers.
 */
export function scheduleReview(
  currentState: CardState,
  rating: ReviewRating,
  reviewTime: Date = new Date(),
  config: FSRSConfig = DEFAULT_FSRS_CONFIG,
): ScheduledReviewResult {
  const instance = getFsrsInstance(config);
  const card = domainToFsrsCard(currentState);
  const fsrsRating = domainRatingToFsrsRating(rating);

  const repeated = instance.repeat(card, reviewTime);
  const recordLog: RecordLogItem = repeated[fsrsRating];

  const nextDomainCard = fsrsToDomainCard(recordLog.card, currentState.cardId);
  const pSet = config.parameterSet ?? DEFAULT_PARAMETER_SET;

  return {
    nextState: nextDomainCard,
    intervalDays: recordLog.card.scheduled_days,
    stability: nextDomainCard.stability,
    difficulty: nextDomainCard.difficulty,
    scheduledDays: recordLog.card.scheduled_days,
    schedulerMetadata: {
      algorithm: pSet.algorithm,
      implementation: pSet.implementation,
      implementationVersion: pSet.implementationVersion,
      parameterSetId: pSet.id,
      scheduledDays: recordLog.card.scheduled_days,
      stability: nextDomainCard.stability,
      difficulty: nextDomainCard.difficulty,
      desiredRetention: config.desiredRetention,
    },
  };
}

/**
 * Calculates current retrievability (R) of a card as a value from 0 to 1.
 * New cards or cards with no reviews have 0 retrievability.
 */
export function calculateRetrievability(
  cardState: CardState,
  asOf: Date = new Date(),
  config: FSRSConfig = DEFAULT_FSRS_CONFIG,
): number {
  if (cardState.state === 'new' || !cardState.lastReview) {
    return 0;
  }
  const instance = getFsrsInstance(config);
  const card = domainToFsrsCard(cardState);
  const r = instance.get_retrievability(card, asOf, false);
  return typeof r === 'number' ? Math.max(0, Math.min(1, r)) : 0;
}

export interface SchedulingOptionForecast {
  nextDue: string;
  intervalDays: number;
  state: CardStage;
  stability: number;
  difficulty: number;
}

/**
 * Returns scheduling forecast for each rating (Again, Hard, Good, Easy)
 * useful for UI button previews.
 */
export function getSchedulingForecast(
  currentState: CardState,
  reviewTime: Date = new Date(),
  config: FSRSConfig = DEFAULT_FSRS_CONFIG,
): Record<ReviewRating, SchedulingOptionForecast> {
  const instance = getFsrsInstance(config);
  const card = domainToFsrsCard(currentState);
  const repeated = instance.repeat(card, reviewTime);

  const formatOption = (item: RecordLogItem): SchedulingOptionForecast => {
    return {
      nextDue: item.card.due.toISOString(),
      intervalDays: item.card.scheduled_days,
      state: fsrsStateToDomainStage(item.card.state),
      stability: Number(item.card.stability.toFixed(4)),
      difficulty: Number(item.card.difficulty.toFixed(4)),
    };
  };

  return {
    again: formatOption(repeated[Rating.Again]),
    hard: formatOption(repeated[Rating.Hard]),
    good: formatOption(repeated[Rating.Good]),
    easy: formatOption(repeated[Rating.Easy]),
  };
}
