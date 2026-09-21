import { createHash } from 'node:crypto';
import { strFromU8, unzipSync } from 'fflate';
import { describe, expect, it } from 'vitest';
import {
  BackupExportService,
  type BackupMediaGateway,
} from '../backupExportService';
import type { BackupSourceSnapshot } from '../backupSnapshotService';
import {
  BackupArchiveSerializationError,
  ZipBackupArchiveSerializer,
} from '../../backup/archive';
import type { BackupEnvelopeV1 } from '../../backup/contract';
import { MAX_IMAGE_BYTES } from '../../domain/imageMedia';
import type { KnowledgeItem } from '../../domain/knowledge';
import { DEFAULT_PARAMETER_SET } from '../../domain/schedulerParameterSet';

const ITEM_A = '11111111-1111-4111-8111-111111111111';
const ITEM_B = '21111111-1111-4111-8111-111111111111';
const IMAGE_A = '31111111-1111-4111-8111-111111111111';
const IMAGE_B = '41111111-1111-4111-8111-111111111111';
const EXPORTED_AT = '2025-01-01T00:00:00.000Z';

function makeItem(
  id: string,
  images?: KnowledgeItem['images'],
): KnowledgeItem {
  return {
    id,
    schemaVersion: 1,
    title: `Item ${id}`,
    content: 'Portable backup content',
    taxonomy: { domainId: 'domain', topicId: 'topic' },
    status: 'active',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    ...(images ? { images } : {}),
  };
}

