import { describe, expect, it, vi } from 'vitest';
import {
  GitHubReleaseBackupError,
  GitHubReleaseBackupGateway,
} from '../githubReleaseBackupGateway';

const TOKEN = 'github_pat_test_secret';
const SHA256 = 'a'.repeat(64);

function response(status: number, body?: unknown): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as Response;
}

function gateway(fetchImpl: typeof fetch) {
  return new GitHubReleaseBackupGateway({
    owner: 'owner',
    repository: 'mindspark-backups',
    releaseTag: 'mindspark-recovery-points',
    token: TOKEN,
    fetchImpl,
  });
}

function isReleaseLookup(url: string | URL | Request): boolean {
  return String(url).includes('/releases/tags/mindspark-recovery-points');
}

describe('GitHubReleaseBackupGateway', () => {
  it('resolves the Release tag, uploads raw bytes, and verifies the GitHub SHA-256 digest', async () => {
    const bytes = new Uint8Array([1, 2, 3, 4]);

    const fetchImpl = vi.fn(async (url: string | URL | Request) => {
      if (isReleaseLookup(url)) {
        return response(200, { id: 123 });
      }

      return response(201, {
        id: 10,
        name: 'mindspark-2026-09-27T08-00-00Z.mindspark-backup',
        size: bytes.byteLength,
        digest: `sha256:${SHA256}`,
        browser_download_url: 'https://example.invalid/backup',
      });
    }) as unknown as typeof fetch;

    const asset = await gateway(fetchImpl).uploadBackup({
      fileName: 'mindspark-2026-09-27T08-00-00Z.mindspark-backup',
      mimeType: 'application/zip',
      bytes,
      archiveSha256: SHA256,
    });

    expect(asset).toMatchObject({
      id: 10,
      size: 4,
      digest: `sha256:${SHA256}`,
    });

    expect(fetchImpl).toHaveBeenCalledTimes(2);

    expect(String(vi.mocked(fetchImpl).mock.calls[0][0])).toBe(
      'https://api.github.com/repos/owner/mindspark-backups/releases/tags/mindspark-recovery-points',
    );

    const [uploadUrl, uploadInit] = vi.mocked(fetchImpl).mock.calls[1];
    const uploadHeaders = uploadInit?.headers as Record<string, string>;

    expect(String(uploadUrl)).toBe(
      'https://uploads.github.com/repos/owner/mindspark-backups/releases/123/assets' +
      '?name=mindspark-2026-09-27T08-00-00Z.mindspark-backup',
    );
    expect(uploadInit?.method).toBe('POST');
    expect(uploadInit?.body).toBe(bytes);
    expect(uploadHeaders.Authorization).toBe(`Bearer ${TOKEN}`);
    expect(uploadHeaders['Content-Type']).toBe('application/zip');
    expect(uploadHeaders['X-GitHub-Api-Version']).toBe('2022-11-28');
  });

  it('rejects an invalid Release lookup response before upload', async () => {
    const fetchImpl = vi.fn(async () =>
      response(200, { id: 'wrong' }),
    ) as unknown as typeof fetch;

    await expect(gateway(fetchImpl).uploadBackup({
      fileName: 'backup.mindspark-backup',
      mimeType: 'application/zip',
      bytes: new Uint8Array([1]),
      archiveSha256: SHA256,
    })).rejects.toMatchObject({
      code: 'invalid_response',
    });

    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it('rejects a malformed or unsupported GitHub asset digest', async () => {
    const fetchImpl = vi.fn(async (url: string | URL | Request) =>
      isReleaseLookup(url)
        ? response(200, { id: 123 })
        : response(201, {
            id: 12,
            name: 'backup.mindspark-backup',
            size: 1,
            digest: 'md5:deadbeef',
          }),
    ) as unknown as typeof fetch;

    await expect(gateway(fetchImpl).uploadBackup({
      fileName: 'backup.mindspark-backup',
      mimeType: 'application/zip',
      bytes: new Uint8Array([1]),
      archiveSha256: SHA256,
    })).rejects.toMatchObject({
      code: 'invalid_response',
    });
  });

  it('fails closed when GitHub reports a different SHA-256 digest', async () => {
    const bytes = new Uint8Array([1]);

    const fetchImpl = vi.fn(async (url: string | URL | Request) =>
      isReleaseLookup(url)
        ? response(200, { id: 123 })
        : response(201, {
            id: 11,
            name: 'backup.mindspark-backup',
            size: 1,
            digest: `sha256:${'b'.repeat(64)}`,
          }),
    ) as unknown as typeof fetch;

    await expect(gateway(fetchImpl).uploadBackup({
      fileName: 'backup.mindspark-backup',
      mimeType: 'application/zip',
      bytes,
      archiveSha256: SHA256,
    })).rejects.toMatchObject({
      code: 'digest_mismatch',
    });
  });

  it('resolves the Release tag once while listing backup assets across pages', async () => {
    const firstPage = Array.from({ length: 100 }, (_, index) => ({
      id: index + 1,
      name: `backup-${index + 1}.mindspark-backup`,
      size: index + 1,
      digest: null,
    }));

    const secondPage = [
      {
        id: 101,
        name: 'backup-101.mindspark-backup',
        size: 101,
        digest: null,
      },
      {
        id: 102,
        name: 'README.txt',
        size: 10,
        digest: null,
      },
    ];

    const fetchImpl = vi.fn(async (url: string | URL | Request) => {
      const value = String(url);

      if (isReleaseLookup(url)) {
        return response(200, { id: 123 });
      }

      return response(
        200,
        new URL(value).searchParams.get('page') === '1'
          ? firstPage
          : secondPage,
      );
    }) as unknown as typeof fetch;

    const assets = await gateway(fetchImpl).listBackupAssets();

    expect(assets).toHaveLength(101);
    expect(assets.at(-1)?.name).toBe('backup-101.mindspark-backup');
    expect(fetchImpl).toHaveBeenCalledTimes(3);

    expect(String(vi.mocked(fetchImpl).mock.calls[1][0])).toContain(
      'per_page=100&page=1',
    );
    expect(String(vi.mocked(fetchImpl).mock.calls[2][0])).toContain(
      'per_page=100&page=2',
    );
  });

  it('deletes one Release asset without exposing the token in the URL', async () => {
    const fetchImpl = vi.fn(async () =>
      response(204),
    ) as unknown as typeof fetch;

    await gateway(fetchImpl).deleteBackupAsset(42);

    const [url, init] = vi.mocked(fetchImpl).mock.calls[0];
    const headers = init?.headers as Record<string, string>;

    expect(String(url)).toBe(
      'https://api.github.com/repos/owner/mindspark-backups/releases/assets/42',
    );
    expect(String(url)).not.toContain(TOKEN);
    expect(init?.method).toBe('DELETE');
    expect(headers.Authorization).toBe(`Bearer ${TOKEN}`);
  });

  it('does not expose the GitHub token in request-failure errors', async () => {
    const fetchImpl = vi.fn(async () =>
      response(403),
    ) as unknown as typeof fetch;

    let caught: unknown;

    try {
      await gateway(fetchImpl).deleteBackupAsset(42);
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(GitHubReleaseBackupError);
    expect(String(caught)).not.toContain(TOKEN);
  });
});
