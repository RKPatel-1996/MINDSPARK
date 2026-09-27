import { createHash } from 'node:crypto';
import { describe, expect, it, vi } from 'vitest';
import { ZipBackupArchiveReader } from '../../backup/archive';
import { bootstrapUserRepositories } from '../bootstrapService';
import { BackupRecoveryPointService } from '../backupRecoveryPointService';
import type { BackupSourceRepositories } from '../backupSnapshotService';
import { createInMemoryRepositories } from '../../persistence/memory/inMemoryRepositories';

const FIXED_EXPORTED_AT = '2026-09-27T08:00:00.000Z';
const ITEM_ID = '11111111-1111-4111-8111-111111111111';

describe('BackupRecoveryPointService', () => {
  it('creates a validated text-only V1 archive and SHA-256 from a read-only source', async () => {
    const repos = createInMemoryRepositories();
    await bootstrapUserRepositories(repos);

    await repos.knowledge.create({
      id: ITEM_ID,
      schemaVersion: 1,
      title: 'Automated recovery point',
      content: 'Controlled headless backup content',
      taxonomy: {
        domainId: 'computing',
        topicId: 'linux',
        subtopicId: 'shell',
      },
      status: 'active',
      createdAt: '2026-09-27T07:00:00.000Z',
      updatedAt: '2026-09-27T07:00:00.000Z',
    });

    const source = {
      taxonomy: { get: () => repos.taxonomy.get() },
      settings: { get: () => repos.settings.get() },
      parameterSets: { list: () => repos.parameterSets.list() },
      knowledge: { list: () => repos.knowledge.list() },
      reviewCards: { list: () => repos.reviewCards.list() },
      reviewEvents: { list: () => repos.reviewEvents.list() },
    } satisfies BackupSourceRepositories;

    const readImage = vi.fn(async () => {
      throw new Error('Storage must not be read for a text-only recovery point');
    });

    const result = await new BackupRecoveryPointService(
      source,
      { readImage },
      () => FIXED_EXPORTED_AT,
    ).createRecoveryPoint();

    expect(readImage).not.toHaveBeenCalled();
    expect(result.fileName).toBe('mindspark-v1.mindspark-backup');
    expect(result.mimeType).toBe('application/zip');
    expect(result.backup.backupVersion).toBe(1);
    expect(result.backup.exportedAt).toBe(FIXED_EXPORTED_AT);
    expect(result.backup.media).toEqual([]);

    expect(result.archiveSha256).toBe(
      createHash('sha256').update(result.bytes).digest('hex'),
    );

    const parsed = new ZipBackupArchiveReader().parse(result.bytes);

    expect(parsed.backup).toEqual(result.backup);
    expect(parsed.backup.data.knowledgeItems).toHaveLength(1);
    expect(parsed.backup.data.knowledgeItems[0]).toMatchObject({
      id: ITEM_ID,
      title: 'Automated recovery point',
      content: 'Controlled headless backup content',
    });
  });
});
