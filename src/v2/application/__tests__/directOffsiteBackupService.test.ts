import { describe, expect, it, vi } from 'vitest';
import type { BackupRecoveryPoint } from '../backupRecoveryPointService';
import {
  DirectOffsiteBackupError,
  DirectOffsiteBackupService,
  createOffsiteBackupFileName,
  type OffsiteBackupTarget,
} from '../directOffsiteBackupService';

const EXPORTED_AT = '2026-09-27T08:00:00.000Z';
const SHA256 = 'a'.repeat(64);

function recoveryPoint(): BackupRecoveryPoint {
  return {
    fileName: 'mindspark-v1.mindspark-backup',
    mimeType: 'application/zip',
    bytes: new Uint8Array([1, 2, 3, 4]),
    archiveSha256: SHA256,
    backup: {
      exportedAt: EXPORTED_AT,
    },
  } as BackupRecoveryPoint;
}

describe('DirectOffsiteBackupService', () => {
  it('uploads the exact recovery-point bytes with a timestamped asset name', async () => {
    const point = recoveryPoint();

    const createRecoveryPoint = vi.fn(async () => point);
    const uploadBackup = vi.fn(async () => ({
      id: 42,
      name: 'mindspark-2026-09-27T08-00-00-000Z.mindspark-backup',
      size: point.bytes.byteLength,
      digest: `sha256:${SHA256}`,
    }));

    const target: OffsiteBackupTarget = {
      uploadBackup,
    };

    const service = new DirectOffsiteBackupService(
      { createRecoveryPoint },
      target,
    );

    const result = await service.createOffsiteRecoveryPoint();

    expect(createRecoveryPoint).toHaveBeenCalledTimes(1);
    expect(uploadBackup).toHaveBeenCalledTimes(1);

    expect(uploadBackup).toHaveBeenCalledWith({
      fileName: 'mindspark-2026-09-27T08-00-00-000Z.mindspark-backup',
      mimeType: 'application/zip',
      bytes: point.bytes,
      archiveSha256: SHA256,
    });

    expect(result.recoveryPoint).toBe(point);
    expect(result.asset).toMatchObject({
      id: 42,
      size: 4,
      digest: `sha256:${SHA256}`,
    });
  });

  it('canonicalizes an offset timestamp into a safe UTC asset name', () => {
    expect(
      createOffsiteBackupFileName('2026-09-27T13:30:00.000+05:30'),
    ).toBe(
      'mindspark-2026-09-27T08-00-00-000Z.mindspark-backup',
    );
  });

  it('fails before upload when the recovery-point timestamp is invalid', async () => {
    const point = recoveryPoint();

    point.backup.exportedAt = 'not-a-date';

    const createRecoveryPoint = vi.fn(async () => point);
    const uploadBackup = vi.fn();

    const service = new DirectOffsiteBackupService(
      { createRecoveryPoint },
      { uploadBackup },
    );

    let caught: unknown;

    try {
      await service.createOffsiteRecoveryPoint();
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(DirectOffsiteBackupError);
    expect(caught).toMatchObject({
      code: 'invalid_exported_at',
    });
    expect(uploadBackup).not.toHaveBeenCalled();
  });

  it('does not attempt upload when local recovery-point creation fails', async () => {
    const failure = new Error('local backup failed');

    const createRecoveryPoint = vi.fn(async (): Promise<BackupRecoveryPoint> => {
      throw failure;
    });
    const uploadBackup = vi.fn();

    const service = new DirectOffsiteBackupService(
      { createRecoveryPoint },
      { uploadBackup },
    );

    await expect(
      service.createOffsiteRecoveryPoint(),
    ).rejects.toBe(failure);

    expect(uploadBackup).not.toHaveBeenCalled();
  });
});
