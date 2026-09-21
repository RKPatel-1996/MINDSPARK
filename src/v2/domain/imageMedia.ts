export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export const ALLOWED_IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const;

export type AllowedImageMimeType =
  (typeof ALLOWED_IMAGE_MIME_TYPES)[number];

export function isAllowedImageMimeType(
  value: string,
): value is AllowedImageMimeType {
  return ALLOWED_IMAGE_MIME_TYPES.includes(
    value as AllowedImageMimeType,
  );
}
