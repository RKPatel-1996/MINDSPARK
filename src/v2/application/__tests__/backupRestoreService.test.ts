import { describe, expect, it } from 'vitest';
import {
  BackupRestoreService,
  collectRestoreTargetState,
  executeRestorePlan,
} from '../backupRestoreService';
import { createRestorePlan, type RestoreTargetState } from '../../backup/restore';
import type { BackupEnvelopeV1 } from '../../backup/contract';
import { DEFAULT_SETTINGS } from '../bootstrapService';
import { CANONICAL_TAXONOMY_REGISTRY } from '../canonicalTaxonomy';
import { DEFAULT_PARAMETER_SET } from '../../domain/schedulerParameterSet';
import type { ReviewCard } from '../../domain/card';
import { createInMemoryRepositories } from '../../persistence/memory/inMemoryRepositories';

const ITEM_A = '11111111-1111-4111-8111-111111111111';
const ITEM_B = '21111111-1111-4111-8111-111111111111';
const CARD_A = '31111111-1111-4111-8111-111111111111';
const EVENT_A = '41111111-1111-4111-8111-111111111111';
const IMAGE_A = '51111111-1111-4111-8111-111111111111';

function clone<T>(value: T): T {
  return structuredClone(value);
}

function parameterSet() {
  return {
    ...DEFAULT_PARAMETER_SET,
    weights: [...DEFAULT_PARAMETER_SET.weights],
    learningSteps: [...DEFAULT_PARAMETER_SET.learningSteps],
    relearningSteps: [...DEFAULT_PARAMETER_SET.relearningSteps],
  };
}

function makeBackup(withMedia = false): BackupEnvelopeV1 {
  const item = {
    id: ITEM_A,
    schemaVersion: 1 as const,
    title: 'Restore item',
    content: 'Authoritative restore content',
    taxonomy: { domainId: 'domain', topicId: 'topic' },
    tags: ['tag'],
    status: 'active' as const,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-02T00:00:00.000Z',
    ...(withMedia ? {
      images: [{
        id: IMAGE_A,
        assetId: IMAGE_A,
        alt: 'Portable image',
        placement: 'content' as const,
      }],
    } : {}),
  };
  return {
    format: 'mindspark-backup',
    backupVersion: 1,
    exportedAt: '2025-01-01T00:00:00.000Z',
    data: {
      taxonomy: {
        domains: [{ id: 'domain', name: 'Domain' }],
        topics: [{ id: 'topic', domainId: 'domain', name: 'Topic' }],
        subtopics: [],
        allowedTags: ['tag'],
      },
      settings: {
        schemaVersion: 1,
        desiredRetention: 0.9,
        activeParameterSetId: DEFAULT_PARAMETER_SET.id,
        newCardDailyLimit: 5,
        reserveHorizonHours: 24,
      },
      schedulerParameterSets: [parameterSet()],
      knowledgeItems: [item],
      reviewCards: [{
        id: CARD_A,
        knowledgeItemId: ITEM_A,
        schemaVersion: 1,
        type: 'flashcard',
        front: 'Front',
        back: 'Back',
        suspended: false,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-02T00:00:00.000Z',
      }],
      reviewEvents: [{
        id: EVENT_A,
        cardId: CARD_A,
        knowledgeItemId: ITEM_A,
        reviewTimestamp: '2024-01-03T00:00:00.000Z',
        rating: 'good',
        cardType: 'flashcard',
        objectiveCorrect: null,
        guessedOrStruggled: false,
        durationMs: 1200,
        deviceId: 'original-device',
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
      }],
    },
    media: withMedia ? [{
      assetId: IMAGE_A,
      imageId: IMAGE_A,
      knowledgeItemId: ITEM_A,
      archivePath: `media/${IMAGE_A}`,
      mimeType: 'image/png',
      byteLength: 3,
      sha256: 'a'.repeat(64),
    }] : [],
  };
}

function emptyTarget(): RestoreTargetState {
  return {
    taxonomy: null,
    settings: null,
    schedulerParameterSets: [],
    knowledgeItems: [],
    reviewCards: [],
    reviewEvents: [],
  };
}

function matchingTarget(backup: BackupEnvelopeV1): RestoreTargetState {
  return {
    taxonomy: clone(backup.data.taxonomy),
    settings: clone(backup.data.settings),
    schedulerParameterSets: clone(backup.data.schedulerParameterSets),
    knowledgeItems: clone(backup.data.knowledgeItems),
    reviewCards: clone(backup.data.reviewCards),
    reviewEvents: clone(backup.data.reviewEvents),
  };
}

