import { describe, it, expect } from 'vitest';
import { Timestamp } from 'firebase/firestore';
import { transformDraftToDomain } from '../import/transformDraft';
import canonicalSeedPackets from '../application/canonicalSeedPackets.json';
import { applyReviewToCard } from '../reconciliation/reviewApplication';
import { CANONICAL_TAXONOMY_REGISTRY } from '../application/canonicalTaxonomy';
import { DEFAULT_PARAMETER_SET } from '../domain/schedulerParameterSet';
import { DEFAULT_SETTINGS } from '../application/bootstrapService';
import { generateId } from '../domain/id';
import type { ReviewCard } from '../domain/card';
import type { CardState } from '../domain/cardState';
import type { KnowledgeItem } from '../domain/knowledge';
import {
  sanitizeFirestoreDto,
  mapKnowledgeItemToDTO,
  mapDTOToKnowledgeItem,
  mapReviewCardToDTO,
  mapReviewEventToDTO,
  mapTaxonomyToDTO,
  mapSchedulerParameterSetToDTO,
  mapSettingsToDTO,
} from '../persistence/firebase/mappers/domainMappers';

function containsUndefinedValues(val: any): { found: boolean; path: string } {
  if (val === undefined) {
    return { found: true, path: 'root' };
  }
  if (val === null || typeof val !== 'object') {
    return { found: false, path: '' };
  }
  if (val instanceof Timestamp || val instanceof Date) {
    return { found: false, path: '' };
  }
  if (Array.isArray(val)) {
    for (let i = 0; i < val.length; i++) {
      if (val[i] === undefined) {
        return { found: true, path: `[${i}]` };
      }
      const res = containsUndefinedValues(val[i]);
      if (res.found) {
        return { found: true, path: `[${i}].${res.path}` };
      }
    }
    return { found: false, path: '' };
  }
  for (const [k, v] of Object.entries(val)) {
    if (v === undefined) {
      return { found: true, path: k };
    }
    const res = containsUndefinedValues(v);
    if (res.found) {
      return { found: true, path: `${k}.${res.path}` };
    }
  }
  return { found: false, path: '' };
}

