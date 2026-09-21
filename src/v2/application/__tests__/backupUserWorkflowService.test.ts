import { describe, expect, it, vi } from 'vitest';
import { zipSync, strToU8 } from 'fflate';
import { ZipBackupArchiveReader, ZipBackupArchiveSerializer } from '../../backup/archive';
import type { BackupEnvelopeV1 } from '../../backup/contract';
import { DEFAULT_PARAMETER_SET } from '../../domain/schedulerParameterSet';
import { createInMemoryRepositories } from '../../persistence/memory/inMemoryRepositories';
import {
  BackupUserWorkflowService,
  type BackupExporter,
  type PersistentRestoreExecutor,
} from '../backupUserWorkflowService';
import { webCryptoBackupHasher } from '../backupExportService';

const ITEM = '11111111-1111-4111-8111-111111111111';
const IMAGE = '22222222-2222-4222-8222-222222222222';
const MEDIA = new Uint8Array([1, 2, 3]);

async function envelope(withMedia = false): Promise<BackupEnvelopeV1> {
  return {
    format: 'mindspark-backup',
    backupVersion: 1,
    exportedAt: '2025-01-01T00:00:00.000Z',
    data: {
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
      schedulerParameterSets: [{ ...DEFAULT_PARAMETER_SET }],
      knowledgeItems: [{
        id: ITEM,
        schemaVersion: 1,
        title: 'Backup item',
        content: 'Portable content',
        taxonomy: { domainId: 'domain', topicId: 'topic' },
        status: 'active',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
        ...(withMedia ? {
          images: [{ id: IMAGE, assetId: IMAGE, alt: 'Diagram', placement: 'content' }],
        } : {}),
      }],
      reviewCards: [],
      reviewEvents: [],
    },
    media: withMedia ? [{
      assetId: IMAGE,
      imageId: IMAGE,
      knowledgeItemId: ITEM,
      archivePath: `media/${IMAGE}`,
      mimeType: 'image/png',
      byteLength: MEDIA.byteLength,
      sha256: await webCryptoBackupHasher.sha256(MEDIA),
    }] : [],
  };
}

async function archive(backup: BackupEnvelopeV1, bytes = MEDIA) {
  return new ZipBackupArchiveSerializer().serialize(
    backup,
    backup.media.map((entry) => ({ archivePath: entry.archivePath, bytes })),
  );
}

function toFflateBytes(source: Uint8Array): Uint8Array {
  const FflateUint8Array = strToU8('', true).constructor as Uint8ArrayConstructor;
  return new FflateUint8Array(source);
}

function renameZipMember(bytes: Uint8Array, from: string, to: string): Uint8Array {
  const source = Array.from(from, (character) => character.charCodeAt(0));
  const target = Uint8Array.from(to, (character) => character.charCodeAt(0));
  if (source.length !== target.length) throw new Error('ZIP member replacements must have equal length');

  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let replacements = 0;
  for (let offset = 0; offset <= bytes.length - 4; offset += 1) {
    const signature = view.getUint32(offset, true);
    const fileNameLengthOffset = signature === 0x04034b50
      ? offset + 26
      : signature === 0x02014b50
        ? offset + 28
        : -1;
    if (fileNameLengthOffset < 0 || fileNameLengthOffset + 2 > bytes.length) continue;

    const fileNameLength = view.getUint16(fileNameLengthOffset, true);
    const fileNameOffset = signature === 0x04034b50 ? offset + 30 : offset + 46;
    if (fileNameLength !== source.length || fileNameOffset + fileNameLength > bytes.length) continue;
    if (!source.every((value, index) => bytes[fileNameOffset + index] === value)) continue;

    bytes.set(target, fileNameOffset);
    replacements += 1;
  }
  if (replacements !== 2) throw new Error(`ZIP member name not found in both headers: ${from}`);
  return bytes;
}

