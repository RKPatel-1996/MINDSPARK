import { z } from 'zod';
import {
  flashcardCardSchema,
  freeRecallCardSchema,
  mcqCardSchema,
  trueFalseCardSchema,
  clozeCardSchema,
} from '../domain/card';
import { reviewEventSchema, schedulerMetadataSchema } from '../domain/event';
import { opaqueIdSchema } from '../domain/id';
import {
  imagePlacementSchema,
  knowledgeItemSchema,
  sourceReferenceSchema,
} from '../domain/knowledge';
import { schedulerParameterSetSchema } from '../domain/schedulerParameterSet';
import {
  controlledTagSchema,
  taxonomyDomainSchema,
  taxonomyReferenceSchema,
  taxonomyRegistrySchema,
  taxonomySubtopicSchema,
  taxonomyTopicSchema,
} from '../domain/taxonomy';
import { settingsSchema } from '../application/settingsService';

export const BACKUP_FORMAT = 'mindspark-backup' as const;
export const CURRENT_BACKUP_VERSION = 1 as const;

const strictSourceReferenceSchema = sourceReferenceSchema.strict();

export const portableImageReferenceV1Schema = z.object({
  id: opaqueIdSchema,
  assetId: opaqueIdSchema,
  alt: z.string().min(1),
  caption: z.string().min(1).optional(),
  placement: imagePlacementSchema,
  cardId: opaqueIdSchema.optional(),
}).strict().refine(
  (image) => image.placement !== 'content' || image.cardId === undefined,
  {
    message: 'Content images cannot target a specific ReviewCard',
    path: ['cardId'],
  },
);

export type PortableImageReferenceV1 = z.infer<typeof portableImageReferenceV1Schema>;

export const portableKnowledgeItemV1Schema = knowledgeItemSchema
  .omit({ sources: true, images: true })
  .extend({
    taxonomy: taxonomyReferenceSchema.strict(),
    sources: z.array(strictSourceReferenceSchema).optional(),
    images: z.array(portableImageReferenceV1Schema).optional(),
  })
  .strict();

export type PortableKnowledgeItemV1 = z.infer<typeof portableKnowledgeItemV1Schema>;

const exactObjectKeys = (keys: readonly string[]) => {
  const shape: Record<string, z.ZodOptional<z.ZodUnknown>> = {};
  for (const key of keys) {
    shape[key] = z.unknown().optional();
  }
  return z.object(shape).strict();
};

const baseCardKeys = [
  'id',
  'knowledgeItemId',
  'schemaVersion',
  'suspended',
  'suspendedReason',
  'createdAt',
  'updatedAt',
  'type',
] as const;

const strictReviewCardInputSchema = z.union([
  exactObjectKeys([...baseCardKeys, 'prompt', 'answerGuidance']).pipe(freeRecallCardSchema),
  exactObjectKeys([...baseCardKeys, 'front', 'back']).pipe(flashcardCardSchema),
  exactObjectKeys([
    ...baseCardKeys,
    'question',
    'options',
    'correctOptionIndex',
    'explanation',
  ]).pipe(mcqCardSchema),
  exactObjectKeys([...baseCardKeys, 'statement', 'isTrue', 'explanation']).pipe(
    trueFalseCardSchema,
  ),
  exactObjectKeys([...baseCardKeys, 'prompt', 'answer']).pipe(clozeCardSchema),
]);

export const backupReviewCardV1Schema = strictReviewCardInputSchema;

const strictSchedulerMetadataSchema = schedulerMetadataSchema.strict();

const strictReviewEventInputSchema = z.object({
  id: z.unknown().optional(),
  cardId: z.unknown().optional(),
  knowledgeItemId: z.unknown().optional(),
  reviewTimestamp: z.unknown().optional(),
  rating: z.unknown().optional(),
  cardType: z.unknown().optional(),
  objectiveCorrect: z.unknown().optional(),
  guessedOrStruggled: z.unknown().optional(),
  durationMs: z.unknown().optional(),
  deviceId: z.unknown().optional(),
  schedulerMetadata: strictSchedulerMetadataSchema,
  schemaVersion: z.unknown().optional(),
}).strict();

export const backupReviewEventV1Schema = strictReviewEventInputSchema.pipe(reviewEventSchema);

const strictTaxonomyRegistrySchema = taxonomyRegistrySchema.extend({
  domains: z.array(taxonomyDomainSchema.strict()),
  topics: z.array(taxonomyTopicSchema.strict()),
  subtopics: z.array(taxonomySubtopicSchema.strict()),
  allowedTags: z.array(controlledTagSchema),
}).strict();

export const backupMediaEntryV1Schema = z.object({
  assetId: opaqueIdSchema,
  imageId: opaqueIdSchema,
  knowledgeItemId: opaqueIdSchema,
  archivePath: z.string().min(1),
  mimeType: z.enum(['image/jpeg', 'image/png', 'image/webp']),
  byteLength: z.number().int().positive(),
  sha256: z.string().regex(/^[0-9a-f]{64}$/, 'SHA-256 must be 64 lowercase hexadecimal characters'),
}).strict();

export type BackupMediaEntryV1 = z.infer<typeof backupMediaEntryV1Schema>;

export const backupEnvelopeV1Schema = z.object({
  format: z.literal(BACKUP_FORMAT),
  backupVersion: z.literal(CURRENT_BACKUP_VERSION),
  exportedAt: z.string().datetime(),
  data: z.object({
    taxonomy: strictTaxonomyRegistrySchema,
    settings: settingsSchema.strict(),
    schedulerParameterSets: z.array(schedulerParameterSetSchema.strict()),
    knowledgeItems: z.array(portableKnowledgeItemV1Schema),
    reviewCards: z.array(backupReviewCardV1Schema),
    reviewEvents: z.array(backupReviewEventV1Schema),
  }).strict(),
  media: z.array(backupMediaEntryV1Schema),
}).strict();

export type BackupEnvelopeV1 = z.infer<typeof backupEnvelopeV1Schema>;
