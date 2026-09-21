import { beforeEach, describe, expect, it } from 'vitest';
import {
  BackupSnapshotService,
  BackupSourceSnapshotValidationError,
} from '../backupSnapshotService';
import { createInMemoryRepositories } from '../../persistence/memory/inMemoryRepositories';
import type { Repositories } from '../types';
import { DEFAULT_PARAMETER_SET } from '../../domain/schedulerParameterSet';
import type { KnowledgeItem } from '../../domain/knowledge';
import type { ReviewCard } from '../../domain/card';
import type { ReviewEvent } from '../../domain/event';

const FIXED_EXPORTED_AT = '2025-01-01T00:00:00.000Z';
const ITEM_A = '11111111-1111-4111-8111-111111111111';
const ITEM_B = '01111111-1111-4111-8111-111111111111';
const CARD_A = '22222222-2222-4222-8222-222222222222';
const CARD_B = '02222222-2222-4222-8222-222222222222';
const EVENT_A = '33333333-3333-4333-8333-333333333333';
const EVENT_B = '03333333-3333-4333-8333-333333333333';

function cloneParameterSet(id = DEFAULT_PARAMETER_SET.id) {
  return {
    ...DEFAULT_PARAMETER_SET,
    id,
    weights: [...DEFAULT_PARAMETER_SET.weights],
    learningSteps: [...DEFAULT_PARAMETER_SET.learningSteps],
    relearningSteps: [...DEFAULT_PARAMETER_SET.relearningSteps],
  };
}

function makeItem(id: string, status: KnowledgeItem['status']): KnowledgeItem {
  return {
    id,
    schemaVersion: 1,
    title: `Item ${id}`,
    content: 'Backup snapshot content',
    taxonomy: { domainId: 'domain', topicId: 'topic' },
    status,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  };
}

function makeCard(id: string, knowledgeItemId: string, suspended = false): ReviewCard {
  return {
    id,
    knowledgeItemId,
    schemaVersion: 1,
    type: 'flashcard',
    front: 'Front',
    back: 'Back',
    suspended,
    ...(suspended ? { suspendedReason: 'flagged_by_user' } : {}),
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  };
}

function makeEvent(
  id: string,
  cardId: string,
  knowledgeItemId: string,
  parameterSetId = DEFAULT_PARAMETER_SET.id,
  reviewTimestamp = '2024-01-02T00:00:00.000Z',
): ReviewEvent {
  return {
    id,
    cardId,
    knowledgeItemId,
    reviewTimestamp,
    rating: 'good',
    cardType: 'flashcard',
    objectiveCorrect: null,
    guessedOrStruggled: false,
    durationMs: 1000,
    deviceId: 'review-device',
    schemaVersion: 1,
    schedulerMetadata: {
      algorithm: DEFAULT_PARAMETER_SET.algorithm,
      implementation: DEFAULT_PARAMETER_SET.implementation,
      implementationVersion: DEFAULT_PARAMETER_SET.implementationVersion,
      parameterSetId,
      desiredRetention: 0.9,
      scheduledDays: 1,
      stability: 1,
      difficulty: 5,
    },
  };
}

