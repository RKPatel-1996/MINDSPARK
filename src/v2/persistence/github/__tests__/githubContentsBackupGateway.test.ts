import {
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import {
  GitHubContentsBackupGateway,
} from '../githubContentsBackupGateway';

const TOKEN = 'github_pat_test_secret';

const FILE_NAME =
  'mindspark-2026-09-27T15-19-30-467Z.mindspark-backup';

const FILE_PATH =
  `recovery-points/${FILE_NAME}`;

const BYTES =
  new Uint8Array([1, 2, 3, 4]);

const SHA256 =
  '9f64a747e1b97f131fabb6b447296c9b6f0201e79fb3c5356e6c77e89b6a806a';

const GIT_SHA =
  'a'.repeat(40);

function jsonResponse(
  status: number,
  body?: unknown,
): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
    arrayBuffer: async () =>
      new ArrayBuffer(0),
  } as Response;
}

function rawResponse(
  status: number,
  bytes: Uint8Array,
): Response {
  const copy = new Uint8Array(bytes);

  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => undefined,
    arrayBuffer: async () =>
      copy.buffer.slice(0),
  } as Response;
}

function gateway(
  fetchImpl: typeof fetch,
) {
  return new GitHubContentsBackupGateway({
    owner: 'owner',
    repository: 'backups',
    token: TOKEN,
    fetchImpl,
  });
}

describe(
  'GitHubContentsBackupGateway',
  () => {
    it('commits and verifies a recovery point', async () => {
      const fetchImpl =
        vi.fn(
          async (
            _url:
              string | URL | Request,
            init?: RequestInit,
          ) => {
            if (init?.method === 'PUT') {
              return jsonResponse(
                201,
                {
                  content: {
                    type: 'file',
                    name: FILE_NAME,
                    path: FILE_PATH,
                    sha: GIT_SHA,
                    size: BYTES.byteLength,
                  },
                },
              );
            }

            return rawResponse(
              200,
              BYTES,
            );
          },
        ) as unknown as typeof fetch;

      const asset =
        await gateway(fetchImpl)
          .uploadBackup({
            fileName: FILE_NAME,
            mimeType: 'application/zip',
            bytes: BYTES,
            archiveSha256: SHA256,
          });

      expect(asset).toEqual({
        id: Date.parse(
          '2026-09-27T15:19:30.467Z',
        ),
        name: FILE_NAME,
        size: 4,
        digest: `sha256:${SHA256}`,
        createdAt:
          '2026-09-27T15:19:30.467Z',
      });

      expect(fetchImpl)
        .toHaveBeenCalledTimes(2);

      const [
        putUrl,
        putInit,
      ] =
        vi.mocked(fetchImpl)
          .mock.calls[0];

      expect(String(putUrl)).toBe(
        `https://api.github.com/repos/owner/backups/contents/${FILE_PATH}`,
      );

      expect(putInit?.method)
        .toBe('PUT');

      const body =
        JSON.parse(
          String(putInit?.body),
        ) as {
          message: string;
          content: string;
        };

      expect(body.message)
        .toContain(FILE_NAME);

      expect(body.content)
        .toBe('AQIDBA==');

      expect(String(putInit?.body))
        .not.toContain(TOKEN);
    });

    it('lists only MindSpark recovery files', async () => {
      const fetchImpl =
        vi.fn(async () =>
          jsonResponse(
            200,
            [
              {
                type: 'file',
                name: FILE_NAME,
                path: FILE_PATH,
                sha: GIT_SHA,
                size: 4,
              },
              {
                type: 'file',
                name: 'README.md',
                path:
                  'recovery-points/README.md',
                sha: 'b'.repeat(40),
                size: 10,
              },
            ],
          ),
        ) as unknown as typeof fetch;

      const assets =
        await gateway(fetchImpl)
          .listBackupAssets();

      expect(assets).toEqual([
        {
          id: Date.parse(
            '2026-09-27T15:19:30.467Z',
          ),
          name: FILE_NAME,
          size: 4,
          digest: null,
          createdAt:
            '2026-09-27T15:19:30.467Z',
        },
      ]);
    });

    it('deletes a listed recovery file using its Git SHA', async () => {
      const fetchImpl =
        vi.fn(
          async (
            _url:
              string | URL | Request,
            init?: RequestInit,
          ) => {
            if (init?.method === 'DELETE') {
              return jsonResponse(200, {});
            }

            return jsonResponse(
              200,
              [
                {
                  type: 'file',
                  name: FILE_NAME,
                  path: FILE_PATH,
                  sha: GIT_SHA,
                  size: 4,
                },
              ],
            );
          },
        ) as unknown as typeof fetch;

      const instance =
        gateway(fetchImpl);

      const [asset] =
        await instance.listBackupAssets();

      await instance
        .deleteBackupAsset(asset.id);

      const [
        deleteUrl,
        deleteInit,
      ] =
        vi.mocked(fetchImpl)
          .mock.calls[1];

      expect(String(deleteUrl)).toBe(
        `https://api.github.com/repos/owner/backups/contents/${FILE_PATH}`,
      );

      expect(deleteInit?.method)
        .toBe('DELETE');

      expect(
        JSON.parse(
          String(deleteInit?.body),
        ),
      ).toMatchObject({
        sha: GIT_SHA,
      });
    });

    it('fails when committed bytes differ', async () => {
      const fetchImpl =
        vi.fn(
          async (
            _url:
              string | URL | Request,
            init?: RequestInit,
          ) => {
            if (init?.method === 'PUT') {
              return jsonResponse(
                201,
                {
                  content: {
                    type: 'file',
                    name: FILE_NAME,
                    path: FILE_PATH,
                    sha: GIT_SHA,
                    size: 4,
                  },
                },
              );
            }

            return rawResponse(
              200,
              new Uint8Array([4, 3, 2, 1]),
            );
          },
        ) as unknown as typeof fetch;

      await expect(
        gateway(fetchImpl)
          .uploadBackup({
            fileName: FILE_NAME,
            mimeType: 'application/zip',
            bytes: BYTES,
            archiveSha256: SHA256,
          }),
      ).rejects.toMatchObject({
        code: 'digest_mismatch',
      });
    });

    it('treats a missing recovery directory as empty', async () => {
      const fetchImpl =
        vi.fn(async () =>
          jsonResponse(404),
        ) as unknown as typeof fetch;

      await expect(
        gateway(fetchImpl)
          .listBackupAssets(),
      ).resolves.toEqual([]);
    });
  },
);
