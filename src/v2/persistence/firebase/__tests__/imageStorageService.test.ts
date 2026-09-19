import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytes,
} from 'firebase/storage';
import {
  FirebaseImageStorageService,
  ImageStorageError,
  MAX_IMAGE_BYTES,
  buildKnowledgeImageStoragePath,
  isOwnedKnowledgeImageStoragePath,
  validateImageBlob,
} from '../imageStorageService';

vi.mock('firebase/storage', () => ({
  ref: vi.fn((_storage: unknown, path: string) => ({ fullPath: path })),
  uploadBytes: vi.fn(),
  getDownloadURL: vi.fn(),
  deleteObject: vi.fn(),
}));

const KNOWLEDGE_ID =
  '11111111-1111-4111-8111-111111111111';
const IMAGE_ID =
  '22222222-2222-4222-8222-222222222222';
const OTHER_IMAGE_ID =
  '33333333-3333-4333-8333-333333333333';

const OWNER_UID = 'owner-uid';

const PATH =
  `users/${OWNER_UID}/knowledgeImages/${KNOWLEDGE_ID}/${IMAGE_ID}`;

describe('Firebase image Storage runtime boundary', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(uploadBytes).mockResolvedValue({} as any);
    vi.mocked(getDownloadURL).mockResolvedValue(
      'https://example.invalid/transient-image-url',
    );
    vi.mocked(deleteObject).mockResolvedValue(undefined);
  });

  it('constructs the canonical owner KnowledgeItem image path', () => {
    expect(
      buildKnowledgeImageStoragePath(
        OWNER_UID,
        KNOWLEDGE_ID,
        IMAGE_ID,
      ),
    ).toBe(PATH);
  });

  it('rejects invalid IDs and owner path injection', () => {
    expect(() =>
      buildKnowledgeImageStoragePath(
        OWNER_UID,
        'not-a-uuid',
        IMAGE_ID,
      ),
    ).toThrow(ImageStorageError);

    expect(() =>
      buildKnowledgeImageStoragePath(
        'owner/bad',
        KNOWLEDGE_ID,
        IMAGE_ID,
      ),
    ).toThrow(ImageStorageError);
  });

  it('recognizes only canonical image paths belonging to the owner', () => {
    expect(
      isOwnedKnowledgeImageStoragePath(PATH, OWNER_UID),
    ).toBe(true);

    expect(
      isOwnedKnowledgeImageStoragePath(
        `users/other-user/knowledgeImages/${KNOWLEDGE_ID}/${IMAGE_ID}`,
        OWNER_UID,
      ),
    ).toBe(false);

    expect(
      isOwnedKnowledgeImageStoragePath(
        `users/${OWNER_UID}/other/${KNOWLEDGE_ID}/${IMAGE_ID}`,
        OWNER_UID,
      ),
    ).toBe(false);

    expect(
      isOwnedKnowledgeImageStoragePath(
        `users/${OWNER_UID}/knowledgeImages/${KNOWLEDGE_ID}/not-a-uuid`,
        OWNER_UID,
      ),
    ).toBe(false);
  });

  it('accepts JPEG, PNG, and WebP within the size limit', () => {
    for (const type of [
      'image/jpeg',
      'image/png',
      'image/webp',
    ]) {
      expect(() =>
        validateImageBlob(
          new Blob(['valid-image'], { type }),
        ),
      ).not.toThrow();
    }
  });

  it('rejects empty, unsupported, and oversized blobs', () => {
    expect(() =>
      validateImageBlob(new Blob([], { type: 'image/png' })),
    ).toThrowError(
      expect.objectContaining({ code: 'empty_file' }),
    );

    expect(() =>
      validateImageBlob(
        new Blob(['gif'], { type: 'image/gif' }),
      ),
    ).toThrowError(
      expect.objectContaining({ code: 'unsupported_file_type' }),
    );

    expect(() =>
      validateImageBlob(
        new Blob(
          [new Uint8Array(MAX_IMAGE_BYTES + 1)],
          { type: 'image/png' },
        ),
      ),
    ).toThrowError(
      expect.objectContaining({ code: 'file_too_large' }),
    );
  });

  it('uploads to the canonical path and returns only storagePath', async () => {
    const service = new FirebaseImageStorageService(
      {} as any,
      OWNER_UID,
    );

    const blob = new Blob(
      ['image'],
      { type: 'image/png' },
    );

    await expect(
      service.uploadImage({
        knowledgeItemId: KNOWLEDGE_ID,
        imageId: IMAGE_ID,
        blob,
      }),
    ).resolves.toBe(PATH);

    expect(ref).toHaveBeenCalledWith(
      expect.anything(),
      PATH,
    );

    expect(uploadBytes).toHaveBeenCalledWith(
      expect.anything(),
      blob,
      { contentType: 'image/png' },
    );
  });

  it('wraps upload failures in a typed error', async () => {
    vi.mocked(uploadBytes).mockRejectedValueOnce(
      new Error('network failure'),
    );

    const service = new FirebaseImageStorageService(
      {} as any,
      OWNER_UID,
    );

    await expect(
      service.uploadImage({
        knowledgeItemId: KNOWLEDGE_ID,
        imageId: IMAGE_ID,
        blob: new Blob(['image'], { type: 'image/png' }),
      }),
    ).rejects.toMatchObject({
      code: 'upload_failed',
    });
  });

  it('resolves a transient URL only for an owned canonical path', async () => {
    const service = new FirebaseImageStorageService(
      {} as any,
      OWNER_UID,
    );

    await expect(
      service.resolveDownloadUrl(PATH),
    ).resolves.toBe(
      'https://example.invalid/transient-image-url',
    );

    expect(getDownloadURL).toHaveBeenCalledOnce();

    await expect(
      service.resolveDownloadUrl(
        `users/other-user/knowledgeImages/${KNOWLEDGE_ID}/${IMAGE_ID}`,
      ),
    ).rejects.toMatchObject({
      code: 'invalid_storage_path',
    });

    expect(getDownloadURL).toHaveBeenCalledOnce();
  });

  it('wraps download URL failures in a typed error', async () => {
    vi.mocked(getDownloadURL).mockRejectedValueOnce(
      new Error('download lookup failed'),
    );

    const service = new FirebaseImageStorageService(
      {} as any,
      OWNER_UID,
    );

    await expect(
      service.resolveDownloadUrl(PATH),
    ).rejects.toMatchObject({
      code: 'download_url_failed',
    });
  });

  it('wraps delete failures in a typed error', async () => {
    vi.mocked(deleteObject).mockRejectedValueOnce(
      new Error('delete failed'),
    );

    const service = new FirebaseImageStorageService(
      {} as any,
      OWNER_UID,
    );

    await expect(
      service.deleteImage(PATH),
    ).rejects.toMatchObject({
      code: 'delete_failed',
    });
  });

  it('deletes only an owned canonical path', async () => {
    const service = new FirebaseImageStorageService(
      {} as any,
      OWNER_UID,
    );

    await expect(
      service.deleteImage(PATH),
    ).resolves.toBeUndefined();

    expect(deleteObject).toHaveBeenCalledOnce();

    await expect(
      service.deleteImage(
        `users/${OWNER_UID}/knowledgeImages/${KNOWLEDGE_ID}/${OTHER_IMAGE_ID}/extra`,
      ),
    ).rejects.toMatchObject({
      code: 'invalid_storage_path',
    });

    expect(deleteObject).toHaveBeenCalledOnce();
  });
});
