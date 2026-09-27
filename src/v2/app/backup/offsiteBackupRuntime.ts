import type { Repositories } from '../../application/types';
import {
  DirectOffsiteBackupError,
  DirectOffsiteBackupService,
  type DirectOffsiteBackupResult,
} from '../../application/directOffsiteBackupService';
import type {
  GitHubBackupConnectionConfig,
} from '../../local/githubBackupConfig';
import {
  saveLastSuccessfulOffsiteBackupAt,
} from '../../local/offsiteBackupStatus';
import {
  createFirebaseBackupRecoveryPointService,
} from '../../persistence/firebase/backupWorkflowFactory';
import {
  getFirebaseStorage,
} from '../../persistence/firebase/storageConfig';
import {
  GitHubReleaseBackupGateway,
} from '../../persistence/github/githubReleaseBackupGateway';

export type OffsiteBackupRunner = (
  config: GitHubBackupConnectionConfig,
  token: string,
) => Promise<DirectOffsiteBackupResult>;

export function createGitHubOffsiteBackupRunner(
  repos: Repositories,
  userId: string,
): OffsiteBackupRunner {
  return async (config, token) => {
    const storage = getFirebaseStorage();

    const recoveryPoints =
      createFirebaseBackupRecoveryPointService(
        repos,
        storage,
        userId,
      );

    const target =
      new GitHubReleaseBackupGateway({
        owner: config.owner,
        repository: config.repository,
        releaseTag: config.releaseTag,
        token,
      });

    return new DirectOffsiteBackupService(
      recoveryPoints,
      target,
    ).createOffsiteRecoveryPoint();
  };
}

/**
 * Records the device-local successful-backup timestamp only
 * after GitHub has confirmed the recovery-point upload.
 *
 * A retention_failed error still represents a successfully
 * preserved recovery point, so it is recorded before the
 * warning is propagated to the caller.
 */
export async function runTrackedOffsiteBackup(
  runner: OffsiteBackupRunner,
  config: GitHubBackupConnectionConfig,
  token: string,
  now: () => string = () =>
    new Date().toISOString(),
): Promise<DirectOffsiteBackupResult> {
  try {
    const result = await runner(
      config,
      token,
    );

    saveLastSuccessfulOffsiteBackupAt(
      now(),
    );

    return result;
  } catch (error) {
    if (
      error instanceof DirectOffsiteBackupError &&
      error.code === 'retention_failed' &&
      error.uploadedAsset
    ) {
      saveLastSuccessfulOffsiteBackupAt(
        now(),
      );
    }

    throw error;
  }
}
