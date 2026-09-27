import { describe, expect, it } from 'vitest';
import { bootstrapUserRepositories } from '../../../application/bootstrapService';
import { createInMemoryRepositories } from '../../memory/inMemoryRepositories';
import { createFirebaseBackupRecoveryPointService } from '../backupWorkflowFactory';

describe('createFirebaseBackupRecoveryPointService', () => {
  it('creates a text-only recovery point without requiring Firebase Storage', async () => {
    const repos = createInMemoryRepositories();
    await bootstrapUserRepositories(repos);

    const service = createFirebaseBackupRecoveryPointService(
      repos,
      null,
      'owner',
    );

    const result = await service.createRecoveryPoint();

    expect(result.fileName).toBe('mindspark-v1.mindspark-backup');
    expect(result.mimeType).toBe('application/zip');
    expect(result.backup.backupVersion).toBe(1);
    expect(result.backup.media).toEqual([]);
    expect(result.archiveSha256).toMatch(/^[a-f0-9]{64}$/);
    expect(result.bytes.byteLength).toBeGreaterThan(0);
  });
});
