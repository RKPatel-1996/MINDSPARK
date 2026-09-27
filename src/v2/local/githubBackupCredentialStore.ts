import {
  clearGitHubBackupMemoryToken,
  loadGitHubBackupMemoryToken,
  saveGitHubBackupMemoryToken,
} from './githubBackupConfig';

const DB_NAME =
  'MindSparkV2_GitHubBackupCredential';

const STORE_NAME = 'credential';
const CREDENTIAL_KEY = 'github_pat_v1';

const AES_ALGORITHM = 'AES-GCM';
const AES_KEY_LENGTH = 256;
const IV_LENGTH = 12;

interface StoredEncryptedCredential {
  version: 1;
  key: CryptoKey;
  iv: Uint8Array;
  ciphertext: ArrayBuffer;
}

export interface GitHubBackupCredentialPersistence {
  load():
    Promise<StoredEncryptedCredential | null>;

  save(
    value: StoredEncryptedCredential,
  ): Promise<void>;

  clear(): Promise<void>;
}

export type GitHubBackupCredentialPersistenceState =
  | 'persistent'
  | 'memory-only';

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (
      typeof globalThis.indexedDB === 'undefined'
    ) {
      reject(
        new Error(
          'IndexedDB is unavailable for GitHub backup credential storage.',
        ),
      );
      return;
    }

    const request =
      globalThis.indexedDB.open(DB_NAME, 1);

    request.onupgradeneeded = () => {
      const db = request.result;

      if (
        !db.objectStoreNames.contains(
          STORE_NAME,
        )
      ) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () =>
      resolve(request.result);

    request.onerror = () =>
      reject(
        request.error ??
          new Error(
            'Failed to open GitHub backup credential database.',
          ),
      );
  });
}

async function runDatabaseRequest<T>(
  mode: IDBTransactionMode,
  operation: (
    store: IDBObjectStore,
  ) => IDBRequest<T>,
): Promise<T> {
  const db = await openDatabase();

  try {
    return await new Promise<T>(
      (resolve, reject) => {
        const tx =
          db.transaction(
            STORE_NAME,
            mode,
          );

        const request =
          operation(
            tx.objectStore(STORE_NAME),
          );

        request.onsuccess = () =>
          resolve(request.result);

        request.onerror = () =>
          reject(
            request.error ??
              new Error(
                'GitHub backup credential database request failed.',
              ),
          );

        tx.onabort = () =>
          reject(
            tx.error ??
              new Error(
                'GitHub backup credential transaction aborted.',
              ),
          );
      },
    );
  } finally {
    db.close();
  }
}

const indexedDbPersistence:
  GitHubBackupCredentialPersistence = {
    async load() {
      return (
        await runDatabaseRequest<
          StoredEncryptedCredential | undefined
        >(
          'readonly',
          (store) =>
            store.get(CREDENTIAL_KEY),
        )
      ) ?? null;
    },

    async save(value) {
      await runDatabaseRequest(
        'readwrite',
        (store) =>
          store.put(
            value,
            CREDENTIAL_KEY,
          ),
      );
    },

    async clear() {
      if (
        typeof globalThis.indexedDB ===
        'undefined'
      ) {
        return;
      }

      await runDatabaseRequest(
        'readwrite',
        (store) =>
          store.delete(CREDENTIAL_KEY),
      );
    },
  };

function cryptoApi(): Crypto {
  const value = globalThis.crypto;

  if (
    !value ||
    !value.subtle ||
    typeof value.getRandomValues !==
      'function'
  ) {
    throw new Error(
      'Web Crypto is unavailable for GitHub backup credential encryption.',
    );
  }

  return value;
}

export function createGitHubBackupCredentialStore(
  persistence:
    GitHubBackupCredentialPersistence,
  cryptoProvider: () => Crypto =
    cryptoApi,
) {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  return {
    async save(
      token: string,
    ): Promise<
      GitHubBackupCredentialPersistenceState
    > {
      saveGitHubBackupMemoryToken(token);

      const normalized =
        loadGitHubBackupMemoryToken();

      if (!normalized) {
        throw new Error(
          'GitHub backup token is unavailable.',
        );
      }

      try {
        const crypto = cryptoProvider();

        const key =
          await crypto.subtle.generateKey(
            {
              name: AES_ALGORITHM,
              length: AES_KEY_LENGTH,
            },
            false,
            ['encrypt', 'decrypt'],
          );

        const iv =
          crypto.getRandomValues(
            new Uint8Array(IV_LENGTH),
          );

        const ciphertext =
          await crypto.subtle.encrypt(
            {
              name: AES_ALGORITHM,
              iv,
            },
            key,
            encoder.encode(normalized),
          );

        await persistence.save({
          version: 1,
          key,
          iv,
          ciphertext,
        });

        return 'persistent';
      } catch (error) {
        console.warn(
          'Failed to persist encrypted GitHub backup credential; keeping it in app memory only.',
          error,
        );

        return 'memory-only';
      }
    },

    async load():
      Promise<string | null> {
      const memoryToken =
        loadGitHubBackupMemoryToken();

      if (memoryToken) {
        return memoryToken;
      }

      try {
        const stored =
          await persistence.load();

        if (
          !stored ||
          stored.version !== 1
        ) {
          return null;
        }

        const crypto = cryptoProvider();

        const plaintext =
          await crypto.subtle.decrypt(
            {
              name: AES_ALGORITHM,
              iv: stored.iv,
            },
            stored.key,
            stored.ciphertext,
          );

        const token =
          decoder.decode(
            plaintext,
          ).trim();

        if (!token) {
          return null;
        }

        saveGitHubBackupMemoryToken(
          token,
        );

        return token;
      } catch (error) {
        console.warn(
          'Failed to load encrypted GitHub backup credential.',
          error,
        );

        return null;
      }
    },

    async clear(): Promise<void> {
      clearGitHubBackupMemoryToken();

      try {
        await persistence.clear();
      } catch (error) {
        console.warn(
          'Failed to clear persisted GitHub backup credential.',
          error,
        );

        throw error;
      }
    },
  };
}

const browserCredentialStore =
  createGitHubBackupCredentialStore(
    indexedDbPersistence,
  );

export function saveGitHubBackupCredential(
  token: string,
): Promise<
  GitHubBackupCredentialPersistenceState
> {
  return browserCredentialStore.save(
    token,
  );
}

export function loadGitHubBackupCredential():
  Promise<string | null> {
  return browserCredentialStore.load();
}

export function clearGitHubBackupCredential():
  Promise<void> {
  return browserCredentialStore.clear();
}