function harness(backup: BackupEnvelopeV1) {
  const repos = createInMemoryRepositories();
  const exporter: BackupExporter = {
    exportBackup: vi.fn(async () => ({
      fileName: 'mindspark-v1.mindspark-backup' as const,
      mimeType: 'application/zip' as const,
      bytes: await archive(backup),
      backup,
    })),
  };
  const restore: PersistentRestoreExecutor = {
    execute: vi.fn(async () => ({
      status: 'complete' as const,
      completedOperationIds: ['knowledge_items:knowledge_item:' + ITEM],
      noOpOperationIds: [],
    })),
  };
  return {
    repos,
    exporter,
    restore,
    service: new BackupUserWorkflowService(repos, exporter, restore),
  };
}

describe('B7 backup archive reader and workflow', () => {
  it('parses the strict archive shape and rejects extra members', async () => {
    const backup = await envelope(true);
    const parsed = new ZipBackupArchiveReader().parse(await archive(backup));
    expect(parsed.backup).toEqual(backup);
    expect(parsed.media.get(IMAGE)?.bytes).toEqual(MEDIA);

    const unsafe = zipSync({
      'backup.json': strToU8(JSON.stringify(backup)),
      [`media/${IMAGE}`]: MEDIA,
      'extra.txt': strToU8('unexpected'),
    });
    expect(() => new ZipBackupArchiveReader().parse(unsafe))
      .toThrowError(/Invalid archive member/);
  });

  it('rejects duplicate manifest and media members before overwrite', async () => {
    const backup = await envelope(true);
    const manifest = toFflateBytes(strToU8(JSON.stringify(backup)));
    const mediaBytes = toFflateBytes(MEDIA);

    const duplicateManifest = renameZipMember(zipSync({
      'backup.json': manifest,
      'backxx.json': manifest,
      [`media/${IMAGE}`]: mediaBytes,
    }), 'backxx.json', 'backup.json');
    expect(() => new ZipBackupArchiveReader().parse(duplicateManifest))
      .toThrowError(/Invalid archive member: backup\.json/);

    const mediaPath = `media/${IMAGE}`;
    const aliasPath = `${mediaPath.slice(0, -1)}3`;
    const duplicateMedia = renameZipMember(zipSync({
      'backup.json': manifest,
      [mediaPath]: mediaBytes,
      [aliasPath]: mediaBytes,
    }), aliasPath, mediaPath);
    expect(() => new ZipBackupArchiveReader().parse(duplicateMedia))
      .toThrowError(new RegExp(`Invalid archive member: ${mediaPath}`));
  });

  it('rejects duplicate normalized member identities', async () => {
    const backup = await envelope(false);
    const mediaBytes = toFflateBytes(MEDIA);
    const duplicateNormalized = zipSync({
      'backup.json': toFflateBytes(strToU8(JSON.stringify(backup))),
      'media/caf\u00e9': mediaBytes,
      'media/cafe\u0301': mediaBytes,
    });
    expect(() => new ZipBackupArchiveReader().parse(duplicateNormalized))
      .toThrowError(/Invalid archive member: media\/cafe\u0301/);
  });

  it('validates media integrity before building a non-destructive preview', async () => {
    const backup = await envelope(true);
    const { service } = harness(backup);
    const inspected = await service.inspectBackup(await archive(backup));

    expect(inspected.summary).toMatchObject({
      knowledgeItems: 1,
      mediaFiles: 1,
      conflicts: 0,
    });
    expect(inspected.summary.inserts).toBeGreaterThan(0);

    const corrupted = await archive(backup, new Uint8Array([9, 9, 9]));
    await expect(service.inspectBackup(corrupted)).rejects.toMatchObject({
      code: 'media_validation',
    });
  });

  it('previews conflicts without executing and passes an accepted inspection to B6', async () => {
    const backup = await envelope(false);
    const { repos, restore, service } = harness(backup);
    const { images: _images, ...targetItem } = backup.data.knowledgeItems[0];
    await repos.knowledge.create({
      ...targetItem,
      title: 'Different target title',
    });
    const blocked = await service.inspectBackup(await archive(backup));
    expect(blocked.summary.conflicts).toBe(1);
    expect(restore.execute).not.toHaveBeenCalled();

    const clean = harness(backup);
    const accepted = await clean.service.inspectBackup(await archive(backup));
    const result = await clean.service.executeRestore(accepted);
    expect(result.status).toBe('complete');
    expect(clean.restore.execute).toHaveBeenCalledWith(accepted.plan, accepted.payload);
  });
});
