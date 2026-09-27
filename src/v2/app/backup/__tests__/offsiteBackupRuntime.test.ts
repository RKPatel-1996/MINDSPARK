import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import {
  DirectOffsiteBackupError,
  type DirectOffsiteBackupResult,
} from '../../../application/directOffsiteBackupService';
import {
  DEFAULT_GITHUB_BACKUP_CONNECTION_CONFIG,
} from '../../../local/githubBackupConfig';
import {
  loadLastSuccessfulOffsiteBackupAt,
} from '../../../local/offsiteBackupStatus';
import {
  runTrackedOffsiteBackup,
  type OffsiteBackupRunner,
} from '../offsiteBackupRuntime';

function result(): DirectOffsiteBackupResult {
  return {
    recoveryPoint:
      {} as DirectOffsiteBackupResult['recoveryPoint'],
    asset: {
      id: 10,
      name: 'backup.mindspark-backup',
      size: 100,
      digest: null,
      createdAt:
        '2026-09-27T10:00:00.000Z',
    },
    deletedAssetIds: [],
  };
}

describe('tracked off-site backup runtime', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('records a successful upload', async () => {
    const runner =
      vi.fn<OffsiteBackupRunner>(
        async () => result(),
      );

    await runTrackedOffsiteBackup(
      runner,
      DEFAULT_GITHUB_BACKUP_CONNECTION_CONFIG,
      'github_pat_test_secret',
      () => '2026-09-27T11:00:00.000Z',
    );

    expect(
      loadLastSuccessfulOffsiteBackupAt(),
    ).toBe('2026-09-27T11:00:00.000Z');
  });

  it('records upload success before propagating a retention warning', async () => {
    const uploadedAsset = result().asset;

    const runner =
      vi.fn<OffsiteBackupRunner>(
        async () => {
          throw new DirectOffsiteBackupError(
            'retention_failed',
            'cleanup failed',
            uploadedAsset,
          );
        },
      );

    await expect(
      runTrackedOffsiteBackup(
        runner,
        DEFAULT_GITHUB_BACKUP_CONNECTION_CONFIG,
        'github_pat_test_secret',
        () =>
          '2026-09-27T11:30:00.000Z',
      ),
    ).rejects.toMatchObject({
      code: 'retention_failed',
    });

    expect(
      loadLastSuccessfulOffsiteBackupAt(),
    ).toBe('2026-09-27T11:30:00.000Z');
  });

  it('does not record an ordinary failed backup', async () => {
    const runner =
      vi.fn<OffsiteBackupRunner>(
        async () => {
          throw new Error('upload failed');
        },
      );

    await expect(
      runTrackedOffsiteBackup(
        runner,
        DEFAULT_GITHUB_BACKUP_CONNECTION_CONFIG,
        'github_pat_test_secret',
        () =>
          '2026-09-27T12:00:00.000Z',
      ),
    ).rejects.toThrow('upload failed');

    expect(
      loadLastSuccessfulOffsiteBackupAt(),
    ).toBeNull();
  });
});
