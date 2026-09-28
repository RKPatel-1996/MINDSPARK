import { describe, expect, it } from 'vitest';
import {
  computeKnowledgeImportClaimId,
  decodeKnowledgeImportClaim,
} from '../persistence/importClaim';

describe('knowledge import claim identity', () => {
  it('derives deterministic lowercase SHA-256 hexadecimal IDs', async () => {
    expect(await computeKnowledgeImportClaimId('abc')).toBe(
      'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad'
    );

    expect(await computeKnowledgeImportClaimId('same fingerprint')).toBe(
      await computeKnowledgeImportClaimId('same fingerprint')
    );

    expect(
      await computeKnowledgeImportClaimId('same fingerprint')
    ).not.toBe(
      await computeKnowledgeImportClaimId('different fingerprint')
    );
  });

  it('accepts only the exact persisted claim shape', () => {
    const id = 'a'.repeat(64);
    const knowledgeItemId = '11111111-1111-4111-8111-111111111111';

    expect(
      decodeKnowledgeImportClaim(
        {
          id,
          knowledgeItemId,
          schemaVersion: 1,
        },
        id
      )
    ).toEqual({
      id,
      knowledgeItemId,
      schemaVersion: 1,
    });

    expect(
      decodeKnowledgeImportClaim(
        {
          id,
          knowledgeItemId,
          schemaVersion: 1,
          extra: true,
        },
        id
      )
    ).toBeNull();

    expect(
      decodeKnowledgeImportClaim(
        {
          id: 'b'.repeat(64),
          knowledgeItemId,
          schemaVersion: 1,
        },
        id
      )
    ).toBeNull();
  });
});
