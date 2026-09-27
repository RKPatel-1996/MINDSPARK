import { describe, expect, it, vi } from 'vitest';
import type { BackupRecoveryPoint } from '../backupRecoveryPointService';
import {
  DirectOffsiteBackupError,
  DirectOffsiteBackupService,
  createOffsiteBackupFileName,
  type OffsiteBackupAsset,
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

function uploadedAsset(
  id = 42,
  createdAt = EXPORTED_AT,
): OffsiteBackupAsset {
  return {
    id,
    name: 'mindspark-2026-09-27T08-00-00-000Z.mindspark-backup',
    size: 4,
    digest: `sha256:${SHA256}`,
    createdAt,
  };
}

function backupAssets(count: number): OffsiteBackupAsset[] {
  return Array.from({ length: count }, (_, index) => {
    const id = index + 1;
    return {
      id,
      name: `backup-${id}.mindspark-backup`,
      size: id,
      digest: null,
      createdAt: new Date(Date.UTC(2026, 0, id)).toISOString(),
    };
  });
}

describe('DirectOffsiteBackupService', () => {
  it('uploads exact recovery-point bytes, then applies retention', async () => {
    const point = recoveryPoint();
    const asset = uploadedAsset();

    const createRecoveryPoint = vi.fn(async () => point);
    const uploadBackup = vi.fn(async () => asset);
    const listBackupAssets = vi.fn(async () => [asset]);
    const deleteBackupAsset = vi.fn(async () => undefined);

    const target: OffsiteBackupTarget = {
      uploadBackup,
      listBackupAssets,
      deleteBackupAsset,
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

    expect(listBackupAssets).toHaveBeenCalledTimes(1);
    expect(deleteBackupAsset).not.toHaveBeenCalled();

    expect(result.recoveryPoint).toBe(point);
    expect(result.asset).toBe(asset);
    expect(result.deletedAssetIds).toEqual([]);
  });

  it('deletes only assets older than the newest 30 after upload succeeds', async () => {
    const point = recoveryPoint();
    const values = backupAssets(31);
    const asset = values[30];

    const deleteBackupAsset = vi.fn(async () => undefined);

    const service = new DirectOffsiteBackupService(
      {
        createRecoveryPoint: vi.fn(async () => point),
      },
      {
        uploadBackup: vi.fn(async () => asset),
        listBackupAssets: vi.fn(async () => values),
        deleteBackupAsset,
      },
    );

    const result = await service.createOffsiteRecoveryPoint();

    expect(deleteBackupAsset).toHaveBeenCalledTimes(1);
    expect(deleteBackupAsset).toHaveBeenCalledWith(1);
    expect(deleteBackupAsset).not.toHaveBeenCalledWith(asset.id);
    expect(result.deletedAssetIds).toEqual([1]);
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

    const uploadBackup = vi.fn();
    const listBackupAssets = vi.fn();
    const deleteBackupAsset = vi.fn();

    const service = new DirectOffsiteBackupService(
      {
        createRecoveryPoint: vi.fn(async () => point),
      },
      {
        uploadBackup,
        listBackupAssets,
        deleteBackupAsset,
      },
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
    expect(listBackupAssets).not.toHaveBeenCalled();
    expect(deleteBackupAsset).not.toHaveBeenCalled();
  });

  it('does not run upload or retention when local recovery-point creation fails', async () => {
    const failure = new Error('local backup failed');

    const uploadBackup = vi.fn();
    const listBackupAssets = vi.fn();
    const deleteBackupAsset = vi.fn();

    const service = new DirectOffsiteBackupService(
      {
        createRecoveryPoint: vi.fn(
          async (): Promise<BackupRecoveryPoint> => {
            throw failure;
          },
        ),
      },
      {
        uploadBackup,
        listBackupAssets,
        deleteBackupAsset,
      },
    );

    await expect(
      service.createOffsiteRecoveryPoint(),
    ).rejects.toBe(failure);

    expect(uploadBackup).not.toHaveBeenCalled();
    expect(listBackupAssets).not.toHaveBeenCalled();
    expect(deleteBackupAsset).not.toHaveBeenCalled();
  });

  it('does not run retention when GitHub upload fails', async () => {
    const uploadFailure = new Error('upload failed');

    const listBackupAssets = vi.fn();
    const deleteBackupAsset = vi.fn();

    const service = new DirectOffsiteBackupService(
      {
        createRecoveryPoint: vi.fn(async () => recoveryPoint()),
      },
      {
        uploadBackup: vi.fn(async (): Promise<OffsiteBackupAsset> => {
          throw uploadFailure;
        }),
        listBackupAssets,
        deleteBackupAsset,
      },
    );

    await expect(
      service.createOffsiteRecoveryPoint(),
    ).rejects.toBe(uploadFailure);

    expect(listBackupAssets).not.toHaveBeenCalled();
    expect(deleteBackupAsset).not.toHaveBeenCalled();
  });

  it('reports that the new backup is stored when retention listing fails', async () => {
    const asset = uploadedAsset();

    const service = new DirectOffsiteBackupService(
      {
        createRecoveryPoint: vi.fn(async () => recoveryPoint()),
      },
      {
        uploadBackup: vi.fn(async () => asset),
        listBackupAssets: vi.fn(async (): Promise<OffsiteBackupAsset[]> => {
          throw new Error('listing failed');
        }),
        deleteBackupAsset: vi.fn(),
      },
    );

    let caught: unknown;

    try {
      await service.createOffsiteRecoveryPoint();
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(DirectOffsiteBackupError);
    expect(caught).toMatchObject({
      code: 'retention_failed',
      uploadedAsset: asset,
    });
  });

  it('preserves the new backup when deleting an old asset fails', async () => {
    const values = backupAssets(31);
    const asset = values[30];

    const deleteBackupAsset = vi.fn(async () => {
      throw new Error('delete failed');
    });

    const service = new DirectOffsiteBackupService(
      {
        createRecoveryPoint: vi.fn(async () => recoveryPoint()),
      },
      {
        uploadBackup: vi.fn(async () => asset),
        listBackupAssets: vi.fn(async () => values),
        deleteBackupAsset,
      },
    );

    let caught: unknown;

    try {
      await service.createOffsiteRecoveryPoint();
    } catch (error) {
      caught = error;
    }

    expect(deleteBackupAsset).toHaveBeenCalledWith(1);

    expect(caught).toBeInstanceOf(DirectOffsiteBackupError);
    expect(caught).toMatchObject({
      code: 'retention_failed',
      uploadedAsset: asset,
    });

    expect(deleteBackupAsset).not.toHaveBeenCalledWith(asset.id);
  });
});
