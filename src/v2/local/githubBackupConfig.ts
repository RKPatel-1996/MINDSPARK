export interface GitHubBackupConnectionConfig {
  owner: string;
  repository: string;
  releaseId: number;
}

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

const CONNECTION_STORAGE_KEY = 'mindspark_github_backup_connection_v1';
const TOKEN_SESSION_KEY = 'mindspark_github_backup_pat_v1';

function validateConnectionConfig(
  value: GitHubBackupConnectionConfig,
): GitHubBackupConnectionConfig {
  const owner = value.owner.trim();
  const repository = value.repository.trim();

  if (
    !owner ||
    !repository ||
    !Number.isSafeInteger(value.releaseId) ||
    value.releaseId <= 0
  ) {
    throw new GitHubBackupConfigError(
      'invalid_connection_config',
      'GitHub backup connection configuration is invalid.',
    );
  }

  return {
    owner,
    repository,
    releaseId: value.releaseId,
  };
}

export function saveGitHubBackupConnectionConfig(
  config: GitHubBackupConnectionConfig,
): GitHubBackupConnectionConfig {
  const normalized = validateConnectionConfig(config);

  localStorage.setItem(
    CONNECTION_STORAGE_KEY,
    JSON.stringify(normalized),
  );

  return normalized;
}

export function loadGitHubBackupConnectionConfig():
  GitHubBackupConnectionConfig | null {
  const raw = localStorage.getItem(CONNECTION_STORAGE_KEY);

  if (raw === null) {
    return null;
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }

  if (typeof parsed !== 'object' || parsed === null) {
    return null;
  }

  const candidate = parsed as Partial<GitHubBackupConnectionConfig>;

  try {
    return validateConnectionConfig({
      owner: typeof candidate.owner === 'string' ? candidate.owner : '',
      repository:
        typeof candidate.repository === 'string'
          ? candidate.repository
          : '',
      releaseId:
        typeof candidate.releaseId === 'number'
          ? candidate.releaseId
          : Number.NaN,
    });
  } catch {
    return null;
  }
}

export function clearGitHubBackupConnectionConfig(): void {
  localStorage.removeItem(CONNECTION_STORAGE_KEY);
}

export function saveGitHubBackupSessionToken(token: string): void {
  const normalized = token.trim();

  if (!normalized) {
    throw new GitHubBackupConfigError(
      'invalid_token',
      'GitHub backup token is empty.',
    );
  }

  sessionStorage.setItem(TOKEN_SESSION_KEY, normalized);
}

export function loadGitHubBackupSessionToken(): string | null {
  const value = sessionStorage.getItem(TOKEN_SESSION_KEY);

  return value && value.trim()
    ? value
    : null;
}

export function clearGitHubBackupSessionToken(): void {
  sessionStorage.removeItem(TOKEN_SESSION_KEY);
}
