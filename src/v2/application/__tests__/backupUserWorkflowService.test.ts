import { describe, expect, it, vi } from 'vitest';
import { zipSync, strToU8 } from 'fflate';
import { ZipBackupArchiveReader } from '../../backup/archive';
import type { BackupEnvelopeV1 } from '../../backup/contract';
import { ZipBackupArchiveSerializer } from '../../backup/archive';
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
