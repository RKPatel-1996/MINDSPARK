import { type ReviewCard } from '../domain/card';
import { type CardState } from '../domain/cardState';
import { reviewEventSchema, type ReviewEvent, type ReviewRating } from '../domain/event';
import { type SchedulerParameterSet } from '../domain/schedulerParameterSet';
import { generateId } from '../domain/id';
import { scheduleReview } from '../engine/fsrsAdapter';

export interface ReviewApplicationInput {
  card: ReviewCard;
  currentState: CardState;
  rating: ReviewRating;
  objectiveCorrect: boolean | null;
  guessedOrStruggled: boolean;
  deviceId: string;
  reviewTimestamp: string;
  desiredRetention: number;
  parameterSet: SchedulerParameterSet;
  schemaVersion: number;
  durationMs?: number;
}

export interface ReviewApplicationResult {
  provisionalState: CardState;
  event: ReviewEvent;
}

/**
 * Pure function to apply a new review to a known state and generate an event.
 */
export function applyReviewToCard(input: ReviewApplicationInput): ReviewApplicationResult {
  if (input.currentState.cardId !== input.card.id) {
    throw new Error('State cardId does not match card id');
  }

  const provisionalRecord = scheduleReview(
    input.currentState,
    input.rating,
    new Date(input.reviewTimestamp),
    {
      desiredRetention: input.desiredRetention,
      parameterSet: input.parameterSet,
      enableFuzz: false
    }
  );

  const eventData = {
    id: generateId(),
    cardId: input.card.id,
    knowledgeItemId: input.card.knowledgeItemId,
    reviewTimestamp: input.reviewTimestamp,
    rating: input.rating,
    cardType: input.card.type,
    objectiveCorrect: input.objectiveCorrect,
    guessedOrStruggled: input.guessedOrStruggled,
    deviceId: input.deviceId,
    durationMs: input.durationMs,
    schedulerMetadata: {
      algorithm: 'fsrs-6',
      implementation: 'ts-fsrs',
      implementationVersion: '5.4.2',
      parameterSetId: input.parameterSet.id,
      desiredRetention: input.desiredRetention,
      scheduledDays: provisionalRecord.scheduledDays,
      stability: provisionalRecord.stability,
      difficulty: provisionalRecord.difficulty
    },
    schemaVersion: 1
  };

  const event = reviewEventSchema.parse(eventData);

  return {
    provisionalState: provisionalRecord.nextState,
    event
  };
}
