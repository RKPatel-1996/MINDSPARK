export interface GitHubBackupConnectionConfig {
  owner: string;
  repository: string;
  releaseTag: string;
}

export const DEFAULT_GITHUB_BACKUP_CONNECTION_CONFIG:
  GitHubBackupConnectionConfig = {
    owner: 'RKPatel-1996',
    repository: 'MINDSPARK_android_sync',
    releaseTag: 'mindspark-recovery-points',
  };

export type GitHubBackupConfigErrorCode =
  | 'invalid_connection_config'
  | 'invalid_token';

export class GitHubBackupConfigError extends Error {
  constructor(
    readonly code: GitHubBackupConfigErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'GitHubBackupConfigError';
  }
}

const CONNECTION_STORAGE_KEY =
  'mindspark_github_backup_connection_v2';

const LEGACY_CONNECTION_STORAGE_KEY =
  'mindspark_github_backup_connection_v1';

/**
 * Deliberately process/app scoped only.
 *
 * The PAT is never written to localStorage, sessionStorage,
 * IndexedDB, Firestore, URLs, or backup archives.
 * Reloading the application clears this value naturally.
 */
let githubBackupMemoryToken: string | null = null;

function validateConnectionConfig(
  value: GitHubBackupConnectionConfig,
): GitHubBackupConnectionConfig {
  const owner = value.owner.trim();
  const repository = value.repository.trim();
  const releaseTag = value.releaseTag.trim();

  if (!owner || !repository || !releaseTag) {
    throw new GitHubBackupConfigError(
      'invalid_connection_config',
      'GitHub backup connection configuration is invalid.',
    );
  }

  return {
    owner,
    repository,
    releaseTag,
  };
}

export function saveGitHubBackupConnectionConfig(
  config: GitHubBackupConnectionConfig,
): GitHubBackupConnectionConfig {
  const normalized =
    validateConnectionConfig(config);

  localStorage.setItem(
    CONNECTION_STORAGE_KEY,
    JSON.stringify(normalized),
  );

  localStorage.removeItem(
    LEGACY_CONNECTION_STORAGE_KEY,
  );

  return normalized;
}

export function loadGitHubBackupConnectionConfig():
  GitHubBackupConnectionConfig | null {
  const raw =
    localStorage.getItem(
      CONNECTION_STORAGE_KEY,
    );

  if (raw === null) {
    return null;
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }

  if (
    typeof parsed !== 'object' ||
    parsed === null
  ) {
    return null;
  }

  const candidate =
    parsed as Partial<GitHubBackupConnectionConfig>;

  try {
    return validateConnectionConfig({
      owner:
        typeof candidate.owner === 'string'
          ? candidate.owner
          : '',
      repository:
        typeof candidate.repository === 'string'
          ? candidate.repository
          : '',
      releaseTag:
        typeof candidate.releaseTag === 'string'
          ? candidate.releaseTag
          : '',
    });
  } catch {
    return null;
  }
}

export function clearGitHubBackupConnectionConfig():
  void {
  localStorage.removeItem(
    CONNECTION_STORAGE_KEY,
  );

  localStorage.removeItem(
    LEGACY_CONNECTION_STORAGE_KEY,
  );
}

export function saveGitHubBackupMemoryToken(
  token: string,
): void {
  const normalized = token.trim();

  if (!normalized) {
    throw new GitHubBackupConfigError(
      'invalid_token',
      'GitHub backup token is empty.',
    );
  }

  githubBackupMemoryToken = normalized;
}

export function loadGitHubBackupMemoryToken():
  string | null {
  return githubBackupMemoryToken;
}

export function clearGitHubBackupMemoryToken():
  void {
  githubBackupMemoryToken = null;
}
