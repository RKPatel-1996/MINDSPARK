import { describe, expect, it, vi } from 'vitest';
import { BackupFirebaseRestoreService, type RestoreMediaGateway, type RestoreWriteGateway } from '../backupFirebaseRestoreService';
import { webCryptoBackupHasher } from '../backupExportService';
import { collectRestoreTargetState } from '../backupRestoreService';
import { createRestorePlan, type RestoreOperation } from '../../backup/restore';
import type { BackupEnvelopeV1 } from '../../backup/contract';
import { DEFAULT_PARAMETER_SET } from '../../domain/schedulerParameterSet';
import { createInMemoryRepositories } from '../../persistence/memory/inMemoryRepositories';
import type { Repositories } from '../types';

const ITEM = '11111111-1111-4111-8111-111111111111';
const CARD = '22222222-2222-4222-8222-222222222222';
const EVENT = '33333333-3333-4333-8333-333333333333';
const IMAGE = '44444444-4444-4444-8444-444444444444';
const PATH = `users/current-owner/knowledgeImages/${ITEM}/${IMAGE}`;
const BYTES = new Uint8Array([1, 2, 3]);

async function makeBackup(withMedia: boolean): Promise<BackupEnvelopeV1> {
  const hash = await webCryptoBackupHasher.sha256(BYTES);
  return {
    format: 'mindspark-backup', backupVersion: 1,
    exportedAt: '2025-01-01T00:00:00.000Z',
    data: {
      taxonomy: { domains: [{ id: 'domain', name: 'Domain' }],
        topics: [{ id: 'topic', domainId: 'domain', name: 'Topic' }],
        subtopics: [], allowedTags: ['tag'] },
      settings: { schemaVersion: 1, desiredRetention: 0.9,
        activeParameterSetId: DEFAULT_PARAMETER_SET.id,
        newCardDailyLimit: 5, reserveHorizonHours: 24 },
      schedulerParameterSets: [{ ...DEFAULT_PARAMETER_SET }],
      knowledgeItems: [{
        id: ITEM, schemaVersion: 1, title: 'Title', content: 'Content',
        taxonomy: { domainId: 'domain', topicId: 'topic' }, tags: ['tag'], status: 'active',
        createdAt: '2024-01-01T00:00:00.000Z', updatedAt: '2024-01-02T00:00:00.000Z',
        ...(withMedia ? { images: [{ id: IMAGE, assetId: IMAGE, alt: 'Diagram', placement: 'content' }] } : {}),
      }],
      reviewCards: [{ id: CARD, knowledgeItemId: ITEM, schemaVersion: 1,
        type: 'flashcard', front: 'Front', back: 'Back', suspended: false,
        createdAt: '2024-01-01T00:00:00.000Z', updatedAt: '2024-01-02T00:00:00.000Z' }],
      reviewEvents: [{ id: EVENT, cardId: CARD, knowledgeItemId: ITEM,
        reviewTimestamp: '2024-01-03T00:00:00.000Z', rating: 'good', cardType: 'flashcard',
        objectiveCorrect: null, guessedOrStruggled: false, deviceId: 'historical-device',
        schedulerMetadata: { algorithm: DEFAULT_PARAMETER_SET.algorithm,
          implementation: DEFAULT_PARAMETER_SET.implementation,
          implementationVersion: DEFAULT_PARAMETER_SET.implementationVersion,
          parameterSetId: DEFAULT_PARAMETER_SET.id, desiredRetention: 0.9,
          scheduledDays: 1, stability: 1, difficulty: 5 }, schemaVersion: 1 }],
    },
    media: withMedia ? [{ assetId: IMAGE, imageId: IMAGE, knowledgeItemId: ITEM,
      archivePath: `media/${IMAGE}`, mimeType: 'image/png', byteLength: BYTES.length,
      sha256: hash }] : [],
  };
}

function harness() {
  const repos = createInMemoryRepositories();
  const stored = new Map<string, { bytes: Uint8Array; mimeType: string }>();
  const writes: RestoreWriteGateway = {
    applyInsert: vi.fn(async (operation: RestoreOperation, value: unknown) => {
      switch (operation.entityType) {
        case 'scheduler_parameter_set': await repos.parameterSets.create(value as any); break;
        case 'taxonomy': await repos.taxonomy.save(value as any); break;
        case 'knowledge_item': await repos.knowledge.create(value as any); break;
        case 'review_card': await repos.reviewCards.create(value as any); break;
        case 'review_event': await repos.reviewEvents.append(value as any); break;
        case 'settings': await repos.settings.save(value as any); break;
      }
      return 'inserted' as const;
    }),
  };
  const media: RestoreMediaGateway = {
    canonicalPath: () => PATH,
    readImageIfExists: vi.fn(async (path) => stored.get(path) ?? null),
    uploadImage: vi.fn(async ({ blob }) => {
      stored.set(PATH, { bytes: new Uint8Array(await blob.arrayBuffer()), mimeType: blob.type });
      return PATH;
    }),
  };
  const service = new BackupFirebaseRestoreService(repos as Repositories, media, writes);
  return { repos, stored, writes, media, service };
}

