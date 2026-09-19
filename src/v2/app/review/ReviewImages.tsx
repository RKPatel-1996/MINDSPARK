import React, { useEffect, useMemo, useState } from 'react';
import type { ImageReference } from '../../domain/knowledge';
import type { ImageAttachmentService } from '../../application/imageAttachmentService';

type ReviewImagePlacement = 'review_prompt' | 'review_answer';

interface ReviewImagesProps {
  images: ImageReference[] | undefined;
  placement: ReviewImagePlacement;
  cardId: string;
  service: ImageAttachmentService | null;
}

export const ReviewImages: React.FC<ReviewImagesProps> = ({
  images,
  placement,
  cardId,
  service,
}) => {
  const visibleImages = useMemo(
    () =>
      (images ?? []).filter(
        (image) =>
          image.placement === placement &&
          (!image.cardId || image.cardId === cardId),
      ),
    [images, placement, cardId],
  );

  const [urls, setUrls] = useState<Record<string, string>>({});

  useEffect(() => {
    let active = true;

    setUrls({});

    if (!service || visibleImages.length === 0) {
      return () => {
        active = false;
      };
    }

    void Promise.all(
      visibleImages.map(async (image) => {
        try {
          const url = await service.resolveImageUrl(image.storagePath);
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
  }, [service, visibleImages]);

  if (visibleImages.length === 0) {
    return null;
  }

  return (
    <div
      data-testid={`review-images-${placement}`}
      className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3"
    >
      {visibleImages.map((image) => (
        <figure
          key={image.id}
          className="overflow-hidden rounded-xl border border-[var(--border-color)] bg-[var(--elevated-color)]"
        >
          {urls[image.id] ? (
            <img
              src={urls[image.id]}
              alt={image.alt}
              className="w-full max-h-80 object-contain bg-[var(--bg-color)]"
            />
          ) : (
            <div className="min-h-32 flex items-center justify-center p-4 text-sm text-center text-[var(--muted-color)] font-content bg-[var(--bg-color)]">
              {image.alt}
            </div>
          )}

          {image.caption && (
            <figcaption className="p-3 text-xs text-[var(--muted-color)] font-content">
              {image.caption}
            </figcaption>
          )}
        </figure>
      ))}
    </div>
  );
};
