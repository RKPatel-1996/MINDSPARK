import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytes,
  type FirebaseStorage,
} from 'firebase/storage';
import { opaqueIdSchema } from '../../domain/id';

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export const ALLOWED_IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const;

export type AllowedImageMimeType =
  (typeof ALLOWED_IMAGE_MIME_TYPES)[number];

export type ImageStorageErrorCode =
  | 'invalid_storage_path'
  | 'empty_file'
  | 'unsupported_file_type'
  | 'file_too_large'
  | 'upload_failed'
  | 'download_url_failed'
  | 'delete_failed';

export class ImageStorageError extends Error {
  readonly code: ImageStorageErrorCode;
  readonly causeValue?: unknown;

  constructor(
    code: ImageStorageErrorCode,
    message: string,
    causeValue?: unknown,
  ) {
    super(message);
    this.name = 'ImageStorageError';
    this.code = code;
    this.causeValue = causeValue;
  }
}

function requireOpaqueId(value: string, label: string): string {
  const parsed = opaqueIdSchema.safeParse(value);

  if (!parsed.success) {
    throw new ImageStorageError(
      'invalid_storage_path',
      `${label} must be a valid opaque UUID`,
    );
  }

  return parsed.data;
}

function requireOwnerUid(uid: string): string {
  if (!uid || uid.includes('/')) {
    throw new ImageStorageError(
      'invalid_storage_path',
      'Owner UID must be a non-empty single Storage path segment',
    );
  }

  return uid;
}

export function buildKnowledgeImageStoragePath(
  uid: string,
  knowledgeItemId: string,
  imageId: string,
): string {
  const safeUid = requireOwnerUid(uid);
  const safeKnowledgeItemId = requireOpaqueId(
    knowledgeItemId,
    'KnowledgeItem ID',
  );
  const safeImageId = requireOpaqueId(imageId, 'Image ID');

  return `users/${safeUid}/knowledgeImages/${safeKnowledgeItemId}/${safeImageId}`;
}

export function isOwnedKnowledgeImageStoragePath(
  storagePath: string,
  uid: string,
): boolean {
  const safeUid = requireOwnerUid(uid);
  const parts = storagePath.split('/');

  if (
    parts.length !== 5 ||
    parts[0] !== 'users' ||
    parts[1] !== safeUid ||
    parts[2] !== 'knowledgeImages'
  ) {
    return false;
  }

  return (
    opaqueIdSchema.safeParse(parts[3]).success &&
    opaqueIdSchema.safeParse(parts[4]).success
  );
}

export function validateImageBlob(blob: Blob): void {
  if (blob.size <= 0) {
    throw new ImageStorageError(
      'empty_file',
      'Image file must not be empty',
    );
  }

  if (
    !ALLOWED_IMAGE_MIME_TYPES.includes(
      blob.type as AllowedImageMimeType,
    )
  ) {
    throw new ImageStorageError(
      'unsupported_file_type',
      'Only JPEG, PNG, and WebP images are supported',
    );
  }

  if (blob.size > MAX_IMAGE_BYTES) {
    throw new ImageStorageError(
      'file_too_large',
      'Image file must not exceed 5 MiB',
    );
  }
}

export interface UploadKnowledgeImageInput {
  knowledgeItemId: string;
  imageId: string;
  blob: Blob;
}

export class FirebaseImageStorageService {
  constructor(
    private readonly storage: FirebaseStorage,
    private readonly uid: string,
  ) {
    requireOwnerUid(uid);
  }

  private requireOwnedPath(storagePath: string): void {
    if (!isOwnedKnowledgeImageStoragePath(storagePath, this.uid)) {
      throw new ImageStorageError(
        'invalid_storage_path',
        'Storage path is not a canonical image path owned by this user',
      );
    }
  }

  async uploadImage(
    input: UploadKnowledgeImageInput,
  ): Promise<string> {
    validateImageBlob(input.blob);

    const storagePath = buildKnowledgeImageStoragePath(
      this.uid,
      input.knowledgeItemId,
      input.imageId,
    );

    try {
      await uploadBytes(
        ref(this.storage, storagePath),
        input.blob,
        {
          contentType: input.blob.type,
        },
      );

      return storagePath;
    } catch (err) {
      throw new ImageStorageError(
        'upload_failed',
        'Image upload failed',
        err,
      );
    }
  }

  async resolveDownloadUrl(storagePath: string): Promise<string> {
    this.requireOwnedPath(storagePath);

    try {
      return await getDownloadURL(ref(this.storage, storagePath));
    } catch (err) {
      throw new ImageStorageError(
        'download_url_failed',
        'Unable to resolve image download URL',
        err,
      );
    }
  }

  async deleteImage(storagePath: string): Promise<void> {
    this.requireOwnedPath(storagePath);

    try {
      await deleteObject(ref(this.storage, storagePath));
    } catch (err) {
      throw new ImageStorageError(
        'delete_failed',
        'Image deletion failed',
        err,
      );
    }
  }
}
