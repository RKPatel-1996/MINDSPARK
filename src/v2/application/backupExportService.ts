import {
  BACKUP_FORMAT,
  CURRENT_BACKUP_VERSION,
  type BackupEnvelopeV1,
  type BackupMediaEntryV1,
  type PortableKnowledgeItemV1,
} from '../backup/contract';
import {
  ZipBackupArchiveSerializer,
  type BackupArchiveMediaMember,
  type BackupArchiveSerializer,
} from '../backup/archive';
import { validateAndNormalizeBackup } from '../backup/validator';
import {
  MAX_IMAGE_BYTES,
  isAllowedImageMimeType,
} from '../domain/imageMedia';
import type { BackupSourceSnapshot } from './backupSnapshotService';

export const BACKUP_ARCHIVE_MIME_TYPE = 'application/zip';
export const BACKUP_ARCHIVE_FILE_NAME = 'mindspark-v1.mindspark-backup';

export interface BackupSnapshotProvider {
  createSnapshot(): Promise<BackupSourceSnapshot>;
}

export interface BackupMediaFile {
  bytes: Uint8Array;
  mimeType: string;
}

export interface BackupMediaGateway {
  readImage(storagePath: string): Promise<BackupMediaFile | null>;
}

export interface BackupContentHasher {
  sha256(bytes: Uint8Array): Promise<string>;
}

export type BackupExportErrorCode =
  | 'duplicate_media_identity'
  | 'media_read_failed'
  | 'missing_media'
  | 'unsupported_mime_type'
  | 'media_too_large'
  | 'hash_failed'
  | 'final_validation_failed'
  | 'archive_serialization_failed';

export class BackupExportError extends Error {
  constructor(
    readonly code: BackupExportErrorCode,
    message: string,
    readonly causeValue?: unknown,
  ) {
    super(message);
    this.name = 'BackupExportError';
  }
}

export interface BackupExportResult {
  fileName: typeof BACKUP_ARCHIVE_FILE_NAME;
  mimeType: typeof BACKUP_ARCHIVE_MIME_TYPE;
  bytes: Uint8Array;
  backup: BackupEnvelopeV1;
}

export const webCryptoBackupHasher: BackupContentHasher = {
  async sha256(bytes: Uint8Array): Promise<string> {
    const data = bytes.buffer.slice(
      bytes.byteOffset,
      bytes.byteOffset + bytes.byteLength,
    ) as ArrayBuffer;
    const digest = await globalThis.crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(digest), (value) =>
      value.toString(16).padStart(2, '0'),
    ).join('');
  },
};

interface CollectedMedia {
  manifest: BackupMediaEntryV1;
  archiveMember: BackupArchiveMediaMember;
}

/** Converts the authoritative B3 source snapshot into a portable V1 archive. */
export class BackupExportService {
  constructor(
    private readonly snapshots: BackupSnapshotProvider,
    private readonly media: BackupMediaGateway,
    private readonly hasher: BackupContentHasher = webCryptoBackupHasher,
    private readonly archive: BackupArchiveSerializer =
      new ZipBackupArchiveSerializer(),
  ) {}

  async exportBackup(): Promise<BackupExportResult> {
    const snapshot = await this.snapshots.createSnapshot();
    const imageIds = new Set<string>();

    for (const item of snapshot.knowledgeItems) {
      for (const image of item.images ?? []) {
        if (imageIds.has(image.id)) {
          throw new BackupExportError(
            'duplicate_media_identity',
            `Duplicate image identity: ${image.id}`,
          );
        }
        imageIds.add(image.id);
      }
    }

    const collectedByImageId = new Map<string, CollectedMedia>();
    const knowledgeItems: PortableKnowledgeItemV1[] = [];

    for (const item of snapshot.knowledgeItems) {
      const { images, ...portableItem } = item;
      const portableImages = [];

      for (const image of images ?? []) {
        let file: BackupMediaFile | null;
        try {
          file = await this.media.readImage(image.storagePath);
        } catch (error) {
          throw new BackupExportError(
            'media_read_failed',
            `Unable to read image ${image.id}`,
            error,
          );
        }

        if (!file || file.bytes.byteLength === 0) {
          throw new BackupExportError(
            'missing_media',
            `Image ${image.id} has no readable bytes`,
          );
        }
        if (!isAllowedImageMimeType(file.mimeType)) {
          throw new BackupExportError(
            'unsupported_mime_type',
            `Image ${image.id} has unsupported MIME type ${file.mimeType}`,
          );
        }
        if (file.bytes.byteLength > MAX_IMAGE_BYTES) {
          throw new BackupExportError(
            'media_too_large',
            `Image ${image.id} exceeds the 5 MiB limit`,
          );
        }

        let sha256: string;
        try {
          sha256 = await this.hasher.sha256(file.bytes);
        } catch (error) {
          throw new BackupExportError(
            'hash_failed',
            `Unable to hash image ${image.id}`,
            error,
          );
        }

        const archivePath = `media/${image.id}`;
        const { storagePath: _storagePath, ...portableImage } = image;
        portableImages.push({ ...portableImage, assetId: image.id });
        collectedByImageId.set(image.id, {
          manifest: {
            assetId: image.id,
            imageId: image.id,
            knowledgeItemId: item.id,
            archivePath,
            mimeType: file.mimeType,
            byteLength: file.bytes.byteLength,
            sha256,
          },
          archiveMember: { archivePath, bytes: file.bytes },
        });
      }

      knowledgeItems.push({
        ...portableItem,
        ...(portableImages.length > 0 ? { images: portableImages } : {}),
      });
    }

    const collected = [...collectedByImageId.values()];
    const candidate = {
      format: BACKUP_FORMAT,
      backupVersion: CURRENT_BACKUP_VERSION,
      exportedAt: snapshot.exportedAt,
      data: {
        taxonomy: snapshot.taxonomy,
        settings: snapshot.settings,
        schedulerParameterSets: snapshot.schedulerParameterSets,
        knowledgeItems,
        reviewCards: snapshot.reviewCards,
        reviewEvents: snapshot.reviewEvents,
      },
      media: collected.map((value) => value.manifest),
    };
    const validation = validateAndNormalizeBackup(candidate);

    if ('issues' in validation) {
      throw new BackupExportError(
        'final_validation_failed',
        'Final V1 backup envelope failed validation',
        validation.issues,
      );
    }

    let bytes: Uint8Array;
    try {
      bytes = await this.archive.serialize(
        validation.backup,
        collected.map((value) => value.archiveMember),
      );
    } catch (error) {
      throw new BackupExportError(
        'archive_serialization_failed',
        'Unable to create the backup archive',
        error,
      );
    }

    return {
      fileName: BACKUP_ARCHIVE_FILE_NAME,
      mimeType: BACKUP_ARCHIVE_MIME_TYPE,
      bytes,
      backup: validation.backup,
    };
  }
}
