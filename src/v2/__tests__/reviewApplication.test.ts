import { describe, it, expect } from 'vitest';
import { applyReviewToCard } from '../reconciliation/reviewApplication';
import type { ReviewCard } from '../domain/card';
import type { CardState } from '../domain/cardState';
import { DEFAULT_PARAMETER_SET } from '../domain/schedulerParameterSet';
import { generateId, isValidId } from '../domain/id';
import { createInitialCardState } from '../engine/fsrsAdapter';

describe('Review Application Engine', () => {
  const cardId = generateId();
  const knowledgeItemId = generateId();
  const mockCard: ReviewCard = {
    id: cardId,
    knowledgeItemId,
    type: 'flashcard',
    front: 'Q',
    back: 'A',
    createdAt: '2024-01-01T10:00:00.000Z',
    updatedAt: '2024-01-01T10:00:00.000Z',
    suspended: false,
    schemaVersion: 1
  };

  const paramSet = { ...DEFAULT_PARAMETER_SET, id: generateId() };
  const initialState = createInitialCardState(cardId, new Date(mockCard.createdAt as string));

  it('generates a new ReviewEvent and provisional CardState', () => {
    const result = applyReviewToCard({
      card: mockCard,
      currentState: initialState,
      rating: 'good',
      objectiveCorrect: null,
      guessedOrStruggled: false,
      deviceId: 'dev-1',
      reviewTimestamp: '2024-01-02T10:00:00.000Z',
      desiredRetention: 0.9,
      parameterSet: paramSet,
      schemaVersion: 1,
      durationMs: 1500
    });

    expect(result.provisionalState.state).toBe('learning');
    expect(result.provisionalState.reps).toBe(1);
    
    expect(isValidId(result.event.id)).toBe(true);
    expect(result.event.cardId).toBe(cardId);
    expect(result.event.knowledgeItemId).toBe(knowledgeItemId);
    expect(result.event.rating).toBe('good');
    expect(result.event.deviceId).toBe('dev-1');
    expect(result.event.durationMs).toBe(1500);
    expect(result.event.schedulerMetadata.parameterSetId).toBe(paramSet.id);
    expect(result.event.schedulerMetadata.algorithm).toBe('fsrs-6');
    expect(result.event.schedulerMetadata.scheduledDays).toBe(result.provisionalState.scheduledDays);
  });
  
  it('rejects flashcard with objectiveCorrect=true', () => {
    expect(() => applyReviewToCard({
      card: mockCard,
      currentState: initialState,
      rating: 'good',
      objectiveCorrect: true, // Should be null
      guessedOrStruggled: false,
      deviceId: 'dev-1',
      reviewTimestamp: '2024-01-02T10:00:00.000Z',
      desiredRetention: 0.9,
      parameterSet: paramSet,
      schemaVersion: 1
    })).toThrow();
  });

  it('rejects free_recall with objectiveCorrect=false', () => {
    expect(() => applyReviewToCard({
      card: { ...mockCard, type: 'free_recall' } as any,
      currentState: initialState,
      rating: 'good',
      objectiveCorrect: false, // Should be null
      guessedOrStruggled: false,
      deviceId: 'dev-1',
      reviewTimestamp: '2024-01-02T10:00:00.000Z',
      desiredRetention: 0.9,
      parameterSet: paramSet,
      schemaVersion: 1
    })).toThrow();
  });

  it('rejects mcq with objectiveCorrect=null', () => {
    expect(() => applyReviewToCard({
      card: { ...mockCard, type: 'mcq', options: ['A', 'B'], correctAnswerIndex: 0 } as any, // Mocking enough for card
      currentState: initialState,
      rating: 'good',
      objectiveCorrect: null, // Should be boolean
      guessedOrStruggled: false,
      deviceId: 'dev-1',
      reviewTimestamp: '2024-01-02T10:00:00.000Z',
      desiredRetention: 0.9,
      parameterSet: paramSet,
      schemaVersion: 1
    })).toThrow();
  });

  it('rejects true_false with objectiveCorrect=null', () => {
    expect(() => applyReviewToCard({
      card: { ...mockCard, type: 'true_false', correctAnswer: true } as any, // Mocking enough for card
      currentState: initialState,
      rating: 'good',
      objectiveCorrect: null, // Should be boolean
      guessedOrStruggled: false,
      deviceId: 'dev-1',
      reviewTimestamp: '2024-01-02T10:00:00.000Z',
      desiredRetention: 0.9,
      parameterSet: paramSet,
      schemaVersion: 1
    })).toThrow();
  });

  it('rejects mismatched card and state', () => {
    expect(() => applyReviewToCard({
      card: mockCard,
      currentState: { ...initialState, cardId: generateId() },
      rating: 'good',
      objectiveCorrect: null,
      guessedOrStruggled: false,
      deviceId: 'dev-1',
      reviewTimestamp: '2024-01-02T10:00:00.000Z',
      desiredRetention: 0.9,
      parameterSet: paramSet,
      schemaVersion: 1
    })).toThrow('State cardId does not match card id');
  });
});
