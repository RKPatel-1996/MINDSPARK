import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Repositories } from '../types';
import {
  ImageAttachmentError,
  ImageAttachmentService,
  type ImageStorageGateway,
} from '../imageAttachmentService';
import type {
  ImageReference,
  KnowledgeItem,
} from '../../domain/knowledge';

const ITEM_ID =
  '11111111-1111-4111-8111-111111111111';
const OTHER_ITEM_ID =
  '22222222-2222-4222-8222-222222222222';
const CARD_ID =
  '33333333-3333-4333-8333-333333333333';
const IMAGE_ID =
  '44444444-4444-4444-8444-444444444444';

const NOW = '2026-09-19T12:00:00.000Z';

const BASE_ITEM: KnowledgeItem = {
  id: ITEM_ID,
  schemaVersion: 1,
  title: 'Image test item',
  content: 'Knowledge content',
  taxonomy: {
    domainId: 'computing',
    topicId: 'linux',
    subtopicId: 'shell',
  },
  status: 'active',
  createdAt: '2026-09-18T12:00:00.000Z',
  updatedAt: '2026-09-18T12:00:00.000Z',
};

function makeHarness(item: KnowledgeItem = BASE_ITEM) {
  const knowledgeGet = vi.fn().mockResolvedValue(item);
  const knowledgeUpdate = vi.fn().mockResolvedValue(undefined);
  const cardGet = vi.fn().mockResolvedValue(null);

  const repos = {
    knowledge: {
      get: knowledgeGet,
      update: knowledgeUpdate,
    },
    reviewCards: {
      get: cardGet,
    },
  } as unknown as Repositories;

  const uploadImage = vi.fn(
    async ({
      knowledgeItemId,
      imageId,
    }: {
      knowledgeItemId: string;
      imageId: string;
    }) =>
      `users/owner/knowledgeImages/${knowledgeItemId}/${imageId}`,
  );

  const deleteImage = vi.fn().mockResolvedValue(undefined);

  const storage: ImageStorageGateway = {
    uploadImage,
    deleteImage,
  };

  const service = new ImageAttachmentService(
    repos,
    storage,
    () => NOW,
  );

  return {
    service,
    knowledgeGet,
    knowledgeUpdate,
    cardGet,
    uploadImage,
    deleteImage,
  };
}