describe('Firestore DTO Safety & Sanitation', () => {
  it('round-trips content blocks while keeping legacy KnowledgeItems without blocks readable', () => {
    const legacyItem: KnowledgeItem = {
      id: generateId(),
      schemaVersion: 1,
      title: 'Shell redirection',
      content: 'Redirect standard output with >.',
      taxonomy: {
        domainId: 'computing',
        topicId: 'linux',
        subtopicId: 'shell',
      },
      status: 'active',
      createdAt: '2026-09-15T10:00:00.000Z',
      updatedAt: '2026-09-15T10:00:00.000Z',
    };

    const legacyDto = mapKnowledgeItemToDTO(legacyItem);
    expect(legacyDto).not.toHaveProperty('blocks');
    expect(mapDTOToKnowledgeItem(legacyDto).blocks).toBeUndefined();

    const blocks: NonNullable<KnowledgeItem['blocks']> = [
      { type: 'text', content: 'Preserve this order.' },
      { type: 'code', language: 'bash', content: "printf 'a\n  b\n'" },
      { type: 'math', content: String.raw`x^2 + y^2 = z^2` },
    ];
    const blockItem: KnowledgeItem = { ...legacyItem, blocks };
    const blockDto = mapKnowledgeItemToDTO(blockItem);

    expect(blockDto.blocks).toEqual(blocks);
    expect(mapDTOToKnowledgeItem(blockDto).blocks).toEqual(blocks);
  });
  it('transformDraftToDomain() on canonical seed packets produces Firestore DTOs containing no undefined values', () => {
    expect(canonicalSeedPackets.length).toBeGreaterThan(0);

    for (const rawPacket of canonicalSeedPackets) {
      const { knowledgeItem, cards } = transformDraftToDomain(rawPacket, CANONICAL_TAXONOMY_REGISTRY);
      const dto = mapKnowledgeItemToDTO(knowledgeItem);
      const check = containsUndefinedValues(dto);
      expect(check.found, `Found undefined at path: ${check.path}`).toBe(false);

      // Verify sources is completely omitted if undefined
      if (knowledgeItem.sources === undefined) {
        expect('sources' in dto).toBe(false);
      }

      // Also verify all card DTOs for this item
      for (const card of cards) {
        const cardDto = mapReviewCardToDTO(card);
        const cardCheck = containsUndefinedValues(cardDto);
        expect(cardCheck.found, `Card found undefined at path: ${cardCheck.path}`).toBe(false);
      }
    }
  });

  it('applyReviewToCard() with no durationMs produces a Firestore ReviewEvent DTO containing no undefined values', () => {
    const cardId = generateId();
    const knowledgeItemId = generateId();
    const card: ReviewCard = {
      id: cardId,
      knowledgeItemId: knowledgeItemId,
      type: 'flashcard',
      front: 'Question',
      back: 'Answer',
      suspended: false,
      schemaVersion: 1,
      createdAt: '2026-09-15T10:00:00.000Z',
      updatedAt: '2026-09-15T10:00:00.000Z',
    };

    const initialState: CardState = {
      cardId: card.id,
      state: 'new',
      due: '2026-09-15T10:00:00.000Z',
      stability: 0,
      difficulty: 0,
      elapsedDays: 0,
      scheduledDays: 0,
      reps: 0,
      lapses: 0,
      learningSteps: 0,
      schemaVersion: 1,
    };

    // Perform review without durationMs
    const result = applyReviewToCard({
      card,
      currentState: initialState,
      rating: 'good',
      reviewTimestamp: '2026-09-15T10:00:00.000Z',
      parameterSet: DEFAULT_PARAMETER_SET,
      desiredRetention: 0.90,
      objectiveCorrect: null,
      guessedOrStruggled: false,
      deviceId: 'test-device',
      schemaVersion: 1,
      // durationMs intentionally omitted (undefined)
    });

    expect(result.event.durationMs).toBeUndefined();

    const eventDto = mapReviewEventToDTO(result.event);
    const check = containsUndefinedValues(eventDto);
    expect(check.found, `ReviewEvent DTO found undefined at path: ${check.path}`).toBe(false);

    // durationMs must be omitted from DTO
    expect('durationMs' in eventDto).toBe(false);

    // objectiveCorrect must remain null, NOT omitted or transformed
    expect(eventDto.objectiveCorrect).toBeNull();
  });

  it('nested optional properties are omitted rather than serialized as undefined', () => {
    const rawObject = {
      id: 'item-1',
      title: 'Test',
      sources: undefined,
      nested: {
        presentField: 'hello',
        optionalField: undefined,
        deep: {
          anotherUndefined: undefined,
          keptNull: null,
          numberVal: 42,
        },
      },
      arrayWithUndefined: ['valid', undefined, 'also-valid'],
    };

    const sanitized = sanitizeFirestoreDto(rawObject) as any;

    expect('sources' in sanitized).toBe(false);
    expect('optionalField' in sanitized.nested).toBe(false);
    expect('anotherUndefined' in sanitized.nested.deep).toBe(false);
    expect(sanitized.nested.deep.keptNull).toBeNull();
    expect(sanitized.nested.deep.numberVal).toBe(42);
    expect(sanitized.arrayWithUndefined).toEqual(['valid', 'also-valid']);

    const check = containsUndefinedValues(sanitized);
    expect(check.found).toBe(false);
  });

  it('preserves null semantics across all domain entities (objectiveCorrect: null remains null)', () => {
    const cardId = generateId();
    const knowledgeItemId = generateId();
    const card: ReviewCard = {
      id: cardId,
      knowledgeItemId: knowledgeItemId,
      type: 'flashcard',
      front: 'Q',
      back: 'A',
      suspended: false,
      schemaVersion: 1,
      createdAt: '2026-09-15T12:00:00.000Z',
      updatedAt: '2026-09-15T12:00:00.000Z',
    };

    const initialState: CardState = {
      cardId: card.id,
      state: 'new',
      due: '2026-09-15T12:00:00.000Z',
      stability: 0,
      difficulty: 0,
      elapsedDays: 0,
      scheduledDays: 0,
      reps: 0,
      lapses: 0,
      learningSteps: 0,
      schemaVersion: 1,
    };

    const result = applyReviewToCard({
      card,
      currentState: initialState,
      rating: 'again',
      reviewTimestamp: '2026-09-15T12:00:00.000Z',
      parameterSet: DEFAULT_PARAMETER_SET,
      desiredRetention: 0.90,
      objectiveCorrect: null, // explicit null
      guessedOrStruggled: true,
      deviceId: 'dev-1',
      schemaVersion: 1,
    });

    const eventDto = mapReviewEventToDTO(result.event);
    expect(eventDto.objectiveCorrect).toBeNull();
    expect(Object.prototype.hasOwnProperty.call(eventDto, 'objectiveCorrect')).toBe(true);

    const taxonomyDto = mapTaxonomyToDTO(CANONICAL_TAXONOMY_REGISTRY);
    expect(containsUndefinedValues(taxonomyDto).found).toBe(false);

    const paramDto = mapSchedulerParameterSetToDTO(DEFAULT_PARAMETER_SET);
    expect(containsUndefinedValues(paramDto).found).toBe(false);

    const settingsDto = mapSettingsToDTO(DEFAULT_SETTINGS);
    expect(containsUndefinedValues(settingsDto).found).toBe(false);
  });
});
