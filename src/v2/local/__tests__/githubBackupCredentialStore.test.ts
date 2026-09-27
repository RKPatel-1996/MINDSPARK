import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import {
  clearGitHubBackupMemoryToken,
  loadGitHubBackupMemoryToken,
} from '../githubBackupConfig';
import {
  createGitHubBackupCredentialStore,
  type GitHubBackupCredentialPersistence,
} from '../githubBackupCredentialStore';

function createMemoryPersistence() {
  let value: Awaited<
    ReturnType<
      GitHubBackupCredentialPersistence['load']
    >
  > = null;

  const persistence:
    GitHubBackupCredentialPersistence = {
      async load() {
        return value;
      },

      async save(next) {
        value = next;
      },

      async clear() {
        value = null;
      },
    };

  return {
    persistence,
    current: () => value,
  };
}

describe(
  'encrypted GitHub backup credential store',
  () => {
    beforeEach(() => {
      clearGitHubBackupMemoryToken();
    });

    it('encrypts the PAT with a non-extractable AES-GCM key and restores it after memory is cleared', async () => {
      const memory =
        createMemoryPersistence();

      const store =
        createGitHubBackupCredentialStore(
          memory.persistence,
        );

      expect(
        await store.save(
          '  github_pat_test_secret  ',
        ),
      ).toBe('persistent');

      const stored = memory.current();

      expect(stored).not.toBeNull();

      if (!stored) {
        throw new Error(
          'Expected encrypted credential.',
        );
      }

      expect(stored.version).toBe(1);
      expect(stored.key.extractable).toBe(
        false,
      );

      expect(stored.key.algorithm.name)
        .toBe('AES-GCM');

      expect(stored.iv.byteLength).toBe(
        12,
      );

      expect(
        new TextDecoder().decode(
          stored.ciphertext,
        ),
      ).not.toContain(
        'github_pat_test_secret',
      );

      clearGitHubBackupMemoryToken();

      expect(
        loadGitHubBackupMemoryToken(),
      ).toBeNull();

      expect(
        await store.load(),
      ).toBe(
        'github_pat_test_secret',
      );

      expect(
        loadGitHubBackupMemoryToken(),
      ).toBe(
        'github_pat_test_secret',
      );
    });

    it('uses a fresh IV for each persisted value', async () => {
      const memory =
        createMemoryPersistence();

      const store =
        createGitHubBackupCredentialStore(
          memory.persistence,
        );

      await store.save(
        'github_pat_test_secret',
      );

      const first =
        memory.current();

      await store.save(
        'github_pat_test_secret',
      );

      const second =
        memory.current();

      expect(first).not.toBeNull();
      expect(second).not.toBeNull();

      expect(
        Array.from(first?.iv ?? []),
      ).not.toEqual(
        Array.from(second?.iv ?? []),
      );
    });

    it('clears both app memory and persisted credential state', async () => {
      const memory =
        createMemoryPersistence();

      const store =
        createGitHubBackupCredentialStore(
          memory.persistence,
        );

      await store.save(
        'github_pat_test_secret',
      );

      await store.clear();

      expect(memory.current()).toBeNull();

      expect(
        loadGitHubBackupMemoryToken(),
      ).toBeNull();

      expect(
        await store.load(),
      ).toBeNull();
    });

    it('falls back to app memory when encrypted persistence fails', async () => {
      const persistence:
        GitHubBackupCredentialPersistence = {
          async load() {
            return null;
          },

          async save() {
            throw new Error(
              'storage blocked',
            );
          },

          async clear() {},
        };

      const warn =
        vi.spyOn(
          console,
          'warn',
        ).mockImplementation(() => {});

      const store =
        createGitHubBackupCredentialStore(
          persistence,
        );

      expect(
        await store.save(
          'github_pat_test_secret',
        ),
      ).toBe('memory-only');

      expect(
        loadGitHubBackupMemoryToken(),
      ).toBe(
        'github_pat_test_secret',
      );

      warn.mockRestore();
    });

    it('treats decryption failure as an unavailable credential', async () => {
      const memory =
        createMemoryPersistence();

      const store =
        createGitHubBackupCredentialStore(
          memory.persistence,
        );

      await store.save(
        'github_pat_test_secret',
      );

      const stored = memory.current();

      if (!stored) {
        throw new Error(
          'Expected encrypted credential.',
        );
      }

      stored.ciphertext =
        new Uint8Array([
          1,
          2,
          3,
          4,
        ]).buffer;

      clearGitHubBackupMemoryToken();

      const warn =
        vi.spyOn(
          console,
          'warn',
        ).mockImplementation(() => {});

      expect(
        await store.load(),
      ).toBeNull();

      expect(
        loadGitHubBackupMemoryToken(),
      ).toBeNull();

      warn.mockRestore();
    });
  },
);
