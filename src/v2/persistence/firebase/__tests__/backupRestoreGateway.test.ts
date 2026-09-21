import { beforeAll, afterAll, beforeEach, describe, expect, it } from 'vitest';
import { initializeTestEnvironment, type RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import type { BackupEnvelopeV1 } from '../../../backup/contract';
import { createRestorePlan } from '../../../backup/restore';
import { BackupFirebaseRestoreService } from '../../../application/backupFirebaseRestoreService';
import { collectRestoreTargetState } from '../../../application/backupRestoreService';
import { webCryptoBackupHasher } from '../../../application/backupExportService';
import { DEFAULT_PARAMETER_SET } from '../../../domain/schedulerParameterSet';
import { FirebaseRestoreMediaGateway, FirebaseRestoreWriteGateway } from '../backupRestoreGateway';
import {
  FirestoreKnowledgeRepository, FirestoreReviewCardRepository, FirestoreReviewEventRepository,
  FirestoreSchedulerParameterSetRepository, FirestoreSettingsRepository, FirestoreTaxonomyRepository,
} from '../repositories/firestoreRepositories';
import testOwnerConfig from '../../../../../test-config/firestore-test-owner.json';

const UID = testOwnerConfig.ownerUid;
const ITEM = '11111111-1111-4111-8111-111111111111';
const CARD = '22222222-2222-4222-8222-222222222222';
const EVENT = '33333333-3333-4333-8333-333333333333';
const IMAGE = '44444444-4444-4444-8444-444444444444';
// The Storage emulator's upload path is stable with a normal sized image payload.
const IMAGE_BYTES = new Uint8Array(300 * 1024).fill(42);

async function backup(withMedia: boolean): Promise<BackupEnvelopeV1> {
  return {
    format: 'mindspark-backup', backupVersion: 1, exportedAt: '2025-01-01T00:00:00.000Z',
    data: {
      taxonomy: { domains: [{ id: 'domain', name: 'Domain' }],
        topics: [{ id: 'topic', domainId: 'domain', name: 'Topic' }],
        subtopics: [], allowedTags: ['tag'] },
      settings: { schemaVersion: 1, desiredRetention: 0.9,
        activeParameterSetId: DEFAULT_PARAMETER_SET.id,
        newCardDailyLimit: 5, reserveHorizonHours: 24 },
      schedulerParameterSets: [{ ...DEFAULT_PARAMETER_SET }],
      knowledgeItems: [{ id: ITEM, schemaVersion: 1, title: 'Title', content: 'Content',
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
      archivePath: `media/${IMAGE}`, mimeType: 'image/png', byteLength: IMAGE_BYTES.length,
      sha256: await webCryptoBackupHasher.sha256(IMAGE_BYTES) }] : [],
  };
}

describe('B6 Firebase restore (emulators)', () => {
  let env: RulesTestEnvironment;
  beforeAll(async () => {
    env = await initializeTestEnvironment({
      projectId: 'mindspark-b6-restore-test',
      firestore: { host: '127.0.0.1', port: 8080,
        rules: readFileSync(resolve(__dirname, '../../../../../.generated/firestore.test.rules'), 'utf8') },
      storage: { host: '127.0.0.1', port: 9199,
        rules: readFileSync(resolve(__dirname, '../../../../../.generated/storage.test.rules'), 'utf8') },
    });
  });
  afterAll(async () => { await env.cleanup(); });
  beforeEach(async () => { await env.clearFirestore(); await env.clearStorage(); });

  function harness() {
    const context = env.authenticatedContext(UID);
    const db = context.firestore() as any;
    const storage = context.storage() as any;
    const repos = {
      knowledge: new FirestoreKnowledgeRepository(db, UID),
      reviewCards: new FirestoreReviewCardRepository(db, UID),
      reviewEvents: new FirestoreReviewEventRepository(db, UID),
      taxonomy: new FirestoreTaxonomyRepository(db, UID),
      parameterSets: new FirestoreSchedulerParameterSetRepository(db, UID),
      settings: new FirestoreSettingsRepository(db, UID),
    };
    const media = new FirebaseRestoreMediaGateway(storage, UID);
    const writes = new FirebaseRestoreWriteGateway(db, UID);
    return { db, repos, media, writes,
      service: new BackupFirebaseRestoreService(repos, media, writes) };
  }

  it('restores immutable evidence with a fresh server timestamp and is idempotent', async () => {
    const { db, repos, media, service } = harness();
    const source = await backup(false);
    const plan = createRestorePlan(source, await collectRestoreTargetState(repos));
    expect((await service.execute(plan, { files: new Map() })).status).toBe('complete');
    const rawEvent = await getDoc(doc(db, `users/${UID}/reviewEvents/${EVENT}`));
    expect(rawEvent.data()?.deviceId).toBe('historical-device');
    expect(rawEvent.data()?.serverReceivedAt).toBeTruthy();
    expect((await repos.reviewEvents.get(EVENT))?.reviewTimestamp).toBe('2024-01-03T00:00:00.000Z');
    const retry = createRestorePlan(source, await collectRestoreTargetState(repos));
    const result = await service.execute(retry, { files: new Map() });
    expect(result.status).toBe('complete');
    expect(result.completedOperationIds).toEqual([]);
    expect((await repos.reviewEvents.list())).toHaveLength(1);
    expect(media.canonicalPath(ITEM, IMAGE)).toBe(`users/${UID}/knowledgeImages/${ITEM}/${IMAGE}`);
  });

  it('stops when a target document changes after preflight without overwriting it', async () => {
    const { db, repos, service } = harness();
    const source = await backup(false);
    const plan = createRestorePlan(source, await collectRestoreTargetState(repos));
    await setDoc(doc(db, `users/${UID}/schedulerParameterSets/${DEFAULT_PARAMETER_SET.id}`),
      { ...DEFAULT_PARAMETER_SET, maximumInterval: DEFAULT_PARAMETER_SET.maximumInterval - 1 });
    const result = await service.execute(plan, { files: new Map() });
    expect(result.status).toBe('conflict');
    expect(result.category).toBe('precondition_conflict');
    expect((await repos.knowledge.get(ITEM))).toBeNull();
    expect((await repos.parameterSets.get(DEFAULT_PARAMETER_SET.id))?.maximumInterval)
      .toBe(DEFAULT_PARAMETER_SET.maximumInterval - 1);
  });

  it.each([
    {
      name: 'taxonomy before an item insert', trigger: `knowledge_items:knowledge_item:${ITEM}`,
      path: 'taxonomy/current', change: { allowedTags: ['concurrent'] },
    },
    {
      name: 'item before a card insert', trigger: `review_cards:review_card:${CARD}`,
      path: `knowledgeItems/${ITEM}`, change: { title: 'Concurrent title' },
    },
    {
      name: 'item before an event insert', trigger: `review_events:review_event:${EVENT}`,
      path: `knowledgeItems/${ITEM}`, change: { title: 'Concurrent title' },
    },
    {
      name: 'card before an event insert', trigger: `review_events:review_event:${EVENT}`,
      path: `reviewCards/${CARD}`, change: { front: 'Concurrent front' },
    },
    {
      name: 'parameter set before an event insert', trigger: `review_events:review_event:${EVENT}`,
      path: `schedulerParameterSets/${DEFAULT_PARAMETER_SET.id}`,
      change: { maximumInterval: DEFAULT_PARAMETER_SET.maximumInterval - 1 },
    },
    {
      name: 'parameter set before settings insert', trigger: 'settings:settings:settings',
      path: `schedulerParameterSets/${DEFAULT_PARAMETER_SET.id}`,
      change: { maximumInterval: DEFAULT_PARAMETER_SET.maximumInterval - 1 },
    },
  ])('stops on a changed $name while preserving completed inserts', async ({ trigger, path, change }) => {
    const { db, repos, service } = harness();
    const source = await backup(false);
    const plan = createRestorePlan(source, await collectRestoreTargetState(repos));
    const result = await service.execute(plan, { files: new Map() }, async (operationId) => {
      if (operationId === trigger) {
        if (path.startsWith('schedulerParameterSets/')) {
          // Parameter sets are immutable to clients; simulate an out-of-band stale dependency.
          await env.withSecurityRulesDisabled(async (context) => {
            await setDoc(doc(context.firestore(), `users/${UID}/${path}`), change, { merge: true });
          });
        } else {
          await setDoc(doc(db, `users/${UID}/${path}`), change, { merge: true });
        }
      }
    });
    expect(result.status).toBe('conflict');
    expect(result.category).toBe('precondition_conflict');
    expect(result.failedOperationId).toBe(trigger);
    expect(result.completedOperationIds.length).toBeGreaterThan(0);
    expect((await getDoc(doc(db, `users/${UID}/${path}`))).data()).toMatchObject(change);
    const targetPath = {
      knowledge_items: `knowledgeItems/${ITEM}`,
      review_cards: `reviewCards/${CARD}`,
      review_events: `reviewEvents/${EVENT}`,
      settings: 'settings/main',
    }[trigger.split(':')[0]]!;
    expect((await getDoc(doc(db, `users/${UID}/${targetPath}`))).exists()).toBe(false);
  });

  it('uploads media to the current owner path and resumes after an injected failure', async () => {
    const { repos, media, writes } = harness();
    const objects = new Map<string, { bytes: Uint8Array; mimeType: string }>();
    const mediaBoundary = {
      canonicalPath: (itemId: string, imageId: string) => media.canonicalPath(itemId, imageId),
      readImageIfExists: async (path: string) => objects.get(path) ?? null,
      uploadImage: async ({ knowledgeItemId, imageId, blob }: {
        knowledgeItemId: string; imageId: string; blob: Blob;
      }) => {
        const path = media.canonicalPath(knowledgeItemId, imageId);
        objects.set(path, { bytes: new Uint8Array(await blob.arrayBuffer()), mimeType: blob.type });
        return path;
      },
    };
    const service = new BackupFirebaseRestoreService(repos, mediaBoundary, writes);
    const source = await backup(true);
    const payload = { files: new Map([[IMAGE, { bytes: IMAGE_BYTES, mimeType: 'image/png' }]]) };
    const plan = createRestorePlan(source, await collectRestoreTargetState(repos));
    const partial = await service.execute(plan, payload, (id) => {
      if (id.startsWith('knowledge_items')) throw new Error('injected failure');
    });
    expect(partial.status).toBe('incomplete');
    expect(partial.completedOperationIds[0]).toContain('media_prerequisites');
    const retry = createRestorePlan(source, await collectRestoreTargetState(repos));
    expect((await service.execute(retry, payload)).status).toBe('complete');
    expect((await repos.knowledge.get(ITEM))?.images?.[0]?.storagePath)
      .toBe(media.canonicalPath(ITEM, IMAGE));
    expect((await mediaBoundary.readImageIfExists(media.canonicalPath(ITEM, IMAGE)))?.bytes)
      .toEqual(IMAGE_BYTES);
    expect((await repos.reviewEvents.list())).toHaveLength(1);
  }, 20000);
});
