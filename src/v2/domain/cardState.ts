import { z } from 'zod';
import { opaqueIdSchema } from './id';

/**
 * CardState represents the current FSRS scheduling state of a ReviewCard.
 * It is derived entirely from review history and FSRS calculations.
 */

export const cardStageSchema = z.enum(['new', 'learning', 'review', 'relearning']);
export type CardStage = z.infer<typeof cardStageSchema>;

export const cardStateSchema = z.object({
  cardId: opaqueIdSchema,
  due: z.string().datetime(),
  stability: z.number().nonnegative(),
  difficulty: z.number().min(0).max(10),
  elapsedDays: z.number().nonnegative(),
  scheduledDays: z.number().nonnegative(),
  reps: z.number().int().nonnegative(),
  lapses: z.number().int().nonnegative(),
  learningSteps: z.number().int().nonnegative(),
  state: cardStageSchema,
  lastReview: z.string().datetime().optional(),
  schemaVersion: z.literal(1).default(1),
});

export type CardState = z.infer<typeof cardStateSchema>;
