import { describe, expect, it } from 'vitest';
import type { ReviewCard } from '../../domain/card';
import type { ReviewEvent } from '../../domain/event';
import { DEFAULT_PARAMETER_SET } from '../../domain/schedulerParameterSet';
import {
  BACKUP_FORMAT,
  CURRENT_BACKUP_VERSION,
  type BackupEnvelopeV1,
  validateAndNormalizeBackup,
} from '../index';

const ITEM_A = '11111111-1111-4111-8111-111111111111';
const ITEM_B = '01111111-1111-4111-8111-111111111111';
const CARD_A = '22222222-2222-4222-8222-222222222222';
const EVENT_A = '33333333-3333-4333-8333-333333333333';
const EVENT_B = '03333333-3333-4333-8333-333333333333';
const IMAGE_A = '44444444-4444-4444-8444-444444444444';
const ASSET_A = '55555555-5555-4555-8555-555555555555';

function clone<T>(value: T): T {
  return structuredClone(value);
}

function makeCard(type: ReviewCard['type'] = 'flashcard'): ReviewCard {
  const base = {
    id: CARD_A,
    knowledgeItemId: ITEM_A,
    schemaVersion: 1 as const,
    suspended: false,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  };

  switch (type) {
    case 'free_recall':
      return { ...base, type, prompt: 'Recall this', answerGuidance: 'Expected answer' };
    case 'flashcard':
      return { ...base, type, front: 'Front', back: 'Back' };
    case 'mcq':
      return { ...base, type, question: 'Choose', options: ['A', 'B'], correctOptionIndex: 0 };
    case 'true_false':
      return { ...base, type, statement: 'Statement', isTrue: true };
    case 'cloze':
      return { ...base, type, prompt: 'The {{blank}}', answer: 'answer' };
  }
}

function makeEvent(cardType: ReviewCard['type'] = 'flashcard'): ReviewEvent {
  return {
    id: EVENT_A,
    cardId: CARD_A,
    knowledgeItemId: ITEM_A,
    reviewTimestamp: '2024-01-02T00:00:00.000Z',
    rating: 'good',
    cardType,
    objectiveCorrect: cardType === 'mcq' || cardType === 'true_false' ? true : null,
    guessedOrStruggled: false,
    durationMs: 1200,
    deviceId: 'device-original',
    schedulerMetadata: {
      algorithm: DEFAULT_PARAMETER_SET.algorithm,
      implementation: DEFAULT_PARAMETER_SET.implementation,
      implementationVersion: DEFAULT_PARAMETER_SET.implementationVersion,
      parameterSetId: DEFAULT_PARAMETER_SET.id,
      desiredRetention: 0.9,
      scheduledDays: 1,
      stability: 1,
      difficulty: 5,
    },
    schemaVersion: 1,
  };
}

