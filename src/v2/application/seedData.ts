import canonicalSeedPackets from './canonicalSeedPackets.json';
import type { ImportPayloadDraft } from '../import/importDraft';

export const SEED_PACKETS: ImportPayloadDraft[] = canonicalSeedPackets as unknown as ImportPayloadDraft[];
