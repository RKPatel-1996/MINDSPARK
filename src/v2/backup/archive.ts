import { strToU8, zipSync } from 'fflate';
import type { BackupEnvelopeV1 } from './contract';

export const BACKUP_MANIFEST_ARCHIVE_PATH = 'backup.json';

export interface BackupArchiveMediaMember {
  archivePath: string;
  bytes: Uint8Array;
}

export interface BackupArchiveSerializer {
  serialize(
    backup: BackupEnvelopeV1,
    media: readonly BackupArchiveMediaMember[],
  ): Promise<Uint8Array>;
}

export class BackupArchiveSerializationError extends Error {
  constructor(
    message: string,
    readonly causeValue?: unknown,
  ) {
    super(message);
    this.name = 'BackupArchiveSerializationError';
  }
}

function isSafeArchivePath(path: string): boolean {
  return (
    path.length > 0 &&
    !path.startsWith('/') &&
    !path.startsWith('\\') &&
    !/^[A-Za-z]:/.test(path) &&
    !path.split('/').some(
      (segment) => segment === '' || segment === '.' || segment === '..',
    ) &&
    !path.includes('\\')
  );
}

function toArchiveBytes(source: Uint8Array): Uint8Array {
  // Test/browser realms can have distinct Uint8Array constructors. fflate uses
  // its captured constructor to distinguish files from directory objects.
  const FflateUint8Array = strToU8('', true)
    .constructor as Uint8ArrayConstructor;
  return new FflateUint8Array(source);
}

/** Serializes an already validated V1 envelope and its resolved media bytes. */
export class ZipBackupArchiveSerializer implements BackupArchiveSerializer {
  async serialize(
    backup: BackupEnvelopeV1,
    media: readonly BackupArchiveMediaMember[],
  ): Promise<Uint8Array> {
    const expectedPaths = new Set(backup.media.map((entry) => entry.archivePath));
    const seenPaths = new Set<string>();
    const files: Record<string, Uint8Array> = {};
    const deterministicMtime = new Date('1980-01-01T00:00:00.000Z');

    for (const member of [...media].sort((a, b) =>
      a.archivePath.localeCompare(b.archivePath)
    )) {
      if (
        !isSafeArchivePath(member.archivePath) ||
        member.archivePath === BACKUP_MANIFEST_ARCHIVE_PATH ||
        !expectedPaths.has(member.archivePath) ||
        seenPaths.has(member.archivePath)
      ) {
        throw new BackupArchiveSerializationError(
          `Invalid or duplicate archive member path: ${member.archivePath}`,
        );
      }
      seenPaths.add(member.archivePath);
      files[member.archivePath] = toArchiveBytes(member.bytes);
    }

    if (seenPaths.size !== expectedPaths.size) {
      throw new BackupArchiveSerializationError(
        'Archive media members do not match the backup media manifest',
      );
    }

    files[BACKUP_MANIFEST_ARCHIVE_PATH] = toArchiveBytes(
      strToU8(JSON.stringify(backup)),
    );

    try {
      return zipSync(files, { level: 6, mtime: deterministicMtime });
    } catch (error) {
      throw new BackupArchiveSerializationError(
        'Unable to serialize MindSpark backup archive',
        error,
      );
    }
  }
}
