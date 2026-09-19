import { generateId } from '../domain/id';
import { knowledgeItemSchema, type KnowledgeItem } from '../domain/knowledge';
import { reviewCardSchema, type ReviewCard } from '../domain/card';
import { cardStateSchema, type CardState } from '../domain/cardState';
import { createInitialCardState } from '../engine/fsrsAdapter';
import { validateTaxonomy, type TaxonomyRegistry } from '../domain/taxonomy';
import { importPayloadDraftSchema, type ImportPayloadDraft } from './importDraft';

export interface TransformDraftOptions {
  now?: Date;
  knowledgeIdGenerator?: () => string;
  cardIdGenerator?: () => string;
}

export interface TransformDraftResult {
  knowledgeItem: KnowledgeItem;
  cards: ReviewCard[];
  initialStates: CardState[];
}

/**
 * Validates and transforms an AI draft payload into fully validated
 * domain models with generated opaque unique identifiers.
 * 
 * Enforces:
 * - Strict structural schema validation (.strict() rejection of unknown keys)
 * - Controlled taxonomy validation against the supplied TaxonomyRegistry
 * - Domain entity validation (opaque IDs, suspension invariants, etc.)
 */
export function validateAndNormalizeDraft(
  rawDraft: unknown,
  registry: TaxonomyRegistry
): ImportPayloadDraft {
  const validatedDraft: ImportPayloadDraft = importPayloadDraftSchema.parse(rawDraft);
  const taxCheck = validateTaxonomy(
    validatedDraft.item.taxonomy,
    validatedDraft.item.tags,
    registry,
  );
  if (!taxCheck.valid) {
    throw new Error(`Controlled taxonomy validation failed: ${taxCheck.error}`);
  }
  return validatedDraft;
}

export function transformDraftToDomain(
  rawDraft: unknown,
  registry: TaxonomyRegistry,
  options: TransformDraftOptions = {},
): TransformDraftResult {
  const validatedDraft = validateAndNormalizeDraft(rawDraft, registry);

  const now = options.now ?? new Date();
  const timestampIso = now.toISOString();

  const generateKnowledgeId = options.knowledgeIdGenerator ?? generateId;
  const generateCardId = options.cardIdGenerator ?? generateId;

  const knowledgeItemId = generateKnowledgeId();

  const rawKnowledgeItem = {
    id: knowledgeItemId,
    schemaVersion: 1,
    title: validatedDraft.item.title,
    content: validatedDraft.item.content,
    explanationMarkdown: validatedDraft.item.explanationMarkdown,
    taxonomy: validatedDraft.item.taxonomy,
    tags: validatedDraft.item.tags,
    status: 'active' as const,
    createdAt: timestampIso,
    updatedAt: timestampIso,
    sources: validatedDraft.item.sources,
  };

  const knowledgeItem: KnowledgeItem = knowledgeItemSchema.parse(rawKnowledgeItem);

  const cards: ReviewCard[] = [];
  const initialStates: CardState[] = [];

  for (const cardDraft of validatedDraft.cards) {
    const cardId = generateCardId();
    let candidateCard: unknown;

    switch (cardDraft.type) {
      case 'free_recall':
        candidateCard = {
          id: cardId,
          knowledgeItemId,
          schemaVersion: 1,
          suspended: false,
          createdAt: timestampIso,
          updatedAt: timestampIso,
          type: 'free_recall',
          prompt: cardDraft.prompt,
          answerGuidance: cardDraft.answerGuidance,
        };
        break;

      case 'flashcard':
        candidateCard = {
          id: cardId,
          knowledgeItemId,
          schemaVersion: 1,
          suspended: false,
          createdAt: timestampIso,
          updatedAt: timestampIso,
          type: 'flashcard',
          front: cardDraft.front,
          back: cardDraft.back,
        };
        break;

      case 'mcq':
        candidateCard = {
          id: cardId,
          knowledgeItemId,
          schemaVersion: 1,
          suspended: false,
          createdAt: timestampIso,
          updatedAt: timestampIso,
          type: 'mcq',
          question: cardDraft.question,
          options: cardDraft.options,
          correctOptionIndex: cardDraft.correctOptionIndex,
          explanation: cardDraft.explanation,
        };
        break;

      case 'true_false':
        candidateCard = {
          id: cardId,
          knowledgeItemId,
          schemaVersion: 1,
          suspended: false,
          createdAt: timestampIso,
          updatedAt: timestampIso,
          type: 'true_false',
          statement: cardDraft.statement,
          isTrue: cardDraft.isTrue,
          explanation: cardDraft.explanation,
        };
        break;
    }

    const domainCard: ReviewCard = reviewCardSchema.parse(candidateCard);
    const initialState: CardState = cardStateSchema.parse(createInitialCardState(cardId, now));

    cards.push(domainCard);
    initialStates.push(initialState);
  }

  return {
    knowledgeItem,
    cards,
    initialStates,
  };
}
