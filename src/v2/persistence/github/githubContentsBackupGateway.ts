import type {
  OffsiteBackupAsset,
  OffsiteBackupTarget,
  OffsiteBackupUpload,
} from '../../application/directOffsiteBackupService';

export interface GitHubContentsBackupGatewayConfig {
  owner: string;
  repository: string;
  token: string;
  directory?: string;
  fetchImpl?: typeof fetch;
}

export type GitHubContentsBackupErrorCode =
  | 'invalid_configuration'
  | 'request_failed'
  | 'invalid_response'
  | 'digest_mismatch';

export class GitHubContentsBackupError extends Error {
  constructor(
    readonly code: GitHubContentsBackupErrorCode,
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = 'GitHubContentsBackupError';
  }
}

interface GitHubContentDto {
  type?: unknown;
  name?: unknown;
  path?: unknown;
  sha?: unknown;
  size?: unknown;
}

interface GitHubCreateResponseDto {
  content?: unknown;
}

interface DeleteReference {
  path: string;
  sha: string;
  name: string;
}

const API_VERSION = '2022-11-28';
const DEFAULT_DIRECTORY = 'recovery-points';
const BACKUP_SUFFIX = '.mindspark-backup';
const SHA256_PATTERN = /^[a-f0-9]{64}$/i;
const GIT_SHA_PATTERN = /^[a-f0-9]{40,64}$/i;

function encodeRepositoryPath(path: string): string {
  return path
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/');
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';

  for (
    let offset = 0;
    offset < bytes.byteLength;
    offset += 0x8000
  ) {
    const chunk = bytes.subarray(
      offset,
      Math.min(offset + 0x8000, bytes.byteLength),
    );

    binary += String.fromCharCode(...chunk);
  }

  return globalThis.btoa(binary);
}

async function sha256Hex(
  bytes: Uint8Array,
): Promise<string> {
  if (!globalThis.crypto?.subtle) {
    throw new GitHubContentsBackupError(
      'invalid_configuration',
      'Web Crypto is unavailable for GitHub backup verification.',
    );
  }

  const copy = new Uint8Array(bytes);

  const digest = await globalThis.crypto.subtle.digest(
    'SHA-256',
    copy.buffer,
  );

  return Array.from(new Uint8Array(digest))
    .map((value) =>
      value.toString(16).padStart(2, '0'),
    )
    .join('');
}

function backupIdentity(name: string): {
  id: number;
  createdAt: string;
} {
  const match =
    /^mindspark-(\d{4}-\d{2}-\d{2})T(\d{2})-(\d{2})-(\d{2})-(\d{3})Z\.mindspark-backup$/
      .exec(name);

  if (!match) {
    throw new GitHubContentsBackupError(
      'invalid_response',
      `GitHub backup file has an invalid name: ${name}`,
    );
  }

  const createdAt =
    `${match[1]}T${match[2]}:${match[3]}:${match[4]}.${match[5]}Z`;

  const id = Date.parse(createdAt);

  if (
    !Number.isSafeInteger(id) ||
    new Date(id).toISOString() !== createdAt
  ) {
    throw new GitHubContentsBackupError(
      'invalid_response',
      `GitHub backup file has an invalid timestamp: ${name}`,
    );
  }

  return {
    id,
    createdAt,
  };
}

function normalizeFile(
  value: unknown,
): {
  type: 'file';
  name: string;
  path: string;
  sha: string;
  size: number;
} {
  if (
    typeof value !== 'object' ||
    value === null
  ) {
    throw new GitHubContentsBackupError(
      'invalid_response',
      'GitHub returned invalid repository content metadata.',
    );
  }

  const dto = value as GitHubContentDto;

  if (
    dto.type !== 'file' ||
    typeof dto.name !== 'string' ||
    typeof dto.path !== 'string' ||
    typeof dto.sha !== 'string' ||
    !GIT_SHA_PATTERN.test(dto.sha) ||
    typeof dto.size !== 'number' ||
    !Number.isSafeInteger(dto.size) ||
    dto.size < 0
  ) {
    throw new GitHubContentsBackupError(
      'invalid_response',
      'GitHub returned invalid repository file metadata.',
    );
  }

  return {
    type: 'file',
    name: dto.name,
    path: dto.path,
    sha: dto.sha,
    size: dto.size,
  };
}

