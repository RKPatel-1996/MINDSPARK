import { z } from 'zod';
import type { ReviewEvent } from '../domain/event';
import type { SchedulerParameterSet } from '../domain/schedulerParameterSet';
import { validateTaxonomy } from '../domain/taxonomy';
import { reconcileCardHistory } from '../reconciliation';
import { normalizeBackupDataCollections } from './normalization';
import {
  BACKUP_FORMAT,
  CURRENT_BACKUP_VERSION,
  backupEnvelopeV1Schema,
  type BackupEnvelopeV1,
} from './contract';

export type BackupValidationIssueCode =
  | 'invalid_envelope'
  | 'unsupported_format'
  | 'unsupported_version'
  | 'duplicate_id'
  | 'invalid_taxonomy'
  | 'missing_reference'
  | 'ownership_mismatch'
  | 'card_type_mismatch'
  | 'parameter_set_identity_conflict'
  | 'media_mismatch'
  | 'reconciliation_failed';

export interface BackupValidationIssue {
  code: BackupValidationIssueCode;
  path: string;
  message: string;
}

export type BackupValidationResult =
  | { valid: true; backup: BackupEnvelopeV1 }
  | { valid: false; issues: BackupValidationIssue[] };

const identitySchema = z.object({
  format: z.unknown(),
  backupVersion: z.unknown(),
}).passthrough();

function issue(
  issues: BackupValidationIssue[],
  code: BackupValidationIssueCode,
  path: string,
  message: string,
): void {
  issues.push({ code, path, message });
}

function addDuplicateIssues<T>(
  values: readonly T[],
  key: (value: T) => string,
  path: string,
  label: string,
  issues: BackupValidationIssue[],
): void {
  const seen = new Set<string>();
  values.forEach((value, index) => {
    const id = key(value);
    if (seen.has(id)) {
      issue(issues, 'duplicate_id', `${path}[${index}]`, `Duplicate ${label} ID: ${id}`);
    } else {
      seen.add(id);
    }
  });
}

function normalizeBackup(backup: BackupEnvelopeV1): BackupEnvelopeV1 {
  return {
    ...backup,
    data: normalizeBackupDataCollections(backup.data),
    media: [...backup.media].sort((a, b) => a.assetId.localeCompare(b.assetId)),
  };
}

