import { strFromU8, strToU8, unzipSync, zipSync } from 'fflate';
import type { BackupEnvelopeV1 } from './contract';
import { validateAndNormalizeBackup } from './validator';
import { MAX_IMAGE_BYTES } from '../domain/imageMedia';

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

export interface ParsedBackupArchive {
  backup: BackupEnvelopeV1;
  media: ReadonlyMap<string, { bytes: Uint8Array; mimeType: string }>;
}

export type BackupArchiveReadErrorCode =
  | 'archive_too_large'
  | 'invalid_zip'
  | 'invalid_member'
  | 'invalid_manifest'
  | 'manifest_mismatch';

export class BackupArchiveReadError extends Error {
  constructor(
    readonly code: BackupArchiveReadErrorCode,
    message: string,
    readonly causeValue?: unknown,
  ) {
    super(message);
    this.name = 'BackupArchiveReadError';
  }
}

export interface BackupArchiveReader {
  parse(bytes: Uint8Array): ParsedBackupArchive;
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

const MAX_ARCHIVE_BYTES = 512 * 1024 * 1024;
const MAX_MANIFEST_BYTES = 16 * 1024 * 1024;
const MAX_ARCHIVE_MEMBERS = 10_001;

/** Reads only the strict V1 archive shape produced by ZipBackupArchiveSerializer. */
export class ZipBackupArchiveReader implements BackupArchiveReader {
  parse(source: Uint8Array): ParsedBackupArchive {
    if (source.byteLength === 0 || source.byteLength > MAX_ARCHIVE_BYTES) {
      throw new BackupArchiveReadError('archive_too_large', 'Backup archive is empty or exceeds 512 MiB');
    }

    let memberCount = 0;
    let expandedBytes = 0;
    let files: Record<string, Uint8Array>;
    try {
      files = unzipSync(source, {
        filter: (member) => {
          memberCount += 1;
          expandedBytes += member.originalSize;
          const isManifest = member.name === BACKUP_MANIFEST_ARCHIVE_PATH;
          const isMedia = member.name.startsWith('media/');
          if (
            memberCount > MAX_ARCHIVE_MEMBERS ||
            expandedBytes > MAX_ARCHIVE_BYTES ||
            !isSafeArchivePath(member.name) ||
            (!isManifest && !isMedia) ||
            (isManifest && member.originalSize > MAX_MANIFEST_BYTES) ||
            (isMedia && member.originalSize > MAX_IMAGE_BYTES)
          ) {
            throw new BackupArchiveReadError('invalid_member', `Invalid archive member: ${member.name}`);
          }
          return true;
        },
      });
    } catch (error) {
      if (error instanceof BackupArchiveReadError) throw error;
      throw new BackupArchiveReadError('invalid_zip', 'Unable to read the backup ZIP archive', error);
    }

    const manifestBytes = files[BACKUP_MANIFEST_ARCHIVE_PATH];
    if (!manifestBytes) {
      throw new BackupArchiveReadError('invalid_manifest', 'Backup archive is missing backup.json');
    }

    let candidate: unknown;
    try {
      candidate = JSON.parse(strFromU8(manifestBytes));
    } catch (error) {
      throw new BackupArchiveReadError('invalid_manifest', 'backup.json is not valid JSON', error);
    }
    const validation = validateAndNormalizeBackup(candidate);
    if ('issues' in validation) {
      throw new BackupArchiveReadError(
        'invalid_manifest',
        'backup.json is not a valid MindSpark V1 backup',
        validation.issues,
      );
    }

    const expectedPaths = new Set(validation.backup.media.map((entry) => entry.archivePath));
    const actualPaths = Object.keys(files).filter((path) => path !== BACKUP_MANIFEST_ARCHIVE_PATH);
    if (
      actualPaths.length !== expectedPaths.size ||
      actualPaths.some((path) => !expectedPaths.has(path))
    ) {
      throw new BackupArchiveReadError(
        'manifest_mismatch',
        'Archive media members do not match backup.json',
      );
    }

    const media = new Map<string, { bytes: Uint8Array; mimeType: string }>();
    for (const entry of validation.backup.media) {
      const bytes = files[entry.archivePath];
      if (!bytes || bytes.byteLength !== entry.byteLength || media.has(entry.assetId)) {
        throw new BackupArchiveReadError(
          'manifest_mismatch',
          `Archive media does not match manifest entry ${entry.assetId}`,
        );
      }
      media.set(entry.assetId, { bytes, mimeType: entry.mimeType });
    }
    return { backup: validation.backup, media };
  }
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
