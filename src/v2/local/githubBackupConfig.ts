export interface GitHubBackupConnectionConfig {
  owner: string;
  repository: string;
}

export const DEFAULT_GITHUB_BACKUP_CONNECTION_CONFIG:
  GitHubBackupConnectionConfig = {
    owner: 'RKPatel-1996',
    repository: 'MINDSPARK_BACKUPS',
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
  'mindspark_github_backup_connection_v3';

const LEGACY_CONNECTION_STORAGE_KEY_V2 =
  'mindspark_github_backup_connection_v2';

const LEGACY_CONNECTION_STORAGE_KEY_V1 =
  'mindspark_github_backup_connection_v1';

/**
 * Deliberately process/app scoped only.
 *
 * The raw PAT is never written to localStorage, sessionStorage,
 * Firestore, URLs, or backup archives.
 *
 * Encrypted device persistence is owned by
 * githubBackupCredentialStore.ts; this variable remains the
 * plaintext runtime cache.
 */
let githubBackupMemoryToken: string | null = null;

function validateConnectionConfig(
  value: GitHubBackupConnectionConfig,
): GitHubBackupConnectionConfig {
  const owner = value.owner.trim();
  const repository = value.repository.trim();

  if (!owner || !repository) {
    throw new GitHubBackupConfigError(
      'invalid_connection_config',
      'GitHub backup connection configuration is invalid.',
    );
  }

  return {
    owner,
    repository,
  };
}

function parseConnectionConfig(
  raw: string,
): GitHubBackupConnectionConfig | null {
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
    });
  } catch {
    return null;
  }
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
    LEGACY_CONNECTION_STORAGE_KEY_V2,
  );

  localStorage.removeItem(
    LEGACY_CONNECTION_STORAGE_KEY_V1,
  );

  return normalized;
}

export function loadGitHubBackupConnectionConfig():
  GitHubBackupConnectionConfig | null {
  const current =
    localStorage.getItem(
      CONNECTION_STORAGE_KEY,
    );

  if (current !== null) {
    return parseConnectionConfig(current);
  }

  const legacyV2 =
    localStorage.getItem(
      LEGACY_CONNECTION_STORAGE_KEY_V2,
    );

  if (legacyV2 !== null) {
    const migrated =
      parseConnectionConfig(legacyV2);

    if (migrated) {
      saveGitHubBackupConnectionConfig(
        migrated,
      );
    }

    return migrated;
  }

  return null;
}

export function clearGitHubBackupConnectionConfig():
  void {
  localStorage.removeItem(
    CONNECTION_STORAGE_KEY,
  );

  localStorage.removeItem(
    LEGACY_CONNECTION_STORAGE_KEY_V2,
  );

  localStorage.removeItem(
    LEGACY_CONNECTION_STORAGE_KEY_V1,
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
