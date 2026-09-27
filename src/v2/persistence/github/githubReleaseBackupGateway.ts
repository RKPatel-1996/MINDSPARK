export interface GitHubReleaseBackupGatewayConfig {
  owner: string;
  repository: string;
  releaseId: number;
  token: string;
  fetchImpl?: typeof fetch;
}

export interface GitHubBackupAsset {
  id: number;
  name: string;
  size: number;
  digest: string | null;
  createdAt?: string;
  updatedAt?: string;
  downloadUrl?: string;
}

export interface UploadGitHubBackupInput {
  fileName: string;
  mimeType: string;
  bytes: Uint8Array;
  archiveSha256: string;
}

export type GitHubReleaseBackupErrorCode =
  | 'invalid_configuration'
  | 'request_failed'
  | 'invalid_response'
  | 'digest_mismatch';

export class GitHubReleaseBackupError extends Error {
  constructor(
    readonly code: GitHubReleaseBackupErrorCode,
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = 'GitHubReleaseBackupError';
  }
}

interface GitHubReleaseAssetDto {
  id?: unknown;
  name?: unknown;
  size?: unknown;
  digest?: unknown;
  created_at?: unknown;
  updated_at?: unknown;
  browser_download_url?: unknown;
}

const API_VERSION = '2022-11-28';
const BACKUP_SUFFIX = '.mindspark-backup';
const SHA256_PATTERN = /^[a-f0-9]{64}$/i;

function normalizeAsset(value: unknown): GitHubBackupAsset {
  if (typeof value !== 'object' || value === null) {
    throw new GitHubReleaseBackupError(
      'invalid_response',
      'GitHub returned an invalid Release asset.',
    );
  }

  const dto = value as GitHubReleaseAssetDto;

  if (
    !Number.isSafeInteger(dto.id) ||
    (dto.id as number) <= 0 ||
    typeof dto.name !== 'string' ||
    typeof dto.size !== 'number' ||
    !Number.isFinite(dto.size) ||
    dto.size < 0
  ) {
    throw new GitHubReleaseBackupError(
      'invalid_response',
      'GitHub returned an invalid Release asset.',
    );
  }

  if (dto.digest !== undefined && dto.digest !== null) {
    if (
      typeof dto.digest !== 'string' ||
      !/^sha256:[a-f0-9]{64}$/i.test(dto.digest)
    ) {
      throw new GitHubReleaseBackupError(
        'invalid_response',
        'GitHub returned an invalid Release asset digest.',
      );
    }
  }

  return {
    id: dto.id as number,
    name: dto.name,
    size: dto.size,
    digest: typeof dto.digest === 'string' ? dto.digest : null,
    ...(typeof dto.created_at === 'string' ? { createdAt: dto.created_at } : {}),
    ...(typeof dto.updated_at === 'string' ? { updatedAt: dto.updated_at } : {}),
    ...(typeof dto.browser_download_url === 'string'
      ? { downloadUrl: dto.browser_download_url }
      : {}),
  };
}

export class GitHubReleaseBackupGateway {
  private readonly fetchImpl: typeof fetch;

  constructor(private readonly config: GitHubReleaseBackupGatewayConfig) {
    if (
      !config.owner.trim() ||
      !config.repository.trim() ||
      !Number.isSafeInteger(config.releaseId) ||
      config.releaseId <= 0 ||
      !config.token.trim()
    ) {
      throw new GitHubReleaseBackupError(
        'invalid_configuration',
        'GitHub backup configuration is incomplete.',
      );
    }

    this.fetchImpl = config.fetchImpl ?? globalThis.fetch;

    if (typeof this.fetchImpl !== 'function') {
      throw new GitHubReleaseBackupError(
        'invalid_configuration',
        'Fetch is unavailable for GitHub backup requests.',
      );
    }
  }

