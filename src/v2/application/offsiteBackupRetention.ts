export const DEFAULT_OFFSITE_BACKUP_RETENTION_COUNT = 30;

export interface RetentionBackupAsset {
  id: number;
  name: string;
  createdAt?: string;
}

export type OffsiteBackupRetentionErrorCode =
  | 'invalid_keep_count'
  | 'protected_asset_missing'
  | 'invalid_asset_timestamp'
  | 'protected_asset_not_newest';

export class OffsiteBackupRetentionError extends Error {
  constructor(
    readonly code: OffsiteBackupRetentionErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'OffsiteBackupRetentionError';
  }
}

interface TimestampedAsset {
  asset: RetentionBackupAsset;
  createdAtMs: number;
}

/**
 * Selects only the old backup assets that are safe to delete.
 *
 * Safety rules:
 * - the just-uploaded asset must be visible in the listing;
 * - every candidate must have a valid GitHub creation timestamp;
 * - the just-uploaded asset must fall inside the newest keep window;
 * - ties are resolved deterministically by asset ID.
 *
 * Any ambiguity fails closed before deletion can occur.
 */
export function selectBackupAssetsForDeletion(
  assets: readonly RetentionBackupAsset[],
  protectedAssetId: number,
  keepCount = DEFAULT_OFFSITE_BACKUP_RETENTION_COUNT,
): RetentionBackupAsset[] {
  if (!Number.isSafeInteger(keepCount) || keepCount < 1) {
    throw new OffsiteBackupRetentionError(
      'invalid_keep_count',
      'Off-site backup retention count must be a positive integer.',
    );
  }

  if (!assets.some((asset) => asset.id === protectedAssetId)) {
    throw new OffsiteBackupRetentionError(
      'protected_asset_missing',
      'The newly uploaded recovery point is missing from the retention listing.',
    );
  }

  const timestamped: TimestampedAsset[] = assets.map((asset) => {
    if (typeof asset.createdAt !== 'string') {
      throw new OffsiteBackupRetentionError(
        'invalid_asset_timestamp',
        `Backup asset ${asset.id} has no creation timestamp.`,
      );
    }

    const createdAtMs = Date.parse(asset.createdAt);

    if (!Number.isFinite(createdAtMs)) {
      throw new OffsiteBackupRetentionError(
        'invalid_asset_timestamp',
        `Backup asset ${asset.id} has an invalid creation timestamp.`,
      );
    }

    return {
      asset,
      createdAtMs,
    };
  });

  const newestFirst = [...timestamped].sort((left, right) => {
    if (right.createdAtMs !== left.createdAtMs) {
      return right.createdAtMs - left.createdAtMs;
    }

    return right.asset.id - left.asset.id;
  });

  if (newestFirst.length <= keepCount) {
    return [];
  }

  const kept = newestFirst.slice(0, keepCount);

  if (!kept.some(({ asset }) => asset.id === protectedAssetId)) {
    throw new OffsiteBackupRetentionError(
      'protected_asset_not_newest',
      'The newly uploaded recovery point is outside the newest retention window.',
    );
  }

  return newestFirst
    .slice(keepCount)
    .reverse()
    .map(({ asset }) => asset);
}