function validateV1(backup: BackupEnvelopeV1): BackupValidationIssue[] {
  const issues: BackupValidationIssue[] = [];
  const { taxonomy, settings, schedulerParameterSets, knowledgeItems, reviewCards, reviewEvents } =
    backup.data;

  addDuplicateIssues(taxonomy.domains, (value) => value.id, 'data.taxonomy.domains', 'taxonomy domain', issues);
  addDuplicateIssues(taxonomy.topics, (value) => value.id, 'data.taxonomy.topics', 'taxonomy topic', issues);
  addDuplicateIssues(taxonomy.subtopics, (value) => value.id, 'data.taxonomy.subtopics', 'taxonomy subtopic', issues);
  addDuplicateIssues(taxonomy.allowedTags, (value) => value, 'data.taxonomy.allowedTags', 'allowed tag', issues);
  addDuplicateIssues(schedulerParameterSets, (value) => value.id, 'data.schedulerParameterSets', 'scheduler parameter set', issues);
  addDuplicateIssues(knowledgeItems, (value) => value.id, 'data.knowledgeItems', 'knowledge item', issues);
  addDuplicateIssues(reviewCards, (value) => value.id, 'data.reviewCards', 'review card', issues);
  addDuplicateIssues(reviewEvents, (value) => value.id, 'data.reviewEvents', 'review event', issues);
  addDuplicateIssues(backup.media, (value) => value.assetId, 'media', 'media asset', issues);
  addDuplicateIssues(backup.media, (value) => value.imageId, 'media', 'media image', issues);
  addDuplicateIssues(backup.media, (value) => value.archivePath, 'media', 'media archive path', issues);

  const domainsById = new Map(taxonomy.domains.map((value) => [value.id, value]));
  const topicsById = new Map(taxonomy.topics.map((value) => [value.id, value]));
  taxonomy.topics.forEach((topic, index) => {
    if (!domainsById.has(topic.domainId)) {
      issue(
        issues,
        'invalid_taxonomy',
        `data.taxonomy.topics[${index}].domainId`,
        `Taxonomy topic "${topic.id}" references missing domain "${topic.domainId}"`,
      );
    }
  });
  taxonomy.subtopics.forEach((subtopic, index) => {
    if (!topicsById.has(subtopic.topicId)) {
      issue(
        issues,
        'invalid_taxonomy',
        `data.taxonomy.subtopics[${index}].topicId`,
        `Taxonomy subtopic "${subtopic.id}" references missing topic "${subtopic.topicId}"`,
      );
    }
  });

  const parameterSetsById = new Map<string, SchedulerParameterSet>();
  schedulerParameterSets.forEach((value) => {
    if (!parameterSetsById.has(value.id)) {
      parameterSetsById.set(value.id, value);
    }
  });
  if (!parameterSetsById.has(settings.activeParameterSetId)) {
    issue(
      issues,
      'missing_reference',
      'data.settings.activeParameterSetId',
      `Active scheduler parameter set "${settings.activeParameterSetId}" is missing`,
    );
  }

  const itemsById = new Map(knowledgeItems.map((value) => [value.id, value]));
  const imageReferencesByAssetId = new Map<
    string,
    { imageId: string; knowledgeItemId: string; path: string }
  >();
  const seenImageIds = new Set<string>();
  knowledgeItems.forEach((item, itemIndex) => {
    const taxonomyValidation = validateTaxonomy(item.taxonomy, item.tags, taxonomy);
    if (!taxonomyValidation.valid) {
      issue(
        issues,
        'invalid_taxonomy',
        `data.knowledgeItems[${itemIndex}].taxonomy`,
        taxonomyValidation.error ?? `Invalid taxonomy for knowledge item "${item.id}"`,
      );
    }

    (item.images ?? []).forEach((image, imageIndex) => {
      const imagePath = `data.knowledgeItems[${itemIndex}].images[${imageIndex}]`;
      if (seenImageIds.has(image.id)) {
        issue(issues, 'duplicate_id', imagePath, `Duplicate image ID: ${image.id}`);
      } else {
        seenImageIds.add(image.id);
      }
      if (imageReferencesByAssetId.has(image.assetId)) {
        issue(issues, 'duplicate_id', `${imagePath}.assetId`, `Duplicate image asset ID: ${image.assetId}`);
      } else {
        imageReferencesByAssetId.set(image.assetId, {
          imageId: image.id,
          knowledgeItemId: item.id,
          path: imagePath,
        });
      }
    });
  });

  const cardsById = new Map(reviewCards.map((value) => [value.id, value]));
  reviewCards.forEach((card, index) => {
    if (!itemsById.has(card.knowledgeItemId)) {
      issue(
        issues,
        'missing_reference',
        `data.reviewCards[${index}].knowledgeItemId`,
        `Review card "${card.id}" references missing knowledge item "${card.knowledgeItemId}"`,
      );
    }
  });

  knowledgeItems.forEach((item, itemIndex) => {
    (item.images ?? []).forEach((image, imageIndex) => {
      if (!image.cardId) return;
      const card = cardsById.get(image.cardId);
      const path = `data.knowledgeItems[${itemIndex}].images[${imageIndex}].cardId`;
      if (!card) {
        issue(issues, 'missing_reference', path, `Image references missing review card "${image.cardId}"`);
      } else if (card.knowledgeItemId !== item.id) {
        issue(
          issues,
          'ownership_mismatch',
          path,
          `Image target card "${image.cardId}" belongs to a different knowledge item`,
        );
      }
    });
  });

  const eventsByCardId = new Map<string, ReviewEvent[]>();
  reviewEvents.forEach((event, index) => {
    const card = cardsById.get(event.cardId);
    const item = itemsById.get(event.knowledgeItemId);
    if (!card) {
      issue(
        issues,
        'missing_reference',
        `data.reviewEvents[${index}].cardId`,
        `Review event "${event.id}" references missing card "${event.cardId}"`,
      );
    }
    if (!item) {
      issue(
        issues,
        'missing_reference',
        `data.reviewEvents[${index}].knowledgeItemId`,
        `Review event "${event.id}" references missing knowledge item "${event.knowledgeItemId}"`,
      );
    }
    if (card && card.knowledgeItemId !== event.knowledgeItemId) {
      issue(
        issues,
        'ownership_mismatch',
        `data.reviewEvents[${index}].knowledgeItemId`,
        `Review event "${event.id}" does not match its card's knowledge item`,
      );
    }
    if (card && card.type !== event.cardType) {
      issue(
        issues,
        'card_type_mismatch',
        `data.reviewEvents[${index}].cardType`,
        `Review event "${event.id}" card type does not match card "${card.id}"`,
      );
    }

    const parameterSet = parameterSetsById.get(event.schedulerMetadata.parameterSetId);
    if (!parameterSet) {
      issue(
        issues,
        'missing_reference',
        `data.reviewEvents[${index}].schedulerMetadata.parameterSetId`,
        `Review event "${event.id}" references missing scheduler parameter set "${event.schedulerMetadata.parameterSetId}"`,
      );
    } else if (
      parameterSet.algorithm !== event.schedulerMetadata.algorithm ||
      parameterSet.implementation !== event.schedulerMetadata.implementation ||
      parameterSet.implementationVersion !== event.schedulerMetadata.implementationVersion
    ) {
      issue(
        issues,
        'parameter_set_identity_conflict',
        `data.reviewEvents[${index}].schedulerMetadata`,
        `Review event "${event.id}" conflicts with scheduler parameter set "${parameterSet.id}"`,
      );
    }

    const cardEvents = eventsByCardId.get(event.cardId) ?? [];
    cardEvents.push(event);
    eventsByCardId.set(event.cardId, cardEvents);
  });

  const mediaByAssetId = new Map(backup.media.map((value) => [value.assetId, value]));
  imageReferencesByAssetId.forEach((reference, assetId) => {
    const media = mediaByAssetId.get(assetId);
    if (!media) {
      issue(
        issues,
        'media_mismatch',
        `${reference.path}.assetId`,
        `Image asset "${assetId}" is missing from the media manifest`,
      );
      return;
    }
    if (media.imageId !== reference.imageId || media.knowledgeItemId !== reference.knowledgeItemId) {
      issue(
        issues,
        'media_mismatch',
        `media.${assetId}`,
        `Media asset "${assetId}" does not match its image reference`,
      );
    }
  });
  backup.media.forEach((media, index) => {
    if (media.archivePath !== `media/${media.imageId}`) {
      issue(
        issues,
        'media_mismatch',
        `media[${index}].archivePath`,
        `Media archive path must be "media/${media.imageId}"`,
      );
    }
    if (!imageReferencesByAssetId.has(media.assetId)) {
      issue(
        issues,
        'media_mismatch',
        `media[${index}].assetId`,
        `Media asset "${media.assetId}" is not referenced by a knowledge item`,
      );
    }
  });

  const parameterSetRecord: Record<string, SchedulerParameterSet> = {};
  parameterSetsById.forEach((value, key) => {
    parameterSetRecord[key] = value;
  });
  reviewCards.forEach((card, index) => {
    const result = reconcileCardHistory(card, eventsByCardId.get(card.id) ?? [], parameterSetRecord);
    if (result.ok === false) {
      issue(
        issues,
        'reconciliation_failed',
        `data.reviewCards[${index}]`,
        `Review history for card "${card.id}" failed reconciliation: ${result.error} (${result.message})`,
      );
    }
  });

  return issues;
}

