import { z } from 'zod';
import { taxonomyReferenceSchema, controlledTagSchema } from '../domain/taxonomy';
import { sourceReferenceSchema } from '../domain/knowledge';

/**
 * AI Import DTO Schemas
 * 
 * Strict contract:
 * - Intentionally does not require IDs or timestamps (generated deterministically/cryptographically in local domain).
 * - All schemas are .strict() to reject unknown/unsupported keys.
 * - Text fields are trimmed.
 * - MCQ options are checked for uniqueness case-insensitively after trimming.
 */

export const knowledgeItemDraftSchema = z.object({
  title: z.string().trim().min(1, 'Title is required'),
  content: z.string().trim().min(1, 'Core knowledge content is required'),
  explanationMarkdown: z.string().trim().optional(),
  taxonomy: taxonomyReferenceSchema.strict(),
  tags: z.array(controlledTagSchema).optional(),
  sources: z.array(sourceReferenceSchema.strict()).optional(),
}).strict();

export type KnowledgeItemDraft = z.infer<typeof knowledgeItemDraftSchema>;

export const freeRecallDraftSchema = z.object({
  type: z.literal('free_recall'),
  prompt: z.string().trim().min(1, 'Free recall prompt is required'),
  answerGuidance: z.string().trim().min(1, 'Answer guidance is required'),
}).strict();

export type FreeRecallDraft = z.infer<typeof freeRecallDraftSchema>;

export const flashcardDraftSchema = z.object({
  type: z.literal('flashcard'),
  front: z.string().trim().min(1, 'Flashcard front is required'),
  back: z.string().trim().min(1, 'Flashcard back is required'),
}).strict();

export type FlashcardDraft = z.infer<typeof flashcardDraftSchema>;

export const mcqDraftSchema = z.object({
  type: z.literal('mcq'),
  question: z.string().trim().min(1, 'MCQ question is required'),
  options: z.array(z.string().trim().min(1, 'Options must not be empty strings'))
    .min(2, 'MCQ must have at least 2 options'),
  correctOptionIndex: z.number().int('correctOptionIndex must be an integer').min(0),
  explanation: z.string().trim().optional(),
}).strict().refine((data) => data.correctOptionIndex < data.options.length, {
  message: 'correctOptionIndex out of bounds for provided options',
  path: ['correctOptionIndex'],
}).refine((data) => {
  const trimmedLower = data.options.map((opt) => opt.trim().toLowerCase());
  return new Set(trimmedLower).size === trimmedLower.length;
}, {
  message: 'MCQ options must be unique (checked case-insensitively after trimming)',
  path: ['options'],
});

export type McqDraft = z.infer<typeof mcqDraftSchema>;

export const trueFalseDraftSchema = z.object({
  type: z.literal('true_false'),
  statement: z.string().trim().min(1, 'Statement is required'),
  isTrue: z.boolean(),
  explanation: z.string().trim().optional(),
}).strict();

export type TrueFalseDraft = z.infer<typeof trueFalseDraftSchema>;

export const clozeDraftSchema = z.object({
  type: z.literal('cloze'),
  prompt: z.string().trim().min(1, 'Cloze prompt is required'),
  answer: z.string().trim().min(1, 'Cloze answer is required'),
}).strict();

export type ClozeDraft = z.infer<typeof clozeDraftSchema>;

export const reviewCardDraftSchema = z.discriminatedUnion('type', [
  freeRecallDraftSchema,
  flashcardDraftSchema,
  mcqDraftSchema,
  trueFalseDraftSchema,
  clozeDraftSchema,
]);

export type ReviewCardDraft = z.infer<typeof reviewCardDraftSchema>;

export const importPayloadDraftSchema = z.object({
  item: knowledgeItemDraftSchema,
  cards: z.array(reviewCardDraftSchema).min(1, 'At least one ReviewCard draft is required'),
}).strict();

export type ImportPayloadDraft = z.infer<typeof importPayloadDraftSchema>;
