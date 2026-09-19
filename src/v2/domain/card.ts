import { z } from 'zod';
import { opaqueIdSchema } from './id';

/**
 * MindSpark V2 ReviewCard Specification
 * 
 * ReviewCard is a discriminated union of retrieval methods.
 * Supported card types strictly:
 * - free_recall
 * - flashcard
 * - mcq
 * - true_false
 * 
 * Every ReviewCard references exactly one KnowledgeItem.
 * One KnowledgeItem may have multiple cards, but one high-quality card
 * is the normal/default case.
 */

export const cardTypeSchema = z.enum(['free_recall', 'flashcard', 'mcq', 'true_false']);
export type CardType = z.infer<typeof cardTypeSchema>;

export const suspendedReasonSchema = z.enum([
  'requires_clarification',
  'flagged_by_user',
  'draft_incomplete',
]);
export type SuspendedReason = z.infer<typeof suspendedReasonSchema>;

const baseCardObject = z.object({
  id: opaqueIdSchema,
  knowledgeItemId: opaqueIdSchema,
  schemaVersion: z.literal(1),
  suspended: z.boolean().default(false),
  suspendedReason: suspendedReasonSchema.optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

function validateSuspensionInvariant<T extends z.ZodTypeAny>(schema: T) {
  return schema.refine(
    (data: any) => {
      if (data.suspended) {
        return data.suspendedReason !== undefined;
      }
      return data.suspendedReason === undefined;
    },
    {
      message: 'When suspended is true, suspendedReason is required. When suspended is false, suspendedReason must be absent.',
      path: ['suspendedReason'],
    }
  );
}

export const freeRecallCardSchema = validateSuspensionInvariant(
  baseCardObject.extend({
    type: z.literal('free_recall'),
    prompt: z.string().min(1),
    answerGuidance: z.string().min(1),
  })
);
export type FreeRecallCard = z.infer<typeof freeRecallCardSchema>;

export const flashcardCardSchema = validateSuspensionInvariant(
  baseCardObject.extend({
    type: z.literal('flashcard'),
    front: z.string().min(1),
    back: z.string().min(1),
  })
);
export type FlashcardCard = z.infer<typeof flashcardCardSchema>;

export const mcqCardSchema = validateSuspensionInvariant(
  baseCardObject.extend({
    type: z.literal('mcq'),
    question: z.string().min(1),
    options: z.array(z.string().min(1)).min(2, 'MCQ requires at least 2 options'),
    correctOptionIndex: z.number().int().min(0),
    explanation: z.string().optional(),
  })
).refine((data: any) => data.correctOptionIndex < data.options.length, {
  message: 'correctOptionIndex must be a valid index into the options array',
  path: ['correctOptionIndex'],
}).refine((data: any) => {
  const trimmedLower = data.options.map((opt: string) => opt.trim().toLowerCase());
  return new Set(trimmedLower).size === trimmedLower.length;
}, {
  message: 'MCQ options must be unique (checked case-insensitively after trimming)',
  path: ['options'],
});
export type McqCard = z.infer<typeof mcqCardSchema>;

export const trueFalseCardSchema = validateSuspensionInvariant(
  baseCardObject.extend({
    type: z.literal('true_false'),
    statement: z.string().min(1),
    isTrue: z.boolean(),
    explanation: z.string().optional(),
  })
);
export type TrueFalseCard = z.infer<typeof trueFalseCardSchema>;

export const reviewCardSchema = z.discriminatedUnion('type', [
  freeRecallCardSchema,
  flashcardCardSchema,
  mcqCardSchema,
  trueFalseCardSchema,
]);

export type ReviewCard = z.infer<typeof reviewCardSchema>;