function zodIssues(error: z.ZodError): BackupValidationIssue[] {
  return error.issues.map((value) => ({
    code: 'invalid_envelope',
    path: value.path.map(String).join('.'),
    message: value.message,
  }));
}

export function validateAndNormalizeBackup(input: unknown): BackupValidationResult {
  const identity = identitySchema.safeParse(input);
  if (!identity.success) {
    return {
      valid: false,
      issues: [{ code: 'invalid_envelope', path: '', message: 'Backup must be an object with format and backupVersion' }],
    };
  }
  if (identity.data.format !== BACKUP_FORMAT) {
    return {
      valid: false,
      issues: [{ code: 'unsupported_format', path: 'format', message: `Unsupported backup format: ${String(identity.data.format)}` }],
    };
  }

  switch (identity.data.backupVersion) {
    case CURRENT_BACKUP_VERSION: {
      const parsed = backupEnvelopeV1Schema.safeParse(input);
      if (!parsed.success) {
        return { valid: false, issues: zodIssues(parsed.error) };
      }
      const issues = validateV1(parsed.data);
      return issues.length > 0
        ? { valid: false, issues }
        : { valid: true, backup: normalizeBackup(parsed.data) };
    }
    default:
      return {
        valid: false,
        issues: [{
          code: 'unsupported_version',
          path: 'backupVersion',
          message: `Unsupported backup version: ${String(identity.data.backupVersion)}`,
        }],
      };
  }
}
