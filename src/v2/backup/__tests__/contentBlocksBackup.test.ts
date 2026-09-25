import type { Firestore } from 'firebase/firestore';
import { describe, expect, it, vi } from 'vitest';
import { ZipBackupArchiveReader } from '../archive';
import { createRestorePlan } from '../restore';
import { DEFAULT_PARAMETER_SET } from '../../domain/schedulerParameterSet';
import type { KnowledgeItem } from '../../domain/knowledge';
import { createInMemoryRepositories } from '../../persistence/memory/inMemoryRepositories';
import { bootstrapUserRepositories, DEFAULT_SETTINGS } from '../../application/bootstrapService';
import { BackupExportService } from '../../application/backupExportService';
import { executeRestorePlan } from '../../application/backupRestoreService';
import { createFirebaseBackupWorkflow } from '../../persistence/firebase/backupWorkflowFactory';

const ITEM_ID = '11111111-1111-4111-8111-111111111111';
const CODE = "  function answer() {\n\treturn 42;\n}\n";
const MATH = '\\frac{a+b}{c}';
const TAXONOMY = {
  domains: [{ id: 'domain', name: 'Domain' }],
  topics: [{ id: 'topic', domainId: 'domain', name: 'Topic' }],
  subtopics: [],
  allowedTags: [],
};

const item: KnowledgeItem = {
  id: ITEM_ID,
  schemaVersion: 1,
  title: 'Portable blocks',
  content: 'Portable summary',
  blocks: [
    { type: 'text', content: 'Markdown **text**' },
    { type: 'code', language: 'javascript', content: CODE },
    { type: 'math', content: MATH },
  ],
  taxonomy: { domainId: 'domain', topicId: 'topic' },
  status: 'active',
  createdAt: '2026-09-22T00:00:00.000Z',
  updatedAt: '2026-09-22T00:00:00.000Z',
};

const snapshot = {
  exportedAt: '2026-09-22T01:00:00.000Z',
  taxonomy: TAXONOMY,
  settings: DEFAULT_SETTINGS,
  schedulerParameterSets: [DEFAULT_PARAMETER_SET],
  knowledgeItems: [item],
  reviewCards: [],
  reviewEvents: [],
};