function makeValidBackup(cardType: ReviewCard['type'] = 'flashcard'): BackupEnvelopeV1 {
  return {
    format: BACKUP_FORMAT,
    backupVersion: CURRENT_BACKUP_VERSION,
    exportedAt: '2025-01-01T00:00:00.000Z',
    data: {
      taxonomy: {
        domains: [
          { id: 'z-domain', name: 'Z Domain' },
          { id: 'a-domain', name: 'A Domain' },
        ],
        topics: [
          { id: 'z-topic', domainId: 'z-domain', name: 'Z Topic' },
          { id: 'a-topic', domainId: 'a-domain', name: 'A Topic' },
        ],
        subtopics: [],
        allowedTags: ['z-tag', 'a-tag'],
      },
      settings: {
        schemaVersion: 1,
        desiredRetention: 0.9,
        activeParameterSetId: DEFAULT_PARAMETER_SET.id,
        newCardDailyLimit: 5,
        reserveHorizonHours: 24,
      },
      schedulerParameterSets: [{
        ...DEFAULT_PARAMETER_SET,
        weights: [...DEFAULT_PARAMETER_SET.weights],
        learningSteps: [...DEFAULT_PARAMETER_SET.learningSteps],
        relearningSteps: [...DEFAULT_PARAMETER_SET.relearningSteps],
      }],
      knowledgeItems: [
        {
          id: ITEM_A,
          schemaVersion: 1,
          title: 'Item A',
          content: 'Content A',
          taxonomy: { domainId: 'z-domain', topicId: 'z-topic' },
          tags: ['z-tag'],
          status: 'active',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
          sources: [{ title: 'Source', url: 'https://example.com/source' }],
          images: [{
            id: IMAGE_A,
            assetId: ASSET_A,
            alt: 'Image alt text',
            placement: 'review_prompt',
            cardId: CARD_A,
          }],
        },
        {
          id: ITEM_B,
          schemaVersion: 1,
          title: 'Item B',
          content: 'Content B',
          taxonomy: { domainId: 'a-domain', topicId: 'a-topic' },
          tags: ['a-tag'],
          status: 'archived',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
      ],
      reviewCards: [makeCard(cardType)],
      reviewEvents: [makeEvent(cardType)],
    },
    media: [{
      assetId: ASSET_A,
      imageId: IMAGE_A,
      knowledgeItemId: ITEM_A,
      archivePath: `media/${IMAGE_A}`,
      mimeType: 'image/png',
      byteLength: 128,
      sha256: 'a'.repeat(64),
    }],
  };
}

function expectIssue(input: unknown, code: string): void {
  const result = validateAndNormalizeBackup(input);
  expect(result.valid).toBe(false);
  if (result.valid === false) {
    expect(result.issues.map((value) => value.code)).toContain(code);
  }
}

describe('MindSpark backup V1 contract', () => {
  it.each<ReviewCard['type']>([
    'free_recall',
    'flashcard',
    'mcq',
    'true_false',
    'cloze',
  ])('accepts and reconciles the %s card contract', (cardType) => {
    const result = validateAndNormalizeBackup(makeValidBackup(cardType));
    expect(result.valid).toBe(true);
  });

  it('normalizes entity collections deterministically without mutating the input', () => {
    const input = makeValidBackup();
    const earlierEvent = {
      ...makeEvent(),
      id: EVENT_B,
      reviewTimestamp: '2024-01-01T12:00:00.000Z',
    };
    input.data.reviewEvents.unshift({
      ...makeEvent(),
      reviewTimestamp: '2024-01-03T00:00:00.000Z',
    });
    input.data.reviewEvents[0].id = '63333333-3333-4333-8333-333333333333';
    input.data.reviewEvents.push(earlierEvent);
    const original = clone(input);

    const result = validateAndNormalizeBackup(input);

    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.backup.data.taxonomy.domains.map((value) => value.id)).toEqual([
        'a-domain',
        'z-domain',
      ]);
      expect(result.backup.data.knowledgeItems.map((value) => value.id)).toEqual([
        ITEM_B,
        ITEM_A,
      ]);
      expect(result.backup.data.reviewEvents.map((value) => value.id)).toEqual([
        EVENT_B,
        EVENT_A,
        '63333333-3333-4333-8333-333333333333',
      ]);
    }
    expect(input).toEqual(original);
  });

  it('fails closed for wrong formats, unsupported versions, and unknown V1 fields', () => {
    const wrongFormat = makeValidBackup() as any;
    wrongFormat.format = 'other-format';
    expectIssue(wrongFormat, 'unsupported_format');

    const newer = makeValidBackup() as any;
    newer.backupVersion = 2;
    expectIssue(newer, 'unsupported_version');

    const unknownField = makeValidBackup() as any;
    unknownField.data.reviewEvents[0].schedulerMetadata.futureField = true;
    expectIssue(unknownField, 'invalid_envelope');

    const unknownTaxonomyField = makeValidBackup() as any;
    unknownTaxonomyField.data.knowledgeItems[0].taxonomy.futureField = true;
    expectIssue(unknownTaxonomyField, 'invalid_envelope');
  });

  it('rejects duplicate entity and media identities', () => {
    const input = makeValidBackup();
    input.data.knowledgeItems.push(clone(input.data.knowledgeItems[0]));
    input.media.push(clone(input.media[0]));
    expectIssue(input, 'duplicate_id');
  });

  it('rejects invalid taxonomy graphs, item references, and tags', () => {
    const invalidGraph = makeValidBackup();
    invalidGraph.data.taxonomy.topics[0].domainId = 'missing-domain';
    expectIssue(invalidGraph, 'invalid_taxonomy');

    const invalidItem = makeValidBackup();
    invalidItem.data.knowledgeItems[0].tags = ['unknown-tag'];
    expectIssue(invalidItem, 'invalid_taxonomy');
  });

  it('rejects missing card owners and image targets owned by another item', () => {
    const missingOwner = makeValidBackup();
    missingOwner.data.reviewCards[0].knowledgeItemId =
      '99999999-9999-4999-8999-999999999999';
    expectIssue(missingOwner, 'missing_reference');

    const wrongImageOwner = makeValidBackup();
    wrongImageOwner.data.reviewCards[0].knowledgeItemId = ITEM_B;
    expectIssue(wrongImageOwner, 'ownership_mismatch');
  });

  it('rejects event ownership and card-type mismatches', () => {
    const wrongOwner = makeValidBackup();
    wrongOwner.data.reviewEvents[0].knowledgeItemId = ITEM_B;
    expectIssue(wrongOwner, 'ownership_mismatch');

    const wrongType = makeValidBackup();
    wrongType.data.reviewEvents[0].cardType = 'cloze';
    expectIssue(wrongType, 'card_type_mismatch');
  });

  it('rejects missing active and historical scheduler parameter sets', () => {
    const missingActive = makeValidBackup();
    missingActive.data.settings.activeParameterSetId = 'missing';
    expectIssue(missingActive, 'missing_reference');

    const missingHistorical = makeValidBackup();
    missingHistorical.data.reviewEvents[0].schedulerMetadata.parameterSetId = 'missing';
    expectIssue(missingHistorical, 'missing_reference');
  });

  it('rejects scheduler identity conflicts', () => {
    const input = makeValidBackup();
    input.data.reviewEvents[0].schedulerMetadata.implementationVersion = 'future-version';
    expectIssue(input, 'parameter_set_identity_conflict');
  });

  it('rejects missing, unreferenced, and mismatched media metadata', () => {
    const missing = makeValidBackup();
    missing.media = [];
    expectIssue(missing, 'media_mismatch');

    const unreferenced = makeValidBackup();
    unreferenced.data.knowledgeItems[0].images = undefined;
    expectIssue(unreferenced, 'media_mismatch');

    const mismatched = makeValidBackup();
    mismatched.media[0].archivePath = 'media/not-the-image-id';
    expectIssue(mismatched, 'media_mismatch');
  });

  it('surfaces reconciliation failure for conflicting exported histories', () => {
    const input = makeValidBackup();
    input.data.reviewEvents.push({
      ...clone(input.data.reviewEvents[0]),
      rating: 'again',
    });

    const result = validateAndNormalizeBackup(input);
    expect(result.valid).toBe(false);
    if (result.valid === false) {
      expect(result.issues.map((value) => value.code)).toContain('duplicate_id');
      expect(result.issues.map((value) => value.code)).toContain('reconciliation_failed');
    }
  });
});