export class GitHubContentsBackupGateway
  implements OffsiteBackupTarget {
  private readonly fetchImpl: typeof fetch;
  private readonly directory: string;

  private readonly deletionReferences =
    new Map<number, DeleteReference>();

  constructor(
    private readonly config:
      GitHubContentsBackupGatewayConfig,
  ) {
    const owner = config.owner.trim();
    const repository = config.repository.trim();
    const token = config.token.trim();

    const directory =
      (config.directory ?? DEFAULT_DIRECTORY)
        .trim()
        .replace(/^\/+|\/+$/g, '');

    if (
      !owner ||
      !repository ||
      !token ||
      !directory
    ) {
      throw new GitHubContentsBackupError(
        'invalid_configuration',
        'GitHub backup configuration is incomplete.',
      );
    }

    this.directory = directory;

    this.fetchImpl =
      config.fetchImpl ??
      ((input, init) =>
        globalThis.fetch(input, init));

    if (typeof this.fetchImpl !== 'function') {
      throw new GitHubContentsBackupError(
        'invalid_configuration',
        'Fetch is unavailable for GitHub backup requests.',
      );
    }
  }

  async uploadBackup(
    input: OffsiteBackupUpload,
  ): Promise<OffsiteBackupAsset> {
    if (
      !input.fileName.endsWith(BACKUP_SUFFIX) ||
      input.bytes.byteLength === 0 ||
      !SHA256_PATTERN.test(input.archiveSha256)
    ) {
      throw new GitHubContentsBackupError(
        'invalid_configuration',
        'Backup upload input is invalid.',
      );
    }

    const identity =
      backupIdentity(input.fileName);

    const path =
      `${this.directory}/${input.fileName}`;

    const response = await this.fetchImpl(
      this.contentUrl(path),
      {
        method: 'PUT',
        headers: this.headers({
          'Content-Type': 'application/json',
        }),
        body: JSON.stringify({
          message:
            `backup: add ${input.fileName}`,
          content:
            bytesToBase64(input.bytes),
        }),
      },
    );

    if (
      !response.ok ||
      response.status !== 201
    ) {
      throw new GitHubContentsBackupError(
        'request_failed',
        `GitHub backup commit failed with HTTP ${response.status}.`,
        response.status,
      );
    }

    const body =
      await response.json() as
        GitHubCreateResponseDto;

    const file =
      normalizeFile(body.content);

    if (
      file.name !== input.fileName ||
      file.path !== path ||
      file.size !== input.bytes.byteLength
    ) {
      throw new GitHubContentsBackupError(
        'invalid_response',
        'GitHub committed backup metadata does not match the local recovery point.',
      );
    }

    await this.verifyCommittedBackup(
      path,
      input.archiveSha256,
      input.bytes.byteLength,
    );

    this.rememberDeletionReference(
      identity.id,
      {
        path: file.path,
        sha: file.sha,
        name: file.name,
      },
    );

    return {
      id: identity.id,
      name: file.name,
      size: file.size,
      digest:
        `sha256:${input.archiveSha256.toLowerCase()}`,
      createdAt: identity.createdAt,
    };
  }

  async listBackupAssets():
    Promise<OffsiteBackupAsset[]> {
    const response = await this.fetchImpl(
      this.contentUrl(this.directory),
      {
        method: 'GET',
        headers: this.headers(),
      },
    );

    if (response.status === 404) {
      return [];
    }

    if (!response.ok) {
      throw new GitHubContentsBackupError(
        'request_failed',
        `GitHub backup listing failed with HTTP ${response.status}.`,
        response.status,
      );
    }

    const body = await response.json();

    if (!Array.isArray(body)) {
      throw new GitHubContentsBackupError(
        'invalid_response',
        'GitHub returned an invalid backup directory listing.',
      );
    }

    const assets: OffsiteBackupAsset[] = [];

    for (const value of body) {
      if (
        typeof value !== 'object' ||
        value === null
      ) {
        continue;
      }

      const candidate =
        value as GitHubContentDto;

      if (
        candidate.type !== 'file' ||
        typeof candidate.name !== 'string' ||
        !candidate.name.endsWith(BACKUP_SUFFIX)
      ) {
        continue;
      }

      const file =
        normalizeFile(candidate);

      const identity =
        backupIdentity(file.name);

      this.rememberDeletionReference(
        identity.id,
        {
          path: file.path,
          sha: file.sha,
          name: file.name,
        },
      );

      assets.push({
        id: identity.id,
        name: file.name,
        size: file.size,
        digest: null,
        createdAt: identity.createdAt,
      });
    }

    return assets;
  }

  async deleteBackupAsset(
    assetId: number,
  ): Promise<void> {
    const reference =
      this.deletionReferences.get(assetId);

    if (!reference) {
      throw new GitHubContentsBackupError(
        'invalid_configuration',
        'GitHub backup deletion reference is unavailable.',
      );
    }

    const response = await this.fetchImpl(
      this.contentUrl(reference.path),
      {
        method: 'DELETE',
        headers: this.headers({
          'Content-Type': 'application/json',
        }),
        body: JSON.stringify({
          message:
            `backup: remove ${reference.name}`,
          sha: reference.sha,
        }),
      },
    );

    if (!response.ok) {
      throw new GitHubContentsBackupError(
        'request_failed',
        `GitHub backup deletion failed with HTTP ${response.status}.`,
        response.status,
      );
    }

    this.deletionReferences.delete(assetId);
  }

  private async verifyCommittedBackup(
    path: string,
    expectedSha256: string,
    expectedSize: number,
  ): Promise<void> {
    const response = await this.fetchImpl(
      this.contentUrl(path),
      {
        method: 'GET',
        headers: this.headers({
          Accept:
            'application/vnd.github.raw+json',
        }),
      },
    );

    if (!response.ok) {
      throw new GitHubContentsBackupError(
        'request_failed',
        `GitHub backup verification failed with HTTP ${response.status}.`,
        response.status,
      );
    }

    const bytes =
      new Uint8Array(
        await response.arrayBuffer(),
      );

    if (bytes.byteLength !== expectedSize) {
      throw new GitHubContentsBackupError(
        'invalid_response',
        'GitHub committed backup size does not match the local recovery point.',
      );
    }

    const remoteSha256 =
      await sha256Hex(bytes);

    if (
      remoteSha256.toLowerCase() !==
      expectedSha256.toLowerCase()
    ) {
      throw new GitHubContentsBackupError(
        'digest_mismatch',
        'GitHub committed backup SHA-256 does not match the local recovery point.',
      );
    }
  }

  private rememberDeletionReference(
    id: number,
    reference: DeleteReference,
  ): void {
    const existing =
      this.deletionReferences.get(id);

    if (
      existing &&
      (
        existing.path !== reference.path ||
        existing.sha !== reference.sha
      )
    ) {
      throw new GitHubContentsBackupError(
        'invalid_response',
        'GitHub returned colliding backup timestamps.',
      );
    }

    this.deletionReferences.set(
      id,
      reference,
    );
  }

  private contentUrl(path: string): string {
    return (
      `https://api.github.com/repos/${encodeURIComponent(this.config.owner.trim())}` +
      `/${encodeURIComponent(this.config.repository.trim())}` +
      `/contents/${encodeRepositoryPath(path)}`
    );
  }

  private headers(
    additional:
      Record<string, string> = {},
  ): Record<string, string> {
    return {
      Accept:
        'application/vnd.github+json',
      Authorization:
        `Bearer ${this.config.token.trim()}`,
      'X-GitHub-Api-Version':
        API_VERSION,
      ...additional,
    };
  }
}
