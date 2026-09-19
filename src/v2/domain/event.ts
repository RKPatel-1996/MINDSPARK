import { z } from 'zod';
import { cardTypeSchema } from './card';
import { opaqueIdSchema } from './id';

/**
 * ReviewRating represents the user assessment or outcome passed to FSRS:
 * - again (1): Complete blackout or wrong answer
 * - hard (2): Recalled with significant difficulty or hesitation
 * - good (3): Recalled correctly with appropriate effort
 * - easy (4): Recalled immediately and effortlessly
 */
export const reviewRatingSchema = z.enum(['again', 'hard', 'good', 'easy']);
export type ReviewRating = z.infer<typeof reviewRatingSchema>;

/**
 * Explicit scheduler configuration and identity constants.
 * Algorithm and implementation versions are distinct concepts.
 */
export const DEFAULT_SCHEDULER_IDENTITY = {
  algorithm: 'fsrs-6',
  implementation: 'ts-fsrs',
  implementationVersion: '5.4.2',
  parameterSetId: 'fsrs-6-default',
  desiredRetention: 0.90,
} as const;

export const schedulerMetadataSchema = z.object({
  algorithm: z.string().min(1), // e.g. 'fsrs-6'
  implementation: z.string().min(1), // e.g. 'ts-fsrs'
  implementationVersion: z.string().min(1), // e.g. '5.4.2'
  parameterSetId: z.string().min(1), // stable identifier e.g. 'fsrs-6-default'
  scheduledDays: z.number().nonnegative(),
  stability: z.number().nonnegative(),
  difficulty: z.number().min(0).max(10),
  desiredRetention: z.number().min(0.7).max(0.99),
});
export type SchedulerMetadata = z.infer<typeof schedulerMetadataSchema>;

/**
 * ReviewEvent is append-only historical evidence that a retrieval attempt occurred.
 * It is immutable source evidence; CardState is a derived/rebuildable snapshot.
 * 
 * Invariants:
 * - deviceId must be explicitly supplied (no silent defaults)
 * - MCQ and true_false require an objective boolean correctness
 * - free_recall, flashcard, and cloze must have objectiveCorrect: null (subjective self-evaluation)
 */
export const reviewEventSchema = z.object({
  id: opaqueIdSchema,
  cardId: opaqueIdSchema,
  knowledgeItemId: opaqueIdSchema,
  reviewTimestamp: z.string().datetime(),
  rating: reviewRatingSchema,
  cardType: cardTypeSchema,
  objectiveCorrect: z.boolean().nullable(),
  guessedOrStruggled: z.boolean(),
  durationMs: z.number().int().nonnegative().optional(),
  deviceId: z.string().min(1), // Explicitly required, no silent fallback
  schedulerMetadata: schedulerMetadataSchema,
  schemaVersion: z.literal(1).default(1),
}).refine((data) => {
  if (data.cardType === 'mcq' || data.cardType === 'true_false') {
    return typeof data.objectiveCorrect === 'boolean';
  }
  if (data.cardType === 'free_recall' || data.cardType === 'flashcard' || data.cardType === 'cloze') {
    return data.objectiveCorrect === null;
  }
  return false;
}, {
  message: 'objectiveCorrect must be boolean for mcq and true_false, and null for free_recall, flashcard, and cloze',
  path: ['objectiveCorrect'],
});

export type ReviewEvent = z.infer<typeof reviewEventSchema>;

export const preciseTimestampSchema = z.object({
  seconds: z.number().int(),
  nanoseconds: z.number().int().min(0).max(999999999)
});
export type PreciseTimestamp = z.infer<typeof preciseTimestampSchema>;

export const eventWatermarkSchema = z.object({
  serverReceivedAt: preciseTimestampSchema,
  eventId: opaqueIdSchema
});
export type EventWatermark = z.infer<typeof eventWatermarkSchema>;