describe('V1 text/code/math backup compatibility', () => {
  it('round-trips exact ordered block source in a V1 archive without reading media', async () => {
    const readImage = vi.fn(async () => {
      throw new Error('Storage must not be read for text-only export');
    });
    const exported = await new BackupExportService(
      { createSnapshot: async () => snapshot },
      { readImage },
    ).exportBackup();
    const parsed = new ZipBackupArchiveReader().parse(exported.bytes);

    expect(readImage).not.toHaveBeenCalled();
    expect(exported.backup.backupVersion).toBe(1);
    expect(exported.backup.media).toEqual([]);
    expect(parsed.backup.data.knowledgeItems[0].blocks).toEqual(item.blocks);
    expect(parsed.backup.data.knowledgeItems[0].blocks?.[1]).toMatchObject({
      language: 'javascript',
      content: CODE,
    });
    expect(parsed.backup.data.knowledgeItems[0].blocks?.[2].content).toBe(MATH);
  });

  it('preserves INSERT, NO_OP, and CONFLICT semantics for block-bearing items', async () => {
    const exported = await new BackupExportService(
      { createSnapshot: async () => snapshot },
      { readImage: async () => null },
    ).exportBackup();
    const empty = {
      taxonomy: null,
      settings: null,
      schedulerParameterSets: [],
      knowledgeItems: [],
      reviewCards: [],
      reviewEvents: [],
    };
    const insertPlan = createRestorePlan(exported.backup, empty);
    expect(insertPlan.operations.find((operation) => operation.entityType === 'knowledge_item')?.disposition)
      .toBe('INSERT');

    const repos = createInMemoryRepositories();
    const inserted = await executeRestorePlan(repos, insertPlan);
    expect(inserted.status).toBe('completed');
    expect((await repos.knowledge.get(ITEM_ID))?.blocks).toEqual(item.blocks);

    const noOpPlan = createRestorePlan(exported.backup, {
      taxonomy: TAXONOMY,
      settings: DEFAULT_SETTINGS,
      schedulerParameterSets: [DEFAULT_PARAMETER_SET],
      knowledgeItems: [exported.backup.data.knowledgeItems[0]],
      reviewCards: [],
      reviewEvents: [],
    });
    expect(noOpPlan.operations.every((operation) => operation.disposition === 'NO_OP')).toBe(true);

    const conflictPlan = createRestorePlan(exported.backup, {
      taxonomy: TAXONOMY,
      settings: DEFAULT_SETTINGS,
      schedulerParameterSets: [DEFAULT_PARAMETER_SET],
      knowledgeItems: [{ ...exported.backup.data.knowledgeItems[0], blocks: [{ type: 'math', content: 'x' }] }],
      reviewCards: [],
      reviewEvents: [],
    });
    expect(conflictPlan.conflicts).toHaveLength(1);
    expect(conflictPlan.operations.find((operation) => operation.entityType === 'knowledge_item')?.disposition)
      .toBe('CONFLICT');
  });

  it('exports a text-only Firebase workflow when Storage is unconfigured', async () => {
    const repos = createInMemoryRepositories();
    await bootstrapUserRepositories(repos);
    await repos.knowledge.create({
      ...item,
      taxonomy: { domainId: 'computing', topicId: 'linux', subtopicId: 'shell' },
    });

    const workflow = createFirebaseBackupWorkflow(
      repos,
      {} as Firestore,
      null,
      'owner',
    );
    const exported = await workflow.exportBackup();

    expect(exported.backup.media).toEqual([]);
    expect(exported.backup.data.knowledgeItems[0].blocks).toEqual(item.blocks);
  });
  it('keeps legacy media inspectable but fails export and restore explicitly without Storage', async () => {
    const imageId = '22222222-2222-4222-8222-222222222222';
    const storagePath = `users/owner/knowledgeImages/${ITEM_ID}/${imageId}`;
    const legacyItem: KnowledgeItem = {
      ...item,
      images: [{ id: imageId, storagePath, alt: 'Legacy diagram', placement: 'content' }],
    };

    const sourceRepos = createInMemoryRepositories();
    await bootstrapUserRepositories(sourceRepos);
    await sourceRepos.knowledge.create({
      ...legacyItem,
      taxonomy: { domainId: 'computing', topicId: 'linux', subtopicId: 'shell' },
    });
    const unavailableExport = createFirebaseBackupWorkflow(
      sourceRepos,
      {} as Firestore,
      null,
      'owner',
    );

    await expect(unavailableExport.exportBackup()).rejects.toMatchObject({
      code: 'media_read_failed',
      causeValue: expect.objectContaining({
        message: 'Legacy media requires configured Firebase Storage',
      }),
    });

    const exported = await new BackupExportService(
      { createSnapshot: async () => ({ ...snapshot, knowledgeItems: [legacyItem] }) },
      { readImage: async () => ({ bytes: new Uint8Array([1, 2, 3]), mimeType: 'image/png' }) },
    ).exportBackup();
    const targetRepos = createInMemoryRepositories();
    const unavailableRestore = createFirebaseBackupWorkflow(
      targetRepos,
      {} as Firestore,
      null,
      'owner',
    );

    const inspection = await unavailableRestore.inspectBackup(exported.bytes);
    expect(inspection.summary.mediaFiles).toBe(1);
    expect(await targetRepos.knowledge.get(ITEM_ID)).toBeNull();

    const result = await unavailableRestore.executeRestore(inspection);
    expect(result).toMatchObject({
      status: 'incomplete',
      category: 'storage_failure',
      error: expect.objectContaining({
        message: 'Legacy media requires configured Firebase Storage',
      }),
    });
    expect(await targetRepos.knowledge.get(ITEM_ID)).toBeNull();
  });
});
