import { z } from 'zod';
import { opaqueIdSchema } from './id';
import { taxonomyReferenceSchema, controlledTagSchema } from './taxonomy';

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

export const knowledgeItemSchema = z.object({
  id: opaqueIdSchema,
  schemaVersion: z.literal(1),
  title: z.string().min(1),
  content: z.string().min(1), // Core knowledge text
  explanationMarkdown: z.string().optional(), // Optional Markdown explanation / context
  taxonomy: taxonomyReferenceSchema,
  tags: z.array(controlledTagSchema).optional(),
  status: knowledgeStatusSchema,
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  sources: z.array(sourceReferenceSchema).optional(),
});

export type KnowledgeItem = z.infer<typeof knowledgeItemSchema>;