describe('V1 restore preflight', () => {
  it('plans deterministic inserts for an empty target in dependency order', () => {
    const plan = createRestorePlan(makeBackup(), emptyTarget());

    expect(plan.canExecute).toBe(true);
    expect(plan.conflicts).toEqual([]);
    expect(plan.operations.map((operation) => [operation.stage, operation.disposition])).toEqual([
      ['scheduler_parameter_sets', 'INSERT'],
      ['taxonomy', 'INSERT'],
      ['knowledge_items', 'INSERT'],
      ['review_cards', 'INSERT'],
      ['review_events', 'INSERT'],
      ['settings', 'INSERT'],
    ]);
  });

  it('normalizes input and makes an identical target entirely no-op', () => {
    const backup = makeBackup();
    const plan = createRestorePlan(backup, matchingTarget(backup));

    expect(plan.operations.every((operation) => operation.disposition === 'NO_OP')).toBe(true);
    expect(plan.canExecute).toBe(true);
  });

  it('plans a mixed target without rediscovering entities by title or content', () => {
    const backup = makeBackup();
    const target: RestoreTargetState = {
      ...emptyTarget(),
      taxonomy: clone(backup.data.taxonomy),
      settings: clone(backup.data.settings),
      schedulerParameterSets: clone(backup.data.schedulerParameterSets),
    };
    const plan = createRestorePlan(backup, target);

    expect(plan.operations.map((operation) => operation.disposition)).toEqual([
      'NO_OP', 'NO_OP', 'INSERT', 'INSERT', 'INSERT', 'NO_OP',
    ]);
  });

  it('detects immutable entity conflicts without heuristic duplicate matching', () => {
    const backup = makeBackup();
    const original = matchingTarget(backup);
    const target: RestoreTargetState = {
      ...original,
      knowledgeItems: original.knowledgeItems.map((item) => ({
        ...item,
        title: 'Different authoritative item',
      })),
      reviewCards: original.reviewCards.map((card) => ({
        ...(card as Extract<ReviewCard, { type: 'flashcard' }>),
        front: 'Different front',
      })),
      reviewEvents: original.reviewEvents.map((event) => ({
        ...event,
        deviceId: 'different-device',
      })),
      schedulerParameterSets: original.schedulerParameterSets.map((set) => ({
        ...set,
        maximumInterval: 999,
      })),
    };

    const plan = createRestorePlan(backup, target);

    expect(plan.canExecute).toBe(false);
    expect(plan.conflicts.map((conflict) => conflict.entityType)).toEqual([
      'scheduler_parameter_set',
      'knowledge_item',
      'review_card',
      'review_event',
    ]);
  });

  it('treats bootstrap taxonomy and settings as replaceable but non-default state as conflicts', () => {
    const backup = makeBackup();
    backup.data.settings.newCardDailyLimit = 7;
    const bootstrapTarget = {
      ...emptyTarget(),
      taxonomy: clone(CANONICAL_TAXONOMY_REGISTRY),
      settings: clone(DEFAULT_SETTINGS),
    };
    const bootstrapPlan = createRestorePlan(backup, bootstrapTarget);

    expect(bootstrapPlan.operations.find((operation) => operation.entityType === 'taxonomy')?.disposition)
      .toBe('INSERT');
    expect(bootstrapPlan.operations.find((operation) => operation.entityType === 'settings')?.disposition)
      .toBe('INSERT');

    const conflictingTarget = matchingTarget(backup);
    conflictingTarget.taxonomy = {
      ...conflictingTarget.taxonomy!,
      domains: [{ id: 'different', name: 'Different' }],
      topics: [],
      subtopics: [],
      allowedTags: [],
    };
    conflictingTarget.settings = { ...conflictingTarget.settings!, newCardDailyLimit: 9 };
    const conflictPlan = createRestorePlan(backup, conflictingTarget);

    expect(conflictPlan.conflicts.map((conflict) => conflict.entityType)).toEqual([
      'taxonomy',
      'settings',
    ]);
  });

  it('rejects an invalid backup before planning', () => {
    const invalid = makeBackup();
    invalid.format = 'other-backup' as any;

    expect(() => createRestorePlan(invalid, emptyTarget())).toThrow('valid MindSpark backup');
  });

  it('represents portable media as an explicit B6 prerequisite without creating a storage path', () => {
    const plan = createRestorePlan(makeBackup(true), emptyTarget());

    expect(plan.mediaPrerequisites).toEqual([expect.objectContaining({
      stage: 'media_prerequisites',
      disposition: 'MEDIA_REQUIRES_B6',
      entityId: IMAGE_A,
    })]);
    expect(plan.requiresMediaExecutionInB6).toBe(true);
    expect(plan.canExecute).toBe(false);
    expect(plan.stageOrder).toEqual([
      'media_prerequisites',
      'scheduler_parameter_sets',
      'taxonomy',
      'knowledge_items',
      'review_cards',
      'review_events',
      'settings',
    ]);
    expect(plan.backup.data.knowledgeItems[0].images?.[0]).not.toHaveProperty('storagePath');
  });
});

