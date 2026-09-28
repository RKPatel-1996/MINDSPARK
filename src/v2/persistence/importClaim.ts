export const KNOWLEDGE_IMPORT_CLAIM_SCHEMA_VERSION = 1 as const;

export interface KnowledgeImportClaim {
  id: string;
  knowledgeItemId: string;
  schemaVersion: typeof KNOWLEDGE_IMPORT_CLAIM_SCHEMA_VERSION;
}

const SHA256_HEX_PATTERN = /^[0-9a-f]{64}$/;

export async function computeKnowledgeImportClaimId(
  fingerprint: string
): Promise<string> {
  const subtle = globalThis.crypto?.subtle;

  if (!subtle) {
    throw new Error(
      'Web Crypto SHA-256 is unavailable for import uniqueness authority.'
    );
  }

  const bytes = new TextEncoder().encode(fingerprint);
  const digest = await subtle.digest('SHA-256', bytes);

  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, '0')
  ).join('');
}

export function decodeKnowledgeImportClaim(
  value: unknown,
  expectedId?: string
): KnowledgeImportClaim | null {
  if (typeof value !== 'object' || value === null) {
    return null;
  }

  const candidate = value as Record<string, unknown>;

  if (
    typeof candidate.id !== 'string' ||
    !SHA256_HEX_PATTERN.test(candidate.id) ||
    typeof candidate.knowledgeItemId !== 'string' ||
    candidate.schemaVersion !== KNOWLEDGE_IMPORT_CLAIM_SCHEMA_VERSION
  ) {
    return null;
  }

  const keys = Object.keys(candidate).sort();

  if (
    keys.length !== 3 ||
    keys[0] !== 'id' ||
    keys[1] !== 'knowledgeItemId' ||
    keys[2] !== 'schemaVersion'
  ) {
    return null;
  }

  if (expectedId !== undefined && candidate.id !== expectedId) {
    return null;
  }

  return {
    id: candidate.id,
    knowledgeItemId: candidate.knowledgeItemId,
    schemaVersion: KNOWLEDGE_IMPORT_CLAIM_SCHEMA_VERSION,
  };
}
