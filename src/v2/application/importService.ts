import type { Repositories } from './types';
import type { ImportPayloadDraft } from '../import/importDraft';
import { validateAndNormalizeDraft } from '../import/transformDraft';
import { transformDraftToDomain, type TransformDraftResult } from '../import/transformDraft';
import { CANONICAL_TAXONOMY_REGISTRY } from './canonicalTaxonomy';
import { bootstrapUserRepositories } from './bootstrapService';
import { SEED_PACKETS } from './seedData';
import type { TaxonomyRegistry } from '../domain/taxonomy';
import type { KnowledgeItem } from '../domain/knowledge';

export type ImportDraftResult =
  | {
      ok: true;
      status: 'imported';
      result: TransformDraftResult;
    }
  | {
      ok: false;
      status: 'duplicate';
      existingKnowledgeItemId: string;
      fingerprint: string;
    };

export interface ImportResult {
  knowledgeItemId: string;
  cardIds: string[];
}

export interface SeedImportResult {
  accepted: number;
  skippedExisting: number;
  rejected: number;
  errors: string[];
  itemsSeeded: number;
  cardsSeeded: number;
}

export function computeItemFingerprint(
  domainId: string,
  topicId: string,
  subtopicId: string | undefined,
  title: string
): string {
  const d = (domainId || '').trim().toLowerCase();
  const t = (topicId || '').trim().toLowerCase();
  const s = (subtopicId || '').trim().toLowerCase();
  const ti = (title || '').trim().toLowerCase();
  return `${d}::${t}::${s}::${ti}`;
}

export async function findDuplicateKnowledgeItem(
  repos: Repositories,
  fingerprint: string
): Promise<KnowledgeItem | undefined> {
  const existingItems = await repos.knowledge.list();
  return existingItems.find((item) =>
    fingerprint === computeItemFingerprint(
      item.taxonomy.domainId,
      item.taxonomy.topicId,
      item.taxonomy.subtopicId,
      item.title
    )
  );
}

export interface ImportDraftPreview {
  title: string;
  taxonomy: {
    domainId: string;
    topicId: string;
    subtopicId?: string;
  };
  tags: string[];
  cardCount: number;
  cardTypeCounts: {
    free_recall: number;
    flashcard: number;
    mcq: number;
    true_false: number;
  };
  sourceCount: number;
}

export type ImportDraftInspection =
  | {
      ok: true;
      status: 'ready';
      fingerprint: string;
      preview: ImportDraftPreview;
      normalizedDraft: ImportPayloadDraft;
    }
  | {
      ok: false;
      status: 'duplicate';
      fingerprint: string;
      existingKnowledgeItemId: string;
      preview: ImportDraftPreview;
      normalizedDraft: ImportPayloadDraft;
    };

export class DuplicateImportError extends Error {
  readonly code = 'duplicate' as const;
  readonly fingerprint: string;
  readonly existingKnowledgeItemId: string;

  constructor(fingerprint: string, existingKnowledgeItemId: string) {
    super(`Duplicate import detected. A knowledge item with fingerprint '${fingerprint}' already exists.`);
    this.name = 'DuplicateImportError';
    this.fingerprint = fingerprint;
    this.existingKnowledgeItemId = existingKnowledgeItemId;
    Object.setPrototypeOf(this, DuplicateImportError.prototype);
  }
}

export function isDuplicateImportError(err: unknown): err is DuplicateImportError {
  if (err instanceof DuplicateImportError) return true;
  if (typeof err === 'object' && err !== null && (err as any).code === 'duplicate') return true;
  return false;
}