describe('B6 restore execution boundary', () => {
  it('rejects conflicting plans and bad media before any write', async () => {
    const { repos, writes, media, service } = harness();
    const backup = await makeBackup(true);
    const plan = createRestorePlan(backup, await collectRestoreTargetState(repos));
    const invalid = new Map([[IMAGE, { bytes: new Uint8Array([9, 9, 9]), mimeType: 'image/png' }]]);
    expect((await service.execute(plan, { files: invalid })).category).toBe('media_validation');
    expect((await service.execute(plan, { files: new Map([[IMAGE, {
      bytes: BYTES, mimeType: 'image/gif',
    }]]) })).category).toBe('media_validation');
    const oversized = new Uint8Array(5 * 1024 * 1024 + 1);
    const oversizedBackup = { ...backup, media: [{ ...backup.media[0], byteLength: oversized.length }] };
    const oversizedPlan = createRestorePlan(oversizedBackup, await collectRestoreTargetState(repos));
    expect((await service.execute(oversizedPlan, { files: new Map([[IMAGE, {
      bytes: oversized, mimeType: 'image/png',
    }]]) })).category).toBe('media_validation');
    expect(media.uploadImage).not.toHaveBeenCalled();
    expect(writes.applyInsert).not.toHaveBeenCalled();
    const blocked = { ...plan, conflicts: [{ operationId: 'x', stage: 'settings' as const,
      entityType: 'settings' as const, entityId: 'settings', reason: 'conflict' }] };
    expect((await service.execute(blocked, { files: new Map() })).status).toBe('conflict');
    expect(writes.applyInsert).not.toHaveBeenCalled();
  });

  it('uploads media first, restores original evidence, then settings; retry is all no-ops', async () => {
    const { repos, stored, writes, media, service } = harness();
    const backup = await makeBackup(true);
    const payload = { files: new Map([[IMAGE, { bytes: BYTES, mimeType: 'image/png' }]]) };
    const plan = createRestorePlan(backup, await collectRestoreTargetState(repos));
    const order: string[] = [];
    const first = await service.execute(plan, payload, (id) => { order.push(id); });
    expect(first.status).toBe('complete');
    expect(order[0]).toContain('media_prerequisites');
    expect(order.at(-1)).toBe('settings:settings:settings');
    expect(stored.get(PATH)?.bytes).toEqual(BYTES);
    expect((await repos.knowledge.get(ITEM))?.images?.[0]).toMatchObject({ id: IMAGE, storagePath: PATH, alt: 'Diagram' });
    expect((await repos.reviewEvents.get(EVENT))?.deviceId).toBe('historical-device');
    const retry = createRestorePlan(backup, await collectRestoreTargetState(repos));
    const second = await service.execute(retry, payload);
    expect(second.status).toBe('complete');
    expect(second.completedOperationIds).toEqual([]);
    expect(media.uploadImage).toHaveBeenCalledTimes(1);
    expect(writes.applyInsert).toHaveBeenCalledTimes(6);
    expect((await repos.reviewEvents.list())).toHaveLength(1);
  });

  it('stops on different existing bytes, then resumes after an injected partial failure', async () => {
    const { repos, stored, writes, service } = harness();
    const backup = await makeBackup(true);
    const payload = { files: new Map([[IMAGE, { bytes: BYTES, mimeType: 'image/png' }]]) };
    const plan = createRestorePlan(backup, await collectRestoreTargetState(repos));
    stored.set(PATH, { bytes: new Uint8Array([8, 8, 8]), mimeType: 'image/png' });
    expect((await service.execute(plan, payload)).category).toBe('media_conflict');
    expect(writes.applyInsert).not.toHaveBeenCalled();
    stored.delete(PATH);
    const partial = await service.execute(plan, payload, (id) => {
      if (id.startsWith('knowledge_items')) throw new Error('injected');
    });
    expect(partial.status).toBe('incomplete');
    expect(partial.failedOperationId).toContain('knowledge_items');
    expect(partial.completedOperationIds.length).toBeGreaterThan(0);
    const retry = createRestorePlan(backup, await collectRestoreTargetState(repos));
    expect((await service.execute(retry, payload)).status).toBe('complete');
    expect((await repos.reviewEvents.list())).toHaveLength(1);
  });
});