describe('ImageAttachmentService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('uploads then persists a content ImageReference', async () => {
    const h = makeHarness();

    const image = await h.service.attachImage({
      knowledgeItemId: ITEM_ID,
      blob: new Blob(['image'], { type: 'image/png' }),
      alt: 'Terminal screenshot',
      placement: 'content',
    });

    expect(image.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );

    expect(image).toMatchObject({
      alt: 'Terminal screenshot',
      placement: 'content',
    });

    expect(h.uploadImage).toHaveBeenCalledOnce();
    expect(h.knowledgeUpdate).toHaveBeenCalledOnce();

    const persisted = h.knowledgeUpdate.mock.calls[0][0] as KnowledgeItem;
    expect(persisted.images).toEqual([image]);
    expect(persisted.updatedAt).toBe(NOW);

    expect(
      h.uploadImage.mock.invocationCallOrder[0],
    ).toBeLessThan(
      h.knowledgeUpdate.mock.invocationCallOrder[0],
    );
  });

  it('allows a review image targeted to a card belonging to the item', async () => {
    const h = makeHarness();

    h.cardGet.mockResolvedValue({
      id: CARD_ID,
      knowledgeItemId: ITEM_ID,
    });

    const image = await h.service.attachImage({
      knowledgeItemId: ITEM_ID,
      blob: new Blob(['image'], { type: 'image/webp' }),
      alt: 'Review diagram',
      placement: 'review_prompt',
      cardId: CARD_ID,
    });

    expect(h.cardGet).toHaveBeenCalledWith(CARD_ID);
    expect(image.cardId).toBe(CARD_ID);
    expect(h.uploadImage).toHaveBeenCalledOnce();
  });

  it('rejects content images that target a specific card before upload', async () => {
    const h = makeHarness();

    await expect(
      h.service.attachImage({
        knowledgeItemId: ITEM_ID,
        blob: new Blob(['image'], { type: 'image/png' }),
        alt: 'Invalid target',
        placement: 'content',
        cardId: CARD_ID,
      }),
    ).rejects.toMatchObject({
      code: 'invalid_image_metadata',
    });

    expect(h.uploadImage).not.toHaveBeenCalled();
    expect(h.knowledgeUpdate).not.toHaveBeenCalled();
  });

  it('rejects missing and cross-item card targets before upload', async () => {
    const missing = makeHarness();

    await expect(
      missing.service.attachImage({
        knowledgeItemId: ITEM_ID,
        blob: new Blob(['image'], { type: 'image/png' }),
        alt: 'Missing card',
        placement: 'review_answer',
        cardId: CARD_ID,
      }),
    ).rejects.toMatchObject({
      code: 'target_card_not_found',
    });

    expect(missing.uploadImage).not.toHaveBeenCalled();

    const mismatch = makeHarness();

    mismatch.cardGet.mockResolvedValue({
      id: CARD_ID,
      knowledgeItemId: OTHER_ITEM_ID,
    });

    await expect(
      mismatch.service.attachImage({
        knowledgeItemId: ITEM_ID,
        blob: new Blob(['image'], { type: 'image/png' }),
        alt: 'Wrong item',
        placement: 'review_answer',
        cardId: CARD_ID,
      }),
    ).rejects.toMatchObject({
      code: 'target_card_mismatch',
    });

    expect(mismatch.uploadImage).not.toHaveBeenCalled();
  });

  it('rolls back the uploaded object when metadata persistence fails', async () => {
    const h = makeHarness();

    h.knowledgeUpdate.mockRejectedValueOnce(
      new Error('Firestore failed'),
    );

    await expect(
      h.service.attachImage({
        knowledgeItemId: ITEM_ID,
        blob: new Blob(['image'], { type: 'image/jpeg' }),
        alt: 'Rollback image',
        placement: 'content',
      }),
    ).rejects.toMatchObject({
      code: 'metadata_persistence_failed',
    });

    expect(h.uploadImage).toHaveBeenCalledOnce();
    expect(h.deleteImage).toHaveBeenCalledOnce();
  });

  it('preserves rollback failure detail without hiding metadata persistence failure', async () => {
    const h = makeHarness();

    h.knowledgeUpdate.mockRejectedValueOnce(
      new Error('Firestore failed'),
    );
    h.deleteImage.mockRejectedValueOnce(
      new Error('Storage cleanup failed'),
    );

    try {
      await h.service.attachImage({
        knowledgeItemId: ITEM_ID,
        blob: new Blob(['image'], { type: 'image/png' }),
        alt: 'Rollback failure',
        placement: 'content',
      });

      throw new Error('Expected attachImage to reject');
    } catch (error) {
      expect(error).toBeInstanceOf(ImageAttachmentError);
      expect(error).toMatchObject({
        code: 'metadata_persistence_failed',
      });
      expect(
        (error as ImageAttachmentError).rollbackFailure,
      ).toBeInstanceOf(Error);
    }
  });

  it('removes metadata before deleting the Storage object', async () => {
    const image: ImageReference = {
      id: IMAGE_ID,
      storagePath:
        `users/owner/knowledgeImages/${ITEM_ID}/${IMAGE_ID}`,
      alt: 'Attached image',
      placement: 'content',
    };

    const h = makeHarness({
      ...BASE_ITEM,
      images: [image],
    });

    await h.service.removeImage(ITEM_ID, IMAGE_ID);

    expect(h.knowledgeUpdate).toHaveBeenCalledOnce();
    expect(h.deleteImage).toHaveBeenCalledWith(
      image.storagePath,
    );

    const persisted = h.knowledgeUpdate.mock.calls[0][0] as KnowledgeItem;
    expect(persisted.images).toBeUndefined();

    expect(
      h.knowledgeUpdate.mock.invocationCallOrder[0],
    ).toBeLessThan(
      h.deleteImage.mock.invocationCallOrder[0],
    );
  });

  it('does not delete Storage bytes when metadata removal fails', async () => {
    const image: ImageReference = {
      id: IMAGE_ID,
      storagePath:
        `users/owner/knowledgeImages/${ITEM_ID}/${IMAGE_ID}`,
      alt: 'Attached image',
      placement: 'content',
    };

    const h = makeHarness({
      ...BASE_ITEM,
      images: [image],
    });

    h.knowledgeUpdate.mockRejectedValueOnce(
      new Error('Firestore failed'),
    );

    await expect(
      h.service.removeImage(ITEM_ID, IMAGE_ID),
    ).rejects.toMatchObject({
      code: 'metadata_persistence_failed',
    });

    expect(h.deleteImage).not.toHaveBeenCalled();
  });

  it('reports cleanup failure after metadata has already been removed', async () => {
    const image: ImageReference = {
      id: IMAGE_ID,
      storagePath:
        `users/owner/knowledgeImages/${ITEM_ID}/${IMAGE_ID}`,
      alt: 'Attached image',
      placement: 'content',
    };

    const h = makeHarness({
      ...BASE_ITEM,
      images: [image],
    });

    h.deleteImage.mockRejectedValueOnce(
      new Error('Storage unavailable'),
    );

    await expect(
      h.service.removeImage(ITEM_ID, IMAGE_ID),
    ).rejects.toMatchObject({
      code: 'storage_cleanup_failed',
    });

    expect(h.knowledgeUpdate).toHaveBeenCalledOnce();
  });

  it('rejects a missing image without mutating metadata or Storage', async () => {
    const h = makeHarness();

    await expect(
      h.service.removeImage(ITEM_ID, IMAGE_ID),
    ).rejects.toMatchObject({
      code: 'image_not_found',
    });

    expect(h.knowledgeUpdate).not.toHaveBeenCalled();
    expect(h.deleteImage).not.toHaveBeenCalled();
  });
});
