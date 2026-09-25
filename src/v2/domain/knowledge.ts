import { z } from 'zod';
import { opaqueIdSchema } from './id';
import { taxonomyReferenceSchema, controlledTagSchema } from './taxonomy';
import { contentBlocksSchema } from './contentBlock';

/**
 * Knowledge Status
 * Restricted strictly to:
 * - active: in normal use and eligible for active learning
 * - needs_review: flagged for factual update, clarification or user correction
 * - archived: retired from active review without losing history
 */
export const knowledgeStatusSchema = z.enum(['active', 'needs_review', 'archived']);
export type KnowledgeStatus = z.infer<typeof knowledgeStatusSchema>;

export const sourceReferenceSchema = z.object({
  title: z.string().min(1).optional(),
  url: z.string().url().optional(),
  citation: z.string().min(1).optional(),
});
export type SourceReference = z.infer<typeof sourceReferenceSchema>;

export const imagePlacementSchema = z.enum([
  'content',
  'review_prompt',
  'review_answer',
]);
export type ImagePlacement = z.infer<typeof imagePlacementSchema>;

export const imageReferenceSchema = z.object({
  id: opaqueIdSchema,
  storagePath: z.string().min(1),
  alt: z.string().min(1),
  caption: z.string().min(1).optional(),
  placement: imagePlacementSchema,
  cardId: opaqueIdSchema.optional(),
}).refine(
  (image) => image.placement !== 'content' || image.cardId === undefined,
  {
    message: 'Content images cannot target a specific ReviewCard',
    path: ['cardId'],
  }
);
export type ImageReference = z.infer<typeof imageReferenceSchema>;

export const knowledgeItemSchema = z.object({
  id: opaqueIdSchema,
  schemaVersion: z.literal(1),
  title: z.string().min(1),
  content: z.string().min(1), // Core knowledge text
  blocks: contentBlocksSchema.optional(), // Ordered text, code, and math content
  explanationMarkdown: z.string().optional(), // Optional Markdown explanation / context
  taxonomy: taxonomyReferenceSchema,
  tags: z.array(controlledTagSchema).optional(),
  status: knowledgeStatusSchema,
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  sources: z.array(sourceReferenceSchema).optional(),
  images: z.array(imageReferenceSchema).optional(),
});

export type KnowledgeItem = z.infer<typeof knowledgeItemSchema>;