describe('BackupSnapshotService', () => {
  let repos: Repositories;
  let service: BackupSnapshotService;

  beforeEach(async () => {
    repos = createInMemoryRepositories();
    await repos.taxonomy.save({
      domains: [{ id: 'domain', name: 'Domain' }],
      topics: [{ id: 'topic', domainId: 'domain', name: 'Topic' }],
      subtopics: [],
      allowedTags: [],
    });
    await repos.parameterSets.create(cloneParameterSet());
    await repos.settings.save({
      schemaVersion: 1,
      desiredRetention: 0.9,
      activeParameterSetId: DEFAULT_PARAMETER_SET.id,
      newCardDailyLimit: 5,
      reserveHorizonHours: 24,
    });
    service = new BackupSnapshotService(repos, () => FIXED_EXPORTED_AT);
  });

  it('includes every event, archived and needs-review items, and suspended cards', async () => {
    await repos.knowledge.create(makeItem(ITEM_A, 'archived'));
    await repos.knowledge.create(makeItem(ITEM_B, 'needs_review'));
    await repos.reviewCards.create(makeCard(CARD_A, ITEM_A, true));
    await repos.reviewCards.create(makeCard(CARD_B, ITEM_B));
    await repos.reviewEvents.append(makeEvent(EVENT_A, CARD_A, ITEM_A));
    await repos.reviewEvents.append(makeEvent(
      EVENT_B,
      CARD_B,
      ITEM_B,
      DEFAULT_PARAMETER_SET.id,
      '2024-01-01T00:00:00.000Z',
    ));

    const snapshot = await service.createSnapshot();

    expect(snapshot.knowledgeItems.map((item) => item.status)).toEqual([
      'needs_review',
      'archived',
    ]);
    expect(snapshot.reviewCards.find((card) => card.id === CARD_A)?.suspended).toBe(true);
    expect(snapshot.reviewEvents.map((event) => event.id)).toEqual([EVENT_B, EVENT_A]);
  });

  it('includes historical scheduler parameter sets used by review evidence', async () => {
    const historical = cloneParameterSet('fsrs-6-historical');
    await repos.parameterSets.create(historical);
    await repos.knowledge.create(makeItem(ITEM_A, 'active'));
    await repos.reviewCards.create(makeCard(CARD_A, ITEM_A));
    await repos.reviewEvents.append(makeEvent(EVENT_A, CARD_A, ITEM_A, historical.id));

    const snapshot = await service.createSnapshot();

    expect(snapshot.schedulerParameterSets.map((set) => set.id)).toEqual([
      DEFAULT_PARAMETER_SET.id,
      historical.id,
    ]);
    expect(snapshot.reviewEvents[0].schedulerMetadata.parameterSetId).toBe(historical.id);
  });

  it('returns deterministic B2-normalized output without mutating repository data', async () => {
    await repos.knowledge.create(makeItem(ITEM_A, 'active'));
    await repos.knowledge.create(makeItem(ITEM_B, 'active'));
    await repos.reviewCards.create(makeCard(CARD_A, ITEM_A));
    await repos.reviewCards.create(makeCard(CARD_B, ITEM_B));
    await repos.reviewEvents.append(makeEvent(EVENT_A, CARD_A, ITEM_A));
    await repos.reviewEvents.append(makeEvent(EVENT_B, CARD_B, ITEM_B, DEFAULT_PARAMETER_SET.id, '2024-01-01T00:00:00.000Z'));

    const first = await service.createSnapshot();
    const second = await service.createSnapshot();

    expect(second).toEqual(first);
    expect(first.knowledgeItems.map((item) => item.id)).toEqual([ITEM_B, ITEM_A]);
    expect(await repos.reviewEvents.get(EVENT_A)).toMatchObject({ id: EVENT_A });
  });

  it('accepts empty item, card, and event collections', async () => {
    const snapshot = await service.createSnapshot();

    expect(snapshot.knowledgeItems).toEqual([]);
    expect(snapshot.reviewCards).toEqual([]);
    expect(snapshot.reviewEvents).toEqual([]);
  });

  it('preserves storage-backed image references without media work', async () => {
    const item = makeItem(ITEM_A, 'active');
    item.images = [{
      id: '44444444-4444-4444-8444-444444444444',
      storagePath: 'users/example/images/example.png',
      alt: 'Example image',
      placement: 'content',
    }];
    await repos.knowledge.create(item);

    const snapshot = await service.createSnapshot();

    expect(snapshot.knowledgeItems[0].images).toEqual(item.images);
    expect(snapshot).not.toHaveProperty('media');
  });

  it('propagates repository read failures', async () => {
    const failure = new Error('review event read failed');
    repos.reviewEvents.list = async () => {
      throw failure;
    };

    await expect(service.createSnapshot()).rejects.toBe(failure);
  });

  it('rejects source-schema-invalid collected state', async () => {
    const invalid = makeItem(ITEM_A, 'active');
    invalid.title = '';
    await repos.knowledge.create(invalid);

    await expect(service.createSnapshot()).rejects.toMatchObject({
      name: 'BackupSourceSnapshotValidationError',
    } satisfies Partial<BackupSourceSnapshotValidationError>);
  });
});
