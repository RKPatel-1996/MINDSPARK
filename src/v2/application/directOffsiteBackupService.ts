import type {
  BackupRecoveryPoint,
  BackupRecoveryPointService,
} from './backupRecoveryPointService';

export interface OffsiteBackupUpload {
  fileName: string;
  mimeType: string;
  bytes: Uint8Array;
  archiveSha256: string;
}

export interface OffsiteBackupAsset {
  id: number;
  name: string;
  size: number;
  digest: string | null;
}

export interface OffsiteBackupTarget {
  uploadBackup(input: OffsiteBackupUpload): Promise<OffsiteBackupAsset>;
}

export interface DirectOffsiteBackupResult {
  recoveryPoint: BackupRecoveryPoint;
  asset: OffsiteBackupAsset;
}

export type DirectOffsiteBackupErrorCode = 'invalid_exported_at';

export class DirectOffsiteBackupError extends Error {
  constructor(
    readonly code: DirectOffsiteBackupErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'DirectOffsiteBackupError';
  }
}

export function createOffsiteBackupFileName(exportedAt: string): string {
  const parsed = new Date(exportedAt);

  if (Number.isNaN(parsed.getTime())) {
    throw new DirectOffsiteBackupError(
      'invalid_exported_at',
      'Recovery point has an invalid export timestamp.',
    );
  }

  const timestamp = parsed
    .toISOString()
    .replace(/[:.]/g, '-');

  return `mindspark-${timestamp}.mindspark-backup`;
}

/**
 * Creates one validated local recovery point and sends those exact bytes
 * to the configured off-site target.
 *
 * This service has no restore capability and no repository mutation capability.
 */
export class DirectOffsiteBackupService {
  constructor(
    private readonly recoveryPoints: Pick<
      BackupRecoveryPointService,
      'createRecoveryPoint'
    >,
    private readonly target: OffsiteBackupTarget,
  ) {}

  async createOffsiteRecoveryPoint(): Promise<DirectOffsiteBackupResult> {
    const recoveryPoint = await this.recoveryPoints.createRecoveryPoint();
    const fileName = createOffsiteBackupFileName(
      recoveryPoint.backup.exportedAt,
    );

    const asset = await this.target.uploadBackup({
      fileName,
      mimeType: recoveryPoint.mimeType,
      bytes: recoveryPoint.bytes,
      archiveSha256: recoveryPoint.archiveSha256,
    });

    return {
      recoveryPoint,
      asset,
    };
  }
}
