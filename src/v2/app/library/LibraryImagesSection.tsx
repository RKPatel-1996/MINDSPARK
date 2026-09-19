import React, { useEffect, useRef, useState } from 'react';
import type { ReviewCard } from '../../domain/card';
import type {
  ImagePlacement,
  ImageReference,
  KnowledgeItem,
} from '../../domain/knowledge';
import {
  ImageAttachmentError,
  type ImageAttachmentService,
} from '../../application/imageAttachmentService';

interface LibraryImagesSectionProps {
  item: KnowledgeItem;
  cards: ReviewCard[];
  service: ImageAttachmentService | null;
  isReadOnly: boolean;
  onImagesChanged: (images: ImageReference[] | undefined) => void;
}

const PLACEMENT_OPTIONS: Array<{
  value: ImagePlacement;
  label: string;
}> = [
  { value: 'content', label: 'Content' },
  { value: 'review_prompt', label: 'Review prompt' },
  { value: 'review_answer', label: 'Review answer' },
];

function placementLabel(placement: ImagePlacement): string {
  return PLACEMENT_OPTIONS.find(
    (option) => option.value === placement,
  )?.label ?? placement;
}

export const LibraryImagesSection: React.FC<
  LibraryImagesSectionProps
> = ({
  item,
  cards,
  service,
  isReadOnly,
  onImagesChanged,
}) => {
  const images = item.images ?? [];

  const [urls, setUrls] = useState<Record<string, string>>({});
  const [showAddForm, setShowAddForm] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [alt, setAlt] = useState('');
  const [caption, setCaption] = useState('');
  const [placement, setPlacement] =
    useState<ImagePlacement>('content');
  const [cardId, setCardId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [removingImageId, setRemovingImageId] =
    useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    let active = true;

    if (!service || images.length === 0) {
      setUrls({});
      return () => {
        active = false;
      };
    }

    void Promise.all(
      images.map(async (image) => {
        try {
          const url = await service.resolveImageUrl(
            image.storagePath,
          );
          return [image.id, url] as const;
        } catch {
          return null;
        }
      }),
    ).then((resolved) => {
      if (!active) return;

      const next: Record<string, string> = {};
      for (const entry of resolved) {
        if (entry) {
          next[entry[0]] = entry[1];
        }
      }
      setUrls(next);
    });

    return () => {
      active = false;
    };
  }, [service, item.images]);

  const resetAddForm = () => {
    setFile(null);
    setAlt('');
    setCaption('');
    setPlacement('content');
    setCardId('');
    setError(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleAttach = async () => {
    if (!service) {
      setError('Image storage is unavailable in this mode.');
      return;
    }

    if (!file) {
      setError('Choose an image file.');
      return;
    }

    if (!alt.trim()) {
      setError('Alt text is required.');
      return;
    }

    setError(null);
    setIsAdding(true);

    try {
      const image = await service.attachImage({
        knowledgeItemId: item.id,
        blob: file,
        alt: alt.trim(),
        caption: caption.trim() || undefined,
        placement,
        cardId:
          placement === 'content'
            ? undefined
            : cardId || undefined,
      });

      onImagesChanged([
        ...images,
        image,
      ]);

      resetAddForm();
      setShowAddForm(false);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : String(err),
      );
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemove = async (image: ImageReference) => {
    if (!service) {
      setError('Image storage is unavailable in this mode.');
      return;
    }

    setError(null);
    setRemovingImageId(image.id);

    try {
      await service.removeImage(item.id, image.id);

      const remaining = images.filter(
        (candidate) => candidate.id !== image.id,
      );

      onImagesChanged(
        remaining.length > 0 ? remaining : undefined,
      );
    } catch (err) {
      if (
        err instanceof ImageAttachmentError &&
        err.code === 'storage_cleanup_failed'
      ) {
        // Metadata removal already succeeded. Keep the UI aligned with
        // authoritative KnowledgeItem state while surfacing orphan cleanup.
        const remaining = images.filter(
          (candidate) => candidate.id !== image.id,
        );

        onImagesChanged(
          remaining.length > 0 ? remaining : undefined,
        );
      }

      setError(
        err instanceof Error ? err.message : String(err),
      );
    } finally {
      setRemovingImageId(null);
    }
  };

  const storageAvailable = service !== null;
  const mutationDisabled = isReadOnly || !storageAvailable;

  return (
    <section data-testid="library-images-section">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h4 className="text-xs font-semibold text-[var(--muted-color)] uppercase tracking-wider font-ui">
          Images ({images.length})
        </h4>

        <button
          type="button"
          onClick={() => {
            if (!mutationDisabled) {
              setShowAddForm((current) => !current);
              setError(null);
            }
          }}
          disabled={mutationDisabled}
          title={
            !storageAvailable
              ? 'Image storage unavailable in this mode'
              : undefined
          }
          className="px-3 py-1.5 text-xs font-medium font-ui rounded-lg border border-[var(--border-color)] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[var(--elevated-color)]"
        >
          Add image
        </button>
      </div>

      {!storageAvailable && (
        <p className="mb-3 text-xs text-[var(--muted-color)] font-ui">
          Image storage is unavailable in this mode.
        </p>
      )}

      {error && (
        <div
          role="alert"
          className="mb-3 p-3 rounded-xl border border-[var(--color-error)] bg-[var(--color-soft-error)] text-xs text-[var(--color-error)] font-ui"
        >
          {error}
        </div>
      )}

      {showAddForm && !mutationDisabled && (
        <div
          data-testid="image-add-form"
          className="mb-4 space-y-3 p-4 rounded-xl border border-[var(--border-color)] bg-[var(--elevated-color)]"
        >
          <div>
            <label
              htmlFor="knowledge-image-file"
              className="block mb-1 text-xs font-semibold text-[var(--muted-color)] font-ui"
            >
              Image file
            </label>
            <input
              ref={fileInputRef}
              id="knowledge-image-file"
              aria-label="Image file"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(event) => {
                setFile(event.target.files?.[0] ?? null);
                setError(null);
              }}
              className="block w-full text-sm font-ui"
            />
          </div>

          <div>
            <label
              htmlFor="knowledge-image-alt"
              className="block mb-1 text-xs font-semibold text-[var(--muted-color)] font-ui"
            >
              Alt text
            </label>
            <input
              id="knowledge-image-alt"
              aria-label="Alt text"
              type="text"
              value={alt}
              onChange={(event) => setAlt(event.target.value)}
              className="w-full p-2.5 rounded-lg border border-[var(--border-color)] bg-[var(--bg-color)] text-sm font-ui"
            />
          </div>

          <div>
            <label
              htmlFor="knowledge-image-caption"
              className="block mb-1 text-xs font-semibold text-[var(--muted-color)] font-ui"
            >
              Caption (optional)
            </label>
            <input
              id="knowledge-image-caption"
              aria-label="Caption"
              type="text"
              value={caption}
              onChange={(event) =>
                setCaption(event.target.value)
              }
              className="w-full p-2.5 rounded-lg border border-[var(--border-color)] bg-[var(--bg-color)] text-sm font-ui"
            />
          </div>

          <div>
            <label
              htmlFor="knowledge-image-placement"
              className="block mb-1 text-xs font-semibold text-[var(--muted-color)] font-ui"
            >
              Placement
            </label>
            <select
              id="knowledge-image-placement"
              aria-label="Placement"
              value={placement}
              onChange={(event) => {
                const next =
                  event.target.value as ImagePlacement;
                setPlacement(next);

                if (next === 'content') {
                  setCardId('');
                }
              }}
              className="w-full p-2.5 rounded-lg border border-[var(--border-color)] bg-[var(--bg-color)] text-sm font-ui"
            >
              {PLACEMENT_OPTIONS.map((option) => (
                <option
                  key={option.value}
                  value={option.value}
                >
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {placement !== 'content' && (
            <div>
              <label
                htmlFor="knowledge-image-card"
                className="block mb-1 text-xs font-semibold text-[var(--muted-color)] font-ui"
              >
                Review card (optional)
              </label>
              <select
                id="knowledge-image-card"
                aria-label="Review card"
                value={cardId}
                onChange={(event) =>
                  setCardId(event.target.value)
                }
                className="w-full p-2.5 rounded-lg border border-[var(--border-color)] bg-[var(--bg-color)] text-sm font-ui"
              >
                <option value="">All cards</option>
                {cards.map((card, index) => (
                  <option key={card.id} value={card.id}>
                    Card {index + 1}: {card.type.replace('_', ' ')}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={handleAttach}
              disabled={isAdding}
              className="px-4 py-2 rounded-lg bg-[var(--color-action-primary-bg)] text-[var(--color-action-primary-text)] text-sm font-medium font-ui disabled:opacity-50"
            >
              {isAdding ? 'Adding…' : 'Attach image'}
            </button>

            <button
              type="button"
              onClick={() => {
                resetAddForm();
                setShowAddForm(false);
              }}
              disabled={isAdding}
              className="px-4 py-2 rounded-lg border border-[var(--border-color)] text-sm font-medium font-ui disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {images.length === 0 ? (
        <p className="text-sm text-[var(--muted-color)] font-content">
          No images attached.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {images.map((image) => {
            const targetCardIndex = image.cardId
              ? cards.findIndex(
                  (card) => card.id === image.cardId,
                )
              : -1;

            return (
              <article
                key={image.id}
                data-testid={`library-image-${image.id}`}
                className="overflow-hidden rounded-xl border border-[var(--border-color)] bg-[var(--elevated-color)]"
              >
                {urls[image.id] ? (
                  <img
                    src={urls[image.id]}
                    alt={image.alt}
                    className="w-full h-40 object-contain bg-[var(--bg-color)]"
                  />
                ) : (
                  <div className="h-40 flex items-center justify-center p-4 bg-[var(--bg-color)] text-xs text-center text-[var(--muted-color)] font-ui">
                    {image.alt}
                  </div>
                )}

                <div className="p-3 space-y-2">
                  <div>
                    <p className="text-sm font-medium font-ui">
                      {image.alt}
                    </p>

                    {image.caption && (
                      <p className="mt-1 text-xs text-[var(--muted-color)] font-content">
                        {image.caption}
                      </p>
                    )}
                  </div>

                  <div className="text-xs text-[var(--muted-color)] font-ui">
                    {placementLabel(image.placement)}
                    {image.cardId && (
                      <>
                        {' · '}
                        {targetCardIndex >= 0
                          ? `Card ${targetCardIndex + 1}`
                          : 'Targeted card'}
                      </>
                    )}
                    {!image.cardId &&
                      image.placement !== 'content' && (
                        <> · All cards</>
                      )}
                  </div>

                  <button
                    type="button"
                    onClick={() => void handleRemove(image)}
                    disabled={
                      mutationDisabled ||
                      removingImageId === image.id
                    }
                    className="text-xs font-medium text-[var(--color-error)] font-ui disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {removingImageId === image.id
                      ? 'Removing…'
                      : 'Remove'}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
};
