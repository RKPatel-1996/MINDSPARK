import { z } from 'zod';

/**
 * MindSpark V2 Opaque Identifier Utility
 * 
 * V2 Architectural Rule:
 * IDs must be opaque UUIDs. Do not encode taxonomy, card type, dates, difficulty,
 * or semantic information into IDs. AI-generated imports must not be trusted
 * to create unique IDs.
 * 
 * Cryptographic security:
 * Must use globalThis.crypto.randomUUID() or crypto.getRandomValues().
 * Never silently degrade to Math.random(). Throws if no secure RNG is available.
 */

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const opaqueIdSchema = z.string().regex(UUID_REGEX, {
  message: 'Identifier must be an opaque, valid UUID',
});

export type OpaqueId = z.infer<typeof opaqueIdSchema>;

export function generateId(): string {
  const c = typeof globalThis !== 'undefined' ? globalThis.crypto : undefined;
  if (!c) {
    throw new Error('Cryptographically secure RNG unavailable in current environment');
  }

  if (typeof c.randomUUID === 'function') {
    return c.randomUUID();
  }

  if (typeof c.getRandomValues === 'function') {
    const bytes = new Uint8Array(16);
    c.getRandomValues(bytes);
    // UUID v4 format: set version to 4 and variant to RFC4122 (10xx)
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
  }

  throw new Error('Cryptographically secure RNG unavailable in current environment');
}

export function isValidId(id: unknown): boolean {
  if (typeof id !== 'string' || id.length === 0) {
    return false;
  }
  return UUID_REGEX.test(id);
}
