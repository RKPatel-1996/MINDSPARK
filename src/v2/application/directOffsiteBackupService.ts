import type {
  BackupRecoveryPoint,
  BackupRecoveryPointService,
} from './backupRecoveryPointService';
import {
  selectBackupAssetsForDeletion,
} from './offsiteBackupRetention';

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
  createdAt?: string;
}

export interface OffsiteBackupTarget {
  uploadBackup(input: OffsiteBackupUpload): Promise<OffsiteBackupAsset>;
  listBackupAssets(): Promise<OffsiteBackupAsset[]>;
  deleteBackupAsset(assetId: number): Promise<void>;
}

export interface DirectOffsiteBackupResult {
  recoveryPoint: BackupRecoveryPoint;
  asset: OffsiteBackupAsset;
  deletedAssetIds: number[];
}

export type DirectOffsiteBackupErrorCode =
  | 'invalid_exported_at'
  | 'retention_failed';

export class DirectOffsiteBackupError extends Error {
  constructor(
    readonly code: DirectOffsiteBackupErrorCode,
    message: string,
    readonly uploadedAsset?: OffsiteBackupAsset,
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
 * Retention runs only after upload succeeds. If retention cannot complete,
 * the successful uploaded recovery point is preserved and reported on the
 * thrown error so callers can distinguish backup success from cleanup failure.
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

    const deletedAssetIds: number[] = [];

    try {
      const assets = await this.target.listBackupAssets();
      const deletions = selectBackupAssetsForDeletion(
        assets,
        asset.id,
      );

      for (const deletion of deletions) {
        await this.target.deleteBackupAsset(deletion.id);
        deletedAssetIds.push(deletion.id);
      }
    } catch {
      throw new DirectOffsiteBackupError(
        'retention_failed',
        'Recovery point was uploaded successfully, but old backup cleanup failed.',
        asset,
      );
    }

    return {
      recoveryPoint,
      asset,
      deletedAssetIds,
    };
  }
}
