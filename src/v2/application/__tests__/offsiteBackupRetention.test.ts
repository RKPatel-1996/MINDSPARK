import { describe, expect, it } from 'vitest';
import {
  OffsiteBackupRetentionError,
  selectBackupAssetsForDeletion,
  type RetentionBackupAsset,
} from '../offsiteBackupRetention';

function asset(
  id: number,
  createdAt: string,
): RetentionBackupAsset {
  return {
    id,
    name: `backup-${id}.mindspark-backup`,
    createdAt,
  };
}

function assets(count: number): RetentionBackupAsset[] {
  return Array.from({ length: count }, (_, index) => {
    const id = index + 1;
    return asset(
      id,
      new Date(Date.UTC(2026, 0, id)).toISOString(),
    );
  });
}

describe('selectBackupAssetsForDeletion', () => {
  it('keeps all assets when the count is within the retention limit', () => {
    const values = assets(30);

    expect(
      selectBackupAssetsForDeletion(values, 30),
    ).toEqual([]);
  });

  it('selects only the oldest asset when the 31st backup succeeds', () => {
    const values = assets(31);

    expect(
      selectBackupAssetsForDeletion(values, 31),
    ).toEqual([
      expect.objectContaining({ id: 1 }),
    ]);
  });

  it('is deterministic regardless of listing order', () => {
    const values = assets(32).reverse();

    expect(
      selectBackupAssetsForDeletion(values, 32),
    ).toEqual([
      expect.objectContaining({ id: 1 }),
      expect.objectContaining({ id: 2 }),
    ]);
  });

  it('fails closed when the newly uploaded asset is absent from the listing', () => {
    expect(() =>
      selectBackupAssetsForDeletion(assets(31), 999),
    ).toThrowError(
      expect.objectContaining({
        code: 'protected_asset_missing',
      }) as OffsiteBackupRetentionError,
    );
  });

  it('fails closed when any backup asset has no valid creation timestamp', () => {
    const values = assets(31);
    values[0] = {
      ...values[0],
      createdAt: 'not-a-date',
    };

    expect(() =>
      selectBackupAssetsForDeletion(values, 31),
    ).toThrowError(
      expect.objectContaining({
        code: 'invalid_asset_timestamp',
      }) as OffsiteBackupRetentionError,
    );
  });

  it('fails closed instead of deleting the protected asset when ordering is suspicious', () => {
    const values = assets(31);

    values[30] = {
      ...values[30],
      createdAt: '2025-01-01T00:00:00.000Z',
    };

    expect(() =>
      selectBackupAssetsForDeletion(values, 31),
    ).toThrowError(
      expect.objectContaining({
        code: 'protected_asset_not_newest',
      }) as OffsiteBackupRetentionError,
    );
  });
});