  async uploadBackup(input: UploadGitHubBackupInput): Promise<GitHubBackupAsset> {
    if (
      !input.fileName.endsWith(BACKUP_SUFFIX) ||
      input.bytes.byteLength === 0 ||
      !SHA256_PATTERN.test(input.archiveSha256)
    ) {
      throw new GitHubReleaseBackupError(
        'invalid_configuration',
        'Backup upload input is invalid.',
      );
    }

    const url =
      `https://uploads.github.com/repos/${encodeURIComponent(this.config.owner)}` +
      `/${encodeURIComponent(this.config.repository)}` +
      `/releases/${this.config.releaseId}/assets` +
      `?name=${encodeURIComponent(input.fileName)}`;

    const response = await this.fetchImpl(url, {
      method: 'POST',
      headers: this.headers({
        'Content-Type': input.mimeType,
      }),
      body: input.bytes as BodyInit,
    });

    if (!response.ok) {
      throw new GitHubReleaseBackupError(
        'request_failed',
        `GitHub backup upload failed with HTTP ${response.status}.`,
        response.status,
      );
    }

    const asset = normalizeAsset(await response.json());

    if (asset.name !== input.fileName || asset.size !== input.bytes.byteLength) {
      throw new GitHubReleaseBackupError(
        'invalid_response',
        'GitHub uploaded asset metadata does not match the local backup.',
      );
    }

    if (asset.digest !== null) {
      const remoteSha256 = asset.digest.slice('sha256:'.length);
      if (remoteSha256.toLowerCase() !== input.archiveSha256.toLowerCase()) {
        throw new GitHubReleaseBackupError(
          'digest_mismatch',
          'GitHub uploaded asset SHA-256 does not match the local backup.',
        );
      }
    }

    return asset;
  }

  async listBackupAssets(): Promise<GitHubBackupAsset[]> {
    const result: GitHubBackupAsset[] = [];

    for (let page = 1; ; page += 1) {
      const url =
        `https://api.github.com/repos/${encodeURIComponent(this.config.owner)}` +
        `/${encodeURIComponent(this.config.repository)}` +
        `/releases/${this.config.releaseId}/assets?per_page=100&page=${page}`;

      const response = await this.fetchImpl(url, {
        method: 'GET',
        headers: this.headers(),
      });

      if (!response.ok) {
        throw new GitHubReleaseBackupError(
          'request_failed',
          `GitHub backup asset listing failed with HTTP ${response.status}.`,
          response.status,
        );
      }

      const body = await response.json();
      if (!Array.isArray(body)) {
        throw new GitHubReleaseBackupError(
          'invalid_response',
          'GitHub returned an invalid Release asset list.',
        );
      }

      const pageAssets = body.map(normalizeAsset);
      result.push(
        ...pageAssets.filter((asset) => asset.name.endsWith(BACKUP_SUFFIX)),
      );

      if (pageAssets.length < 100) {
        break;
      }
    }

    return result;
  }

  async deleteBackupAsset(assetId: number): Promise<void> {
    if (!Number.isSafeInteger(assetId) || assetId <= 0) {
      throw new GitHubReleaseBackupError(
        'invalid_configuration',
        'GitHub Release asset ID is invalid.',
      );
    }

    const url =
      `https://api.github.com/repos/${encodeURIComponent(this.config.owner)}` +
      `/${encodeURIComponent(this.config.repository)}` +
      `/releases/assets/${assetId}`;

    const response = await this.fetchImpl(url, {
      method: 'DELETE',
      headers: this.headers(),
    });

    if (!response.ok) {
      throw new GitHubReleaseBackupError(
        'request_failed',
        `GitHub backup asset deletion failed with HTTP ${response.status}.`,
        response.status,
      );
    }
  }

  private headers(additional: Record<string, string> = {}): Record<string, string> {
    return {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${this.config.token}`,
      'X-GitHub-Api-Version': API_VERSION,
      ...additional,
    };
  }
}
