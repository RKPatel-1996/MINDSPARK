export const OFFSITE_BACKUP_DUE_AFTER_MS =
  24 * 60 * 60 * 1000;

export const OFFSITE_BACKUP_STATUS_EVENT =
  'mindspark:offsite-backup-status';

const LAST_SUCCESS_STORAGE_KEY =
  'mindspark_github_backup_last_success_v1';

function notifyStatusChanged(): void {
  if (
    typeof window !== 'undefined' &&
    typeof window.dispatchEvent === 'function'
  ) {
    window.dispatchEvent(
      new Event(OFFSITE_BACKUP_STATUS_EVENT),
    );
  }
}

export function saveLastSuccessfulOffsiteBackupAt(
  value: string,
): string {
  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    throw new Error(
      'Off-site backup success timestamp is invalid.',
    );
  }

  const normalized = parsed.toISOString();

  localStorage.setItem(
    LAST_SUCCESS_STORAGE_KEY,
    normalized,
  );

  notifyStatusChanged();

  return normalized;
}

export function loadLastSuccessfulOffsiteBackupAt():
  string | null {
  const raw = localStorage.getItem(
    LAST_SUCCESS_STORAGE_KEY,
  );

  if (!raw) {
    return null;
  }

  const parsed = new Date(raw);

  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed.toISOString();
}

export function clearLastSuccessfulOffsiteBackupAt(): void {
  localStorage.removeItem(LAST_SUCCESS_STORAGE_KEY);
  notifyStatusChanged();
}

export function isOffsiteBackupDue(
  lastSuccessfulAt: string | null,
  nowMs: number = Date.now(),
): boolean {
  if (!lastSuccessfulAt) {
    return true;
  }

  const parsed = new Date(lastSuccessfulAt);

  if (Number.isNaN(parsed.getTime())) {
    return true;
  }

  return (
    nowMs - parsed.getTime() >=
    OFFSITE_BACKUP_DUE_AFTER_MS
  );
}