describe('in-memory restore execution', () => {
  it('executes inserts preserving IDs, timestamps, device evidence, and reconciliation', async () => {
    const repos = createInMemoryRepositories();
    const service = new BackupRestoreService(repos);
    const result = await service.execute(await service.createPlan(makeBackup()));

    expect(result.status).toBe('completed');
    expect(await repos.knowledge.get(ITEM_A)).toMatchObject({
      id: ITEM_A,
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-02T00:00:00.000Z',
    });
    expect(await repos.reviewEvents.get(EVENT_A)).toMatchObject({
      id: EVENT_A,
      reviewTimestamp: '2024-01-03T00:00:00.000Z',
      deviceId: 'original-device',
    });
    if (result.status === 'completed') {
      expect(result.reconciliation[0].result.ok).toBe(true);
    }
  });

  it('replans a completed restore to no-ops without mutating authoritative state', async () => {
    const repos = createInMemoryRepositories();
    const service = new BackupRestoreService(repos);
    await service.execute(await service.createPlan(makeBackup()));
    const before = await collectRestoreTargetState(repos);
    const plan = await service.createPlan(makeBackup());
    const writes: string[] = [];
    const result = await service.execute(plan, {
      beforeInsert: (operation) => { writes.push(operation.id); },
    });

    expect(plan.operations.every((operation) => operation.disposition === 'NO_OP')).toBe(true);
    expect(result.status).toBe('completed');
    expect(writes).toEqual([]);
    expect(await collectRestoreTargetState(repos)).toEqual(before);
    expect((await repos.reviewEvents.list()).filter((event) => event.id === EVENT_A)).toHaveLength(1);
  });

  it('does not write when preflight reports conflicts', async () => {
    const repos = createInMemoryRepositories();
    const backup = makeBackup();
    const original = matchingTarget(backup);
    const target: RestoreTargetState = {
      ...original,
      reviewEvents: original.reviewEvents.map((event) => ({
        ...event,
        deviceId: 'conflict',
      })),
    };
    const plan = createRestorePlan(backup, target);

    const result = await executeRestorePlan(repos, plan);

    expect(result.status).toBe('blocked_conflicts');
    expect(await repos.knowledge.list()).toEqual([]);
    expect(await repos.reviewEvents.list()).toEqual([]);
  });

  it('reports a partial failure and safely resumes after a fresh preflight', async () => {
    const repos = createInMemoryRepositories();
    const service = new BackupRestoreService(repos);
    const firstPlan = await service.createPlan(makeBackup());
    const first = await service.execute(firstPlan, {
      beforeInsert: (_operation, insertNumber) => {
        if (insertNumber === 4) throw new Error('injected card write failure');
      },
    });

    expect(first).toMatchObject({ status: 'incomplete' });
    expect(await repos.knowledge.get(ITEM_A)).not.toBeNull();
    expect(await repos.reviewCards.get(CARD_A)).toBeNull();

    const retryPlan = await service.createPlan(makeBackup());
    const retry = await service.execute(retryPlan);
    expect(retry.status).toBe('completed');
    expect((await repos.reviewEvents.list()).filter((event) => event.id === EVENT_A)).toHaveLength(1);
  });

  it('does not execute media-bearing plans before the explicit B6 prerequisite', async () => {
    const repos = createInMemoryRepositories();
    const service = new BackupRestoreService(repos);

    const result = await service.execute(await service.createPlan(makeBackup(true)));

    expect(result.status).toBe('blocked_media_prerequisite');
    expect(await repos.knowledge.list()).toEqual([]);
  });

  it('projects existing owner-specific image paths only for pure comparison', async () => {
    const backup = makeBackup(true);
    const repos = createInMemoryRepositories();
    await repos.taxonomy.save(backup.data.taxonomy);
    await repos.settings.save(backup.data.settings);
    await repos.parameterSets.create(parameterSet());
    await repos.knowledge.create({
      ...backup.data.knowledgeItems[0],
      images: [{
        id: IMAGE_A,
        storagePath: `users/owner/knowledgeImages/${ITEM_A}/${IMAGE_A}`,
        alt: 'Portable image',
        placement: 'content',
      }],
    });
    await repos.reviewCards.create(backup.data.reviewCards[0]);
    await repos.reviewEvents.append(backup.data.reviewEvents[0]);
    const plan = await new BackupRestoreService(repos).createPlan(backup);

    expect(plan.conflicts).toEqual([]);
    expect(plan.operations.find((operation) => operation.entityType === 'knowledge_item')?.disposition)
      .toBe('NO_OP');
    expect(plan.requiresMediaExecutionInB6).toBe(true);
  });
});