export async function inspectImportDraft(
  rawDraft: unknown,
  repos: Repositories,
  customRegistry?: TaxonomyRegistry
): Promise<ImportDraftInspection> {
  const registry = customRegistry ?? (await repos.taxonomy.get()) ?? CANONICAL_TAXONOMY_REGISTRY;
  const normalizedDraft = validateAndNormalizeDraft(rawDraft, registry);

  const fingerprint = computeItemFingerprint(
    normalizedDraft.item.taxonomy.domainId,
    normalizedDraft.item.taxonomy.topicId,
    normalizedDraft.item.taxonomy.subtopicId,
    normalizedDraft.item.title
  );

  const duplicateItem = await findDuplicateKnowledgeItem(repos, fingerprint);
  const existingKnowledgeItemId = duplicateItem?.id;

  const cardTypeCounts = {
    free_recall: 0,
    flashcard: 0,
    mcq: 0,
    true_false: 0,
  };

  for (const card of normalizedDraft.cards) {
    if (card.type in cardTypeCounts) {
      cardTypeCounts[card.type as keyof typeof cardTypeCounts]++;
    }
  }

  const preview: ImportDraftPreview = {
    title: normalizedDraft.item.title,
    taxonomy: {
      domainId: normalizedDraft.item.taxonomy.domainId,
      topicId: normalizedDraft.item.taxonomy.topicId,
      subtopicId: normalizedDraft.item.taxonomy.subtopicId,
    },
    tags: normalizedDraft.item.tags ?? [],
    cardCount: normalizedDraft.cards.length,
    cardTypeCounts,
    sourceCount: normalizedDraft.item.sources?.length ?? 0,
  };

  if (existingKnowledgeItemId) {
    return {
      ok: false,
      status: 'duplicate',
      fingerprint,
      existingKnowledgeItemId,
      preview,
      normalizedDraft,
    };
  }

  return {
    ok: true,
    status: 'ready',
    fingerprint,
    preview,
    normalizedDraft,
  };
}

export async function importDraftPayload(
  rawDraft: unknown,
  repos: Repositories,
  customRegistry?: TaxonomyRegistry
): Promise<ImportDraftResult> {
  const registry = customRegistry ?? (await repos.taxonomy.get()) ?? CANONICAL_TAXONOMY_REGISTRY;
  
  // Reuse inspect logic for schema validation and duplicate checking
  const inspection = await inspectImportDraft(rawDraft, repos, registry);
  
  if (!inspection.ok && inspection.status === 'duplicate') {
    return {
      ok: false,
      status: 'duplicate',
      existingKnowledgeItemId: inspection.existingKnowledgeItemId,
      fingerprint: inspection.fingerprint
    };
  }

  // Actually transform into domain entities (generates IDs)
  // Passing the normalized draft is perfectly safe, as parsing is idempotent
  const transformed = transformDraftToDomain(inspection.normalizedDraft, registry);

  // Persist knowledge item and all associated cards as an atomic bundle
  if (repos.knowledge.createKnowledgeBundle) {
    await repos.knowledge.createKnowledgeBundle(transformed.knowledgeItem, transformed.cards);
  } else {
    await repos.knowledge.createBundle(transformed.knowledgeItem, transformed.cards);
  }

  return {
    ok: true,
    status: 'imported',
    result: transformed
  };
}

export async function seedInitialLibrary(repos: Repositories): Promise<SeedImportResult> {
  await bootstrapUserRepositories(repos);

  const registry = (await repos.taxonomy.get()) ?? CANONICAL_TAXONOMY_REGISTRY;
  
  const existingItems = await repos.knowledge.list();
  const existingFingerprints = new Set<string>(
    existingItems.map((item) =>
      computeItemFingerprint(
        item.taxonomy.domainId,
        item.taxonomy.topicId,
        item.taxonomy.subtopicId,
        item.title
      )
    )
  );

  let accepted = 0;
  let cardsSeeded = 0;
  let skippedExisting = 0;
  let rejected = 0;
  const errors: string[] = [];

  for (const packet of SEED_PACKETS) {
    try {
      const draftItem = packet.item;
      if (draftItem) {
        const fp = computeItemFingerprint(
          draftItem.taxonomy.domainId,
          draftItem.taxonomy.topicId,
          draftItem.taxonomy.subtopicId,
          draftItem.title
        );
        if (existingFingerprints.has(fp)) {
          skippedExisting++;
          continue;
        }
      }

      const res = await importDraftPayload(packet, repos, registry);
      
      if (!res.ok) {
        skippedExisting++;
        continue;
      }

      const fp = computeItemFingerprint(
        res.result.knowledgeItem.taxonomy.domainId,
        res.result.knowledgeItem.taxonomy.topicId,
        res.result.knowledgeItem.taxonomy.subtopicId,
        res.result.knowledgeItem.title
      );
      existingFingerprints.add(fp);
      accepted++;
      cardsSeeded += res.result.cards.length;
    } catch (err) {
      rejected++;
      errors.push(err instanceof Error ? err.message : String(err));
    }
  }

  return {
    accepted,
    skippedExisting,
    rejected,
    errors,
    itemsSeeded: accepted,
    cardsSeeded,
  };
}
