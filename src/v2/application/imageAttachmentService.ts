import type { Repositories } from './types';
import {
  imageReferenceSchema,
  knowledgeItemSchema,
  type ImagePlacement,
  type ImageReference,
  type KnowledgeItem,
} from '../domain/knowledge';
import { generateId } from '../domain/id';

export interface ImageUploadRequest {
  knowledgeItemId: string;
  imageId: string;
  blob: Blob;
}

export interface ImageStorageGateway {
  uploadImage(input: ImageUploadRequest): Promise<string>;
  resolveDownloadUrl(storagePath: string): Promise<string>;
  deleteImage(storagePath: string): Promise<void>;
}

export type ImageAttachmentErrorCode =
  | 'item_not_found'
  | 'invalid_image_metadata'
  | 'target_card_not_found'
  | 'target_card_mismatch'
  | 'image_not_found'
  | 'metadata_persistence_failed'
  | 'storage_cleanup_failed';

export class ImageAttachmentError extends Error {
  readonly code: ImageAttachmentErrorCode;
  readonly causeValue?: unknown;
  readonly rollbackFailure?: unknown;

  constructor(
    code: ImageAttachmentErrorCode,
    message: string,
    causeValue?: unknown,
    rollbackFailure?: unknown,
  ) {
    super(message);
    this.name = 'ImageAttachmentError';
    this.code = code;
    this.causeValue = causeValue;
    this.rollbackFailure = rollbackFailure;
  }
}

export interface AttachImageInput {
  knowledgeItemId: string;
  blob: Blob;
  alt: string;
  caption?: string;
  placement: ImagePlacement;
  cardId?: string;
}

export class ImageAttachmentService {
  constructor(
    private readonly repos: Repositories,
    private readonly storage: ImageStorageGateway,
    private readonly now: () => string = () => new Date().toISOString(),
  ) {}

  private async requireItem(
    knowledgeItemId: string,
  ): Promise<KnowledgeItem> {
    const item = await this.repos.knowledge.get(knowledgeItemId);

    if (!item) {
      throw new ImageAttachmentError(
        'item_not_found',
        `KnowledgeItem "${knowledgeItemId}" was not found`,
      );
    }

    return item;
  }

  private async validateCardTarget(
    item: KnowledgeItem,
    image: ImageReference,
  ): Promise<void> {
    if (!image.cardId) {
      return;
    }

    const card = await this.repos.reviewCards.get(image.cardId);

    if (!card) {
      throw new ImageAttachmentError(
        'target_card_not_found',
        `ReviewCard "${image.cardId}" was not found`,
      );
    }

    if (card.knowledgeItemId !== item.id) {
      throw new ImageAttachmentError(
        'target_card_mismatch',
        'Target ReviewCard does not belong to the KnowledgeItem',
      );
    }
  }

  private parseImageReference(
    value: unknown,
  ): ImageReference {
    const parsed = imageReferenceSchema.safeParse(value);

    if (!parsed.success) {
      throw new ImageAttachmentError(
        'invalid_image_metadata',
        'Image metadata is invalid',
        parsed.error,
      );
    }

    return parsed.data;
  }

  async resolveImageUrl(storagePath: string): Promise<string> {
    return this.storage.resolveDownloadUrl(storagePath);
  }

  async attachImage(
    input: AttachImageInput,
  ): Promise<ImageReference> {
    const item = await this.requireItem(input.knowledgeItemId);
    const imageId = generateId();
    const updatedAt = this.now();

    // Validate all metadata that can be checked before uploading bytes.
    const pendingImage = this.parseImageReference({
      id: imageId,
      storagePath: 'pending-upload',
      alt: input.alt,
      caption: input.caption,
      placement: input.placement,
      cardId: input.cardId,
    });

    await this.validateCardTarget(item, pendingImage);

    // Validate the resulting KnowledgeItem before the upload as well.
    const pendingItem = knowledgeItemSchema.safeParse({
      ...item,
      images: [...(item.images ?? []), pendingImage],
      updatedAt,
    });

    if (!pendingItem.success) {
      throw new ImageAttachmentError(
        'invalid_image_metadata',
        'Image attachment would produce an invalid KnowledgeItem',
        pendingItem.error,
      );
    }

    const storagePath = await this.storage.uploadImage({
      knowledgeItemId: item.id,
      imageId,
      blob: input.blob,
    });

    let finalImage: ImageReference;
    let updatedItem: KnowledgeItem;

    try {
      finalImage = this.parseImageReference({
        ...pendingImage,
        storagePath,
      });

      updatedItem = knowledgeItemSchema.parse({
        ...item,
        images: [...(item.images ?? []), finalImage],
        updatedAt,
      });
    } catch (error) {
      let rollbackFailure: unknown;

      try {
        await this.storage.deleteImage(storagePath);
      } catch (cleanupError) {
        rollbackFailure = cleanupError;
      }

      if (error instanceof ImageAttachmentError) {
        throw new ImageAttachmentError(
          error.code,
          error.message,
          error.causeValue,
          rollbackFailure,
        );
      }

      throw new ImageAttachmentError(
        'invalid_image_metadata',
        'Uploaded image produced invalid attachment metadata',
        error,
        rollbackFailure,
      );
    }

    try {
      await this.repos.knowledge.update(updatedItem);
    } catch (error) {
      let rollbackFailure: unknown;

      try {
        await this.storage.deleteImage(storagePath);
      } catch (cleanupError) {
        rollbackFailure = cleanupError;
      }

      throw new ImageAttachmentError(
        'metadata_persistence_failed',
        'Image uploaded but KnowledgeItem metadata could not be persisted',
        error,
        rollbackFailure,
      );
    }

    return finalImage;
  }

  async removeImage(
    knowledgeItemId: string,
    imageId: string,
  ): Promise<void> {
    const item = await this.requireItem(knowledgeItemId);
    const image = item.images?.find(
      (candidate) => candidate.id === imageId,
    );

    if (!image) {
      throw new ImageAttachmentError(
        'image_not_found',
        `Image "${imageId}" was not attached to KnowledgeItem "${knowledgeItemId}"`,
      );
    }

    const remainingImages = (item.images ?? []).filter(
      (candidate) => candidate.id !== imageId,
    );

    const updatedItem = knowledgeItemSchema.parse({
      ...item,
      images:
        remainingImages.length > 0
          ? remainingImages
          : undefined,
      updatedAt: this.now(),
    });

    try {
      // Metadata first: never leave a KnowledgeItem pointing at a deleted object.
      await this.repos.knowledge.update(updatedItem);
    } catch (error) {
      throw new ImageAttachmentError(
        'metadata_persistence_failed',
        'Image metadata could not be removed',
        error,
      );
    }

    try {
      await this.storage.deleteImage(image.storagePath);
    } catch (error) {
      // The authoritative metadata is already removed. The remaining object
      // is an orphan and can be cleaned up later.
      throw new ImageAttachmentError(
        'storage_cleanup_failed',
        'Image metadata was removed but the Storage object could not be deleted',
        error,
      );
    }
  }
}
