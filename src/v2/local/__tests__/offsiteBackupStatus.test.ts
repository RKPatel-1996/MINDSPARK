import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import {
  OFFSITE_BACKUP_DUE_AFTER_MS,
  OFFSITE_BACKUP_STATUS_EVENT,
  clearLastSuccessfulOffsiteBackupAt,
  isOffsiteBackupDue,
  loadLastSuccessfulOffsiteBackupAt,
  saveLastSuccessfulOffsiteBackupAt,
} from '../offsiteBackupStatus';

describe('off-site backup device-local status', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('treats no successful backup as due', () => {
    expect(
      isOffsiteBackupDue(
        null,
        Date.parse('2026-09-27T12:00:00.000Z'),
      ),
    ).toBe(true);
  });

  it('stores and loads a normalized successful-backup timestamp', () => {
    const saved =
      saveLastSuccessfulOffsiteBackupAt(
        '2026-09-27T10:00:00Z',
      );

    expect(saved).toBe(
      '2026-09-27T10:00:00.000Z',
    );

    expect(
      loadLastSuccessfulOffsiteBackupAt(),
    ).toBe('2026-09-27T10:00:00.000Z');
  });

  it('becomes due at 24 hours and not before', () => {
    const last =
      '2026-09-27T10:00:00.000Z';

    const lastMs = Date.parse(last);

    expect(
      isOffsiteBackupDue(
        last,
        lastMs +
          OFFSITE_BACKUP_DUE_AFTER_MS -
          1,
      ),
    ).toBe(false);

    expect(
      isOffsiteBackupDue(
        last,
        lastMs +
          OFFSITE_BACKUP_DUE_AFTER_MS,
      ),
    ).toBe(true);
  });

  it('notifies same-page listeners when status changes', () => {
    const listener = vi.fn();

    window.addEventListener(
      OFFSITE_BACKUP_STATUS_EVENT,
      listener,
    );

    saveLastSuccessfulOffsiteBackupAt(
      '2026-09-27T10:00:00.000Z',
    );

    clearLastSuccessfulOffsiteBackupAt();

    window.removeEventListener(
      OFFSITE_BACKUP_STATUS_EVENT,
      listener,
    );

    expect(listener).toHaveBeenCalledTimes(2);
  });

  it('treats malformed durable status as absent', () => {
    localStorage.setItem(
      'mindspark_github_backup_last_success_v1',
      'not-a-date',
    );

    expect(
      loadLastSuccessfulOffsiteBackupAt(),
    ).toBeNull();
  });
});
