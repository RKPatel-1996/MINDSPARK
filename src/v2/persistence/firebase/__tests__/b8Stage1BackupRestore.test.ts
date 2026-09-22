import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import {
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { doc, setDoc } from 'firebase/firestore';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import type { BackupEnvelopeV1 } from '../../../backup/contract';
import { BackupExportService, type BackupExportResult } from '../../../application/backupExportService';
import { BackupFirebaseRestoreService } from '../../../application/backupFirebaseRestoreService';
import { collectRestoreTargetState } from '../../../application/backupRestoreService';
import type { BackupSourceSnapshot } from '../../../application/backupSnapshotService';
import { BackupUserWorkflowService } from '../../../application/backupUserWorkflowService';
import { DEFAULT_PARAMETER_SET } from '../../../domain/schedulerParameterSet';
import { FirebaseRestoreWriteGateway } from '../backupRestoreGateway';
import { buildKnowledgeImageStoragePath } from '../imageStorageService';
import {
  FirestoreKnowledgeRepository,
  FirestoreReviewCardRepository,
  FirestoreReviewEventRepository,
  FirestoreSchedulerParameterSetRepository,
  FirestoreSettingsRepository,
  FirestoreTaxonomyRepository,
} from '../repositories/firestoreRepositories';
import testOwnerConfig from '../../../../../test-config/firestore-test-owner.json';

const OWNER = testOwnerConfig.ownerUid;
const ITEM_A = '11111111-1111-4111-8111-111111111111';
const ITEM_B = '21111111-1111-4111-8111-111111111111';
const CARD_A = '31111111-1111-4111-8111-111111111111';
const CARD_B = '41111111-1111-4111-8111-111111111111';
const EVENT_A = '51111111-1111-4111-8111-111111111111';
const IMAGE_A = '61111111-1111-4111-8111-111111111111';
const HISTORICAL_PARAMETER_SET_ID = 'fsrs-6-b8-historical';
const EXPORTED_AT = '2026-09-22T00:00:00.000Z';
const IMAGE_PATH = `users/${OWNER}/knowledgeImages/${ITEM_A}/${IMAGE_A}`;

function deterministicImage(seed: number): Uint8Array {
  // The Storage emulator is reliable with a normal-sized upload. The PNG
  // signature makes the synthetic payload recognizable without real media.
  const bytes = new Uint8Array(300 * 1024).fill(seed);
  bytes.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  return bytes;
}

const IMAGE_BYTES = deterministicImage(0x2a);
const CONFLICTING_IMAGE_BYTES = deterministicImage(0x4b);

function parameterSet(id = DEFAULT_PARAMETER_SET.id) {
  return {
    ...DEFAULT_PARAMETER_SET,
    id,
    weights: [...DEFAULT_PARAMETER_SET.weights],
    learningSteps: [...DEFAULT_PARAMETER_SET.learningSteps],
    relearningSteps: [...DEFAULT_PARAMETER_SET.relearningSteps],
  };
}

function representativeSnapshot(): BackupSourceSnapshot {
  return {
    exportedAt: EXPORTED_AT,
    taxonomy: {
      domains: [{ id: 'b8-domain', name: 'Synthetic Domain' }],
      topics: [{ id: 'b8-topic', domainId: 'b8-domain', name: 'Synthetic Topic' }],
      subtopics: [{
        id: 'b8-subtopic',
        topicId: 'b8-topic',
        name: 'Synthetic Subtopic',
      }],
      allowedTags: ['b8-alpha', 'b8-beta'],
    },
    settings: {
      schemaVersion: 1,
      desiredRetention: 0.9,
      activeParameterSetId: DEFAULT_PARAMETER_SET.id,
      newCardDailyLimit: 7,
      reserveHorizonHours: 36,
    },
    schedulerParameterSets: [
      parameterSet(),
      parameterSet(HISTORICAL_PARAMETER_SET_ID),
    ],
    knowledgeItems: [
      {
        id: ITEM_A,
        schemaVersion: 1,
        title: 'Synthetic item A',
        content: 'Synthetic restore content A',
        taxonomy: {
          domainId: 'b8-domain',
          topicId: 'b8-topic',
          subtopicId: 'b8-subtopic',
        },
        tags: ['b8-alpha'],
        status: 'active',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-02T00:00:00.000Z',
        images: [{
          id: IMAGE_A,
          storagePath: IMAGE_PATH,
          alt: 'Synthetic diagram',
          placement: 'content',
        }],
      },
      {
        id: ITEM_B,
        schemaVersion: 1,
        title: 'Synthetic item B',
        content: 'Synthetic restore content B',
        taxonomy: { domainId: 'b8-domain', topicId: 'b8-topic' },
        tags: ['b8-beta'],
        status: 'archived',
        createdAt: '2026-01-03T00:00:00.000Z',
        updatedAt: '2026-01-04T00:00:00.000Z',
      },
    ],
    reviewCards: [
      {
        id: CARD_A,
        knowledgeItemId: ITEM_A,
        schemaVersion: 1,
        type: 'flashcard',
        front: 'Synthetic prompt A',
        back: 'Synthetic answer A',
        suspended: false,
        createdAt: '2026-01-05T00:00:00.000Z',
        updatedAt: '2026-01-06T00:00:00.000Z',
      },
      {
        id: CARD_B,
        knowledgeItemId: ITEM_B,
        schemaVersion: 1,
        type: 'free_recall',
        prompt: 'Synthetic prompt B',
        answerGuidance: 'Synthetic answer guidance B',
        suspended: true,
        suspendedReason: 'flagged_by_user',
        createdAt: '2026-01-07T00:00:00.000Z',
        updatedAt: '2026-01-08T00:00:00.000Z',
      },
    ],
    reviewEvents: [{
      id: EVENT_A,
      cardId: CARD_A,
      knowledgeItemId: ITEM_A,
      reviewTimestamp: '2026-01-09T00:00:00.000Z',
      rating: 'good',
      cardType: 'flashcard',
      objectiveCorrect: null,
      guessedOrStruggled: false,
      durationMs: 800,
      deviceId: 'b8-synthetic-device',
      schedulerMetadata: {
        algorithm: DEFAULT_PARAMETER_SET.algorithm,
        implementation: DEFAULT_PARAMETER_SET.implementation,
        implementationVersion: DEFAULT_PARAMETER_SET.implementationVersion,
        parameterSetId: HISTORICAL_PARAMETER_SET_ID,
        desiredRetention: 0.9,
        scheduledDays: 2,
        stability: 1.5,
        difficulty: 4.5,
      },
      schemaVersion: 1,
    }],
  };
}

function partialSnapshot(full: BackupSourceSnapshot): BackupSourceSnapshot {
  return {
    ...structuredClone(full),
    knowledgeItems: structuredClone(full.knowledgeItems.filter((item) => item.id === ITEM_A)),
    reviewCards: structuredClone(full.reviewCards.filter((card) => card.id === CARD_A)),
  };
}

function exporter(snapshot: BackupSourceSnapshot) {
  return new BackupExportService(
    { createSnapshot: async () => snapshot },
    {
      readImage: async (storagePath) => storagePath === IMAGE_PATH
        ? { bytes: IMAGE_BYTES, mimeType: 'image/png' }
        : null,
    },
  );
}

function archiveSha256(bytes: Uint8Array): string {
  return createHash('sha256').update(bytes).digest('hex');
}

describe('B8 Stage 1 representative backup and restore', () => {
  let environment: RulesTestEnvironment;
  let exported: BackupExportResult;
  let snapshot: BackupSourceSnapshot;

  beforeAll(async () => {
    environment = await initializeTestEnvironment({
      projectId: 'mindspark-b8-stage1-test',
      firestore: {
        host: '127.0.0.1',
        port: 8080,
        rules: readFileSync(
          resolve(__dirname, '../../../../../.generated/firestore.test.rules'),
          'utf8',
        ),
      },
      storage: {
        host: '127.0.0.1',
        port: 9199,
        rules: readFileSync(
          resolve(__dirname, '../../../../../.generated/storage.test.rules'),
          'utf8',
        ),
      },
    });
    snapshot = representativeSnapshot();
  });

  beforeEach(async () => {
    await environment.clearFirestore();
    await environment.clearStorage();
  });

  afterEach(async () => {
    const objectRef = environment.authenticatedContext(OWNER).storage().ref(IMAGE_PATH);
    try {
      await objectRef.delete();
    } catch (error) {
      if (!(typeof error === 'object' && error !== null && 'code' in error &&
        error.code === 'storage/object-not-found')) throw error;
    }
    await environment.clearStorage();
  });

  afterAll(async () => {
    await environment.cleanup();
  });

  function harness() {
    const context = environment.authenticatedContext(OWNER);
    const db = context.firestore() as any;
    const repos = {
      knowledge: new FirestoreKnowledgeRepository(db, OWNER),
      reviewCards: new FirestoreReviewCardRepository(db, OWNER),
      reviewEvents: new FirestoreReviewEventRepository(db, OWNER),
      taxonomy: new FirestoreTaxonomyRepository(db, OWNER),
      parameterSets: new FirestoreSchedulerParameterSetRepository(db, OWNER),
      settings: new FirestoreSettingsRepository(db, OWNER),
    };
    const storage = context.storage();
    const media = {
      canonicalPath: (knowledgeItemId: string, imageId: string) =>
        buildKnowledgeImageStoragePath(OWNER, knowledgeItemId, imageId),
      readImageIfExists: async (storagePath: string) => {
        const objectRef = storage.ref(storagePath);
        try {
          const metadata = await objectRef.getMetadata();
          const response = await fetch(await objectRef.getDownloadURL());
          if (!response.ok) throw new Error(`Storage download failed: ${response.status}`);
          return {
            bytes: new Uint8Array(await response.arrayBuffer()),
            mimeType: metadata.contentType ?? '',
          };
        } catch (error) {
          if (typeof error === 'object' && error !== null && 'code' in error &&
            error.code === 'storage/object-not-found') return null;
          throw error;
        }
      },
      uploadImage: async ({ knowledgeItemId, imageId, blob }: {
        knowledgeItemId: string;
        imageId: string;
        blob: Blob;
      }) => {
        const storagePath = buildKnowledgeImageStoragePath(OWNER, knowledgeItemId, imageId);
        await Promise.resolve(storage.ref(storagePath).put(
          new Uint8Array(await blob.arrayBuffer()),
          { contentType: blob.type },
        ));
        return storagePath;
      },
    };
    const restore = new BackupFirebaseRestoreService(
      repos,
      media,
      new FirebaseRestoreWriteGateway(db, OWNER),
    );
    const exportService = exporter(snapshot);
    const workflow = new BackupUserWorkflowService(repos, exportService, restore);
    return { db, repos, media, restore, workflow };
  }

  async function exportSnapshot(value: BackupSourceSnapshot): Promise<BackupExportResult> {
    return exporter(value).exportBackup();
  }

  it('B8-01 exports deterministic representative data without mutating the source', async () => {
    const before = structuredClone(snapshot);
    exported = await exportSnapshot(snapshot);
    const sha256 = archiveSha256(exported.bytes);

    expect(snapshot).toEqual(before);
    expect(exported.backup).toMatchObject({
      format: 'mindspark-backup',
      backupVersion: 1,
      data: {
        schedulerParameterSets: expect.arrayContaining([
          expect.objectContaining({ id: DEFAULT_PARAMETER_SET.id }),
          expect.objectContaining({ id: HISTORICAL_PARAMETER_SET_ID }),
        ]),
        knowledgeItems: expect.arrayContaining([
          expect.objectContaining({ id: ITEM_A }),
          expect.objectContaining({ id: ITEM_B }),
        ]),
      },
      media: [expect.objectContaining({
        assetId: IMAGE_A,
        byteLength: IMAGE_BYTES.byteLength,
        sha256: archiveSha256(IMAGE_BYTES),
      })],
    });
    expect(exported.backup.data.reviewCards).toHaveLength(2);
    expect(exported.backup.data.reviewEvents).toHaveLength(1);

    const artifactDirectory = process.env.MINDSPARK_B8_ARTIFACT_DIR;
    if (artifactDirectory) {
      mkdirSync(join(artifactDirectory, 'archives'), { recursive: true });
      writeFileSync(join(artifactDirectory, 'archives', exported.fileName), exported.bytes);
    }
    console.info(`B8_STAGE1_ARCHIVE sha256=${sha256} bytes=${exported.bytes.byteLength}`);
  });

  it('B8-02 validates the archive and creates a write-free preview', async () => {
    const { repos, workflow } = harness();
    const before = await collectRestoreTargetState(repos);
    const inspection = await workflow.inspectBackup(exported.bytes);
    const after = await collectRestoreTargetState(repos);

    expect(inspection.summary).toMatchObject({
      knowledgeItems: 2,
      reviewCards: 2,
      reviewEvents: 1,
      mediaFiles: 1,
      inserts: 9,
      noOps: 0,
      conflicts: 0,
    });
    expect(after).toEqual(before);
  });

  it('B8-03 and B8-04 restore an empty target and replan it entirely to no-ops', async () => {
    const { repos, media, workflow } = harness();
    const firstInspection = await workflow.inspectBackup(exported.bytes);
    const first = await workflow.executeRestore(firstInspection);

    expect(first).toMatchObject({ status: 'complete' });
    expect(first.completedOperationIds).toHaveLength(10);
    expect(await repos.knowledge.list()).toHaveLength(2);
    expect(await repos.reviewCards.list()).toHaveLength(2);
    expect(await repos.reviewEvents.list()).toHaveLength(1);
    expect(await repos.parameterSets.list()).toHaveLength(2);
    expect(await repos.taxonomy.get()).toEqual(exported.backup.data.taxonomy);
    expect(await repos.settings.get()).toEqual(exported.backup.data.settings);
    expect(await media.readImageIfExists(media.canonicalPath(ITEM_A, IMAGE_A)))
      .toEqual({ bytes: IMAGE_BYTES, mimeType: 'image/png' });

    const completedTarget = await collectRestoreTargetState(repos);
    const secondInspection = await workflow.inspectBackup(exported.bytes);
    expect(secondInspection.summary).toMatchObject({ inserts: 0, noOps: 9, conflicts: 0 });
    const second = await workflow.executeRestore(secondInspection);
    expect(second).toMatchObject({ status: 'complete', completedOperationIds: [] });
    expect(second.noOpOperationIds).toHaveLength(10);
    expect(await collectRestoreTargetState(repos)).toEqual(completedTarget);
    expect(await repos.reviewEvents.list()).toHaveLength(1);
  }, 30000);

  it('B8-05 inserts only the missing portion of a dependency-valid target', async () => {
    const { repos, media, workflow } = harness();
    const partial = await exportSnapshot(partialSnapshot(snapshot));
    const partialInspection = await workflow.inspectBackup(partial.bytes);
    expect((await workflow.executeRestore(partialInspection)).status).toBe('complete');

    const matchingItem = await repos.knowledge.get(ITEM_A);
    const matchingCard = await repos.reviewCards.get(CARD_A);
    const matchingEvent = await repos.reviewEvents.get(EVENT_A);
    const matchingMedia = await media.readImageIfExists(media.canonicalPath(ITEM_A, IMAGE_A));
    const fullInspection = await workflow.inspectBackup(exported.bytes);

    expect(fullInspection.summary).toMatchObject({ inserts: 2, noOps: 7, conflicts: 0 });
    const result = await workflow.executeRestore(fullInspection);
    expect(result).toMatchObject({ status: 'complete' });
    expect(result.completedOperationIds).toEqual([
      `knowledge_items:knowledge_item:${ITEM_B}`,
      `review_cards:review_card:${CARD_B}`,
    ]);
    expect(await repos.knowledge.get(ITEM_A)).toEqual(matchingItem);
    expect(await repos.reviewCards.get(CARD_A)).toEqual(matchingCard);
    expect(await repos.reviewEvents.get(EVENT_A)).toEqual(matchingEvent);
    expect(await media.readImageIfExists(media.canonicalPath(ITEM_A, IMAGE_A))).toEqual(matchingMedia);
    expect(await repos.knowledge.list()).toHaveLength(2);
    expect(await repos.reviewCards.list()).toHaveLength(2);
  }, 30000);

  it('B8-06 blocks a conflicting immutable record with zero restore writes', async () => {
    const { db, repos, workflow } = harness();
    const initial = await workflow.inspectBackup(exported.bytes);
    expect((await workflow.executeRestore(initial)).status).toBe('complete');

    await environment.withSecurityRulesDisabled(async (context) => {
      await setDoc(
        doc(context.firestore(), `users/${OWNER}/reviewCards/${CARD_A}`),
        { front: 'Conflicting synthetic prompt' },
        { merge: true },
      );
    });
    const before = await collectRestoreTargetState(repos);
    const conflictInspection = await workflow.inspectBackup(exported.bytes);

    expect(conflictInspection.summary.conflicts).toBe(1);
    expect(conflictInspection.plan.conflicts).toEqual([
      expect.objectContaining({ entityType: 'review_card', entityId: CARD_A }),
    ]);
    const result = await workflow.executeRestore(conflictInspection);
    expect(result).toMatchObject({
      status: 'conflict',
      category: 'unsafe_plan',
      completedOperationIds: [],
    });
    expect(await collectRestoreTargetState(repos)).toEqual(before);
    expect((await repos.reviewCards.get(CARD_A) as any)?.front)
      .toBe('Conflicting synthetic prompt');
    expect(db).toBeDefined();
  }, 30000);

  it('B8-07 preserves conflicting media and performs zero downstream writes', async () => {
    const { repos, media, workflow } = harness();
    const path = media.canonicalPath(ITEM_A, IMAGE_A);
    await media.uploadImage({
      knowledgeItemId: ITEM_A,
      imageId: IMAGE_A,
      blob: new Blob([CONFLICTING_IMAGE_BYTES as BlobPart], { type: 'image/png' }),
    });
    const beforeMedia = await media.readImageIfExists(path);
    const inspection = await workflow.inspectBackup(exported.bytes);
    const result = await workflow.executeRestore(inspection);

    expect(result).toMatchObject({
      status: 'conflict',
      category: 'media_conflict',
      completedOperationIds: [],
      failedOperationId: `media_prerequisites:media:${IMAGE_A}`,
    });
    expect(await media.readImageIfExists(path)).toEqual(beforeMedia);
    expect(await repos.knowledge.list()).toEqual([]);
    expect(await repos.reviewCards.list()).toEqual([]);
    expect(await repos.reviewEvents.list()).toEqual([]);
    expect(await repos.parameterSets.list()).toEqual([]);
    expect(await repos.taxonomy.get()).toBeNull();
    expect(await repos.settings.get()).toBeNull();
  }, 30000);

  it('B8-08 reports an explained partial failure and identifies completed work', async () => {
    const { repos, media, restore, workflow } = harness();
    const inspection = await workflow.inspectBackup(exported.bytes);
    const failedOperationId = `knowledge_items:knowledge_item:${ITEM_A}`;
    const result = await restore.execute(
      inspection.plan,
      inspection.payload,
      (operationId) => {
        if (operationId === failedOperationId) throw new Error('B8 injected rejection');
      },
    );

    expect(result).toMatchObject({
      status: 'incomplete',
      category: 'firestore_failure',
      failedOperationId,
    });
    expect(result.completedOperationIds).toEqual([
      `media_prerequisites:media:${IMAGE_A}`,
      `scheduler_parameter_sets:scheduler_parameter_set:${HISTORICAL_PARAMETER_SET_ID}`,
      `scheduler_parameter_sets:scheduler_parameter_set:${DEFAULT_PARAMETER_SET.id}`,
      'taxonomy:taxonomy:taxonomy',
    ]);
    expect(await media.readImageIfExists(media.canonicalPath(ITEM_A, IMAGE_A)))
      .toEqual({ bytes: IMAGE_BYTES, mimeType: 'image/png' });
    expect(await repos.parameterSets.list()).toHaveLength(2);
    expect(await repos.taxonomy.get()).toEqual(exported.backup.data.taxonomy);
    expect(await repos.knowledge.list()).toEqual([]);
    expect(await repos.reviewCards.list()).toEqual([]);
    expect(await repos.reviewEvents.list()).toEqual([]);
    expect(await repos.settings.get()).toBeNull();
  }, 30000);
});