function makeSnapshot(items: KnowledgeItem[] = []): BackupSourceSnapshot {
  return {
    exportedAt: EXPORTED_AT,
    taxonomy: {
      domains: [{ id: 'domain', name: 'Domain' }],
      topics: [{ id: 'topic', domainId: 'domain', name: 'Topic' }],
      subtopics: [],
      allowedTags: [],
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
    knowledgeItems: items,
    reviewCards: [],
    reviewEvents: [],
  };
}

function sourceImage(id: string, storagePath = `users/owner/knowledgeImages/${ITEM_A}/${id}`) {
  return {
    id,
    storagePath,
    alt: `Image ${id}`,
    placement: 'content' as const,
  };
}

function provider(snapshot: BackupSourceSnapshot) {
  return { createSnapshot: async () => snapshot };
}

function gateway(files: Record<string, { bytes: Uint8Array; mimeType: string }>): BackupMediaGateway {
  return {
    readImage: async (path) => files[path] ?? null,
  };
}

function readArchive(bytes: Uint8Array) {
  return unzipSync(bytes);
}

describe('BackupExportService', () => {
  it('creates a valid manifest-only archive when the source has no media', async () => {
    const result = await new BackupExportService(
      provider(makeSnapshot([makeItem(ITEM_A)])),
      gateway({}),
    ).exportBackup();
    const archive = readArchive(result.bytes);

    expect(Object.keys(archive)).toEqual(['backup.json']);
    expect(result.backup.media).toEqual([]);
    expect(JSON.parse(strFromU8(archive['backup.json']))).toEqual(result.backup);
    expect(result.fileName).toBe('mindspark-v1.mindspark-backup');
  });

  it.each(['image/jpeg', 'image/png', 'image/webp'] as const)(
    'exports a portable image with %s metadata and matching bytes',
    async (mimeType) => {
      const path = `users/owner/knowledgeImages/${ITEM_A}/${IMAGE_A}`;
      const bytes = new Uint8Array([1, 2, 3, 4]);
      const snapshot = makeSnapshot([makeItem(ITEM_A, [sourceImage(IMAGE_A, path)])]);
      const result = await new BackupExportService(
        provider(snapshot),
        gateway({ [path]: { bytes, mimeType } }),
      ).exportBackup();
      const image = result.backup.data.knowledgeItems[0].images?.[0];
      const media = result.backup.media[0];
      const archive = readArchive(result.bytes);

      expect(image).toEqual({
        id: IMAGE_A,
        assetId: IMAGE_A,
        alt: `Image ${IMAGE_A}`,
        placement: 'content',
      });
      expect(image).not.toHaveProperty('storagePath');
      expect(snapshot.knowledgeItems[0].images?.[0].storagePath).toBe(path);
      expect(media).toEqual({
        assetId: IMAGE_A,
        imageId: IMAGE_A,
        knowledgeItemId: ITEM_A,
        archivePath: `media/${IMAGE_A}`,
        mimeType,
        byteLength: bytes.byteLength,
        sha256: createHash('sha256').update(bytes).digest('hex'),
      });
      expect(archive[`media/${IMAGE_A}`]).toEqual(bytes);
    },
  );

  it('orders multiple media members deterministically and retains ownership', async () => {
    const pathA = `users/owner/knowledgeImages/${ITEM_A}/${IMAGE_A}`;
    const pathB = `users/owner/knowledgeImages/${ITEM_B}/${IMAGE_B}`;
    const snapshot = makeSnapshot([
      makeItem(ITEM_B, [sourceImage(IMAGE_B, pathB)]),
      makeItem(ITEM_A, [sourceImage(IMAGE_A, pathA)]),
    ]);
    const files = {
      [pathA]: { bytes: new Uint8Array([1]), mimeType: 'image/png' },
      [pathB]: { bytes: new Uint8Array([2]), mimeType: 'image/webp' },
    };
    const service = new BackupExportService(provider(snapshot), gateway(files));

    const first = await service.exportBackup();
    const second = await service.exportBackup();

    expect(first.bytes).toEqual(second.bytes);
    expect(first.backup.data.knowledgeItems.map((item) => item.id)).toEqual([ITEM_A, ITEM_B]);
    expect(first.backup.media.map((entry) => entry.knowledgeItemId)).toEqual([ITEM_A, ITEM_B]);
    expect(Object.keys(readArchive(first.bytes))).toEqual([
      `media/${IMAGE_A}`,
      `media/${IMAGE_B}`,
      'backup.json',
    ]);
  });

  it.each([
    ['missing_media', null],
    ['missing_media', { bytes: new Uint8Array(), mimeType: 'image/png' }],
    ['unsupported_mime_type', { bytes: new Uint8Array([1]), mimeType: 'image/gif' }],
    ['media_too_large', { bytes: new Uint8Array(MAX_IMAGE_BYTES + 1), mimeType: 'image/png' }],
  ] as const)('fails cleanly with %s and returns no archive', async (code, file) => {
    const path = `users/owner/knowledgeImages/${ITEM_A}/${IMAGE_A}`;
    const service = new BackupExportService(
      provider(makeSnapshot([makeItem(ITEM_A, [sourceImage(IMAGE_A, path)])])),
      { readImage: async () => file },
    );

    await expect(service.exportBackup()).rejects.toMatchObject({ code });
  });

  it('wraps gateway, hash, final validation, and archive failures', async () => {
    const path = `users/owner/knowledgeImages/${ITEM_A}/${IMAGE_A}`;
    const snapshot = makeSnapshot([makeItem(ITEM_A, [sourceImage(IMAGE_A, path)])]);
    const fileGateway = gateway({
      [path]: { bytes: new Uint8Array([1]), mimeType: 'image/png' },
    });

    await expect(new BackupExportService(provider(snapshot), {
      readImage: async () => { throw new Error('Storage unavailable'); },
    }).exportBackup()).rejects.toMatchObject({ code: 'media_read_failed' });

    await expect(new BackupExportService(
      provider(snapshot),
      fileGateway,
      { sha256: async () => { throw new Error('Digest unavailable'); } },
    ).exportBackup()).rejects.toMatchObject({ code: 'hash_failed' });

    const invalidSnapshot = makeSnapshot();
    invalidSnapshot.settings.activeParameterSetId = 'missing-parameter-set';
    await expect(new BackupExportService(
      provider(invalidSnapshot),
      gateway({}),
    ).exportBackup()).rejects.toMatchObject({ code: 'final_validation_failed' });

    await expect(new BackupExportService(
      provider(snapshot),
      fileGateway,
      undefined,
      { serialize: async () => { throw new Error('ZIP failed'); } },
    ).exportBackup()).rejects.toMatchObject({ code: 'archive_serialization_failed' });
  });

  it('rejects duplicate source image identities before reading media', async () => {
    let reads = 0;
    const service = new BackupExportService(
      provider(makeSnapshot([
        makeItem(ITEM_A, [sourceImage(IMAGE_A)]),
        makeItem(ITEM_B, [sourceImage(IMAGE_A)]),
      ])),
      { readImage: async () => { reads += 1; return null; } },
    );

    await expect(service.exportBackup()).rejects.toMatchObject({
      code: 'duplicate_media_identity',
    });
    expect(reads).toBe(0);
  });
});

describe('ZipBackupArchiveSerializer security', () => {
  const envelope: BackupEnvelopeV1 = {
    format: 'mindspark-backup',
    backupVersion: 1,
    exportedAt: EXPORTED_AT,
    data: {
      taxonomy: { domains: [], topics: [], subtopics: [], allowedTags: [] },
      settings: {
        schemaVersion: 1,
        desiredRetention: 0.9,
        activeParameterSetId: DEFAULT_PARAMETER_SET.id,
        newCardDailyLimit: 5,
        reserveHorizonHours: 24,
      },
      schedulerParameterSets: [],
      knowledgeItems: [],
      reviewCards: [],
      reviewEvents: [],
    },
    media: [{
      assetId: IMAGE_A,
      imageId: IMAGE_A,
      knowledgeItemId: ITEM_A,
      archivePath: `media/${IMAGE_A}`,
      mimeType: 'image/png',
      byteLength: 1,
      sha256: '0'.repeat(64),
    }],
  };

  it.each(['../escape', '/absolute', 'C:/absolute', 'media\\escape'])(
    'rejects unsafe or unmanifested path %s',
    async (archivePath) => {
      await expect(new ZipBackupArchiveSerializer().serialize(envelope, [{
        archivePath,
        bytes: new Uint8Array([1]),
      }])).rejects.toBeInstanceOf(BackupArchiveSerializationError);
    },
  );

  it('rejects duplicate and missing archive members', async () => {
    const member = {
      archivePath: `media/${IMAGE_A}`,
      bytes: new Uint8Array([1]),
    };
    const serializer = new ZipBackupArchiveSerializer();

    await expect(serializer.serialize(envelope, [member, member]))
      .rejects.toBeInstanceOf(BackupArchiveSerializationError);
    await expect(serializer.serialize(envelope, []))
      .rejects.toBeInstanceOf(BackupArchiveSerializationError);
  });
});
