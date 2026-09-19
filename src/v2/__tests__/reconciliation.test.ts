import { describe, it, expect } from 'vitest';
import { reconcileCardHistory } from '../reconciliation';
import type { ReviewCard } from '../domain/card';
import type { ReviewEvent } from '../domain/event';
import { DEFAULT_PARAMETER_SET } from '../domain/schedulerParameterSet';
import { generateId } from '../domain/id';
import { scheduleReview, createInitialCardState } from '../engine/fsrsAdapter';

describe('Reconciliation Engine', () => {
  const cardId = generateId();
  const knowledgeItemId = generateId();
  const mockCard: ReviewCard = {
    id: cardId,
    knowledgeItemId: knowledgeItemId,
    type: 'flashcard',
    front: 'Q',
    back: 'A',
    createdAt: '2024-01-01T10:00:00.000Z',
    updatedAt: '2024-01-01T10:00:00.000Z',
    suspended: false,
    schemaVersion: 1
  };

  const paramSet1 = { ...DEFAULT_PARAMETER_SET, id: generateId() };
  
  // ParamSet 2 with slightly altered FSRS weights to simulate historical param variation
  const paramSet2 = { ...DEFAULT_PARAMETER_SET, id: generateId(), weights: [...DEFAULT_PARAMETER_SET.weights] as any };
  paramSet2.weights[0] = 0.5;
  paramSet2.weights[1] = 0.7;

  const baseEventTemplate: ReviewEvent = {
    id: generateId(),
    cardId: cardId,
    knowledgeItemId: knowledgeItemId,
    reviewTimestamp: '2024-01-02T10:00:00.000Z',
    rating: 'good',
    cardType: 'flashcard',
    objectiveCorrect: null,
    guessedOrStruggled: false,
    deviceId: 'dev-1',
    schemaVersion: 1,
    schedulerMetadata: {
      algorithm: 'fsrs-6',
      implementation: 'ts-fsrs',
      implementationVersion: '5.4.2',
      parameterSetId: paramSet1.id,
      desiredRetention: 0.9,
      scheduledDays: 1,
      stability: 1,
      difficulty: 5
    }
  };

  it('returns base state for no events', () => {
    const result = reconcileCardHistory(mockCard, [], {});
    expect(result.ok).toBe(true);
    if (result.ok === true) {
      expect(result.state.state).toBe('new');
      expect(result.state.reps).toBe(0);
      expect(result.diagnostics.eventsProcessed).toBe(0);
    }
  });

  it('rejects foreign events (wrong cardId)', () => {
    const foreignEvent = { ...baseEventTemplate, id: generateId(), cardId: generateId() };
    const result = reconcileCardHistory(mockCard, [foreignEvent], { [paramSet1.id]: paramSet1 });
    expect(result.ok).toBe(false);
    if (result.ok === false) {
      expect(result.error).toBe('foreign_event');
    }
  });

  it('deduplicates identical events', () => {
    const result = reconcileCardHistory(mockCard, [baseEventTemplate, baseEventTemplate], { [paramSet1.id]: paramSet1 });
    expect(result.ok).toBe(true);
    if (result.ok === true) {
      expect(result.diagnostics.eventsDeduplicated).toBe(1);
      expect(result.diagnostics.eventsProcessed).toBe(1);
      expect(result.state.reps).toBe(1);
    }
  });

  it('fails hard on conflicting duplicate IDs', () => {
    const conflictingEvent = { ...baseEventTemplate, rating: 'again' as const };
    const result = reconcileCardHistory(mockCard, [baseEventTemplate, conflictingEvent], { [paramSet1.id]: paramSet1 });
    expect(result.ok).toBe(false);
    if (result.ok === false) {
      expect(result.error).toBe('conflicting_duplicate_event');
    }
  });

  it('fails explicitly for missing parameter set', () => {
    const result = reconcileCardHistory(mockCard, [baseEventTemplate], {});
    expect(result.ok).toBe(false);
    if (result.ok === false) {
      expect(result.error).toBe('missing_parameter_set');
    }
  });

  it('canonical order: late arriving server events still reconcile chronologically', () => {
    const event1 = { ...baseEventTemplate, id: generateId(), reviewTimestamp: '2024-01-02T10:00:00.000Z' };
    const event2 = { ...baseEventTemplate, id: generateId(), reviewTimestamp: '2024-01-03T10:00:00.000Z' };
    
    // Compute canonical expected result
    let expectedState = createInitialCardState(cardId, new Date(mockCard.createdAt as string));
    expectedState = scheduleReview(expectedState, event1.rating, new Date(event1.reviewTimestamp), { desiredRetention: 0.9, parameterSet: paramSet1, enableFuzz: false }).nextState;
    expectedState = scheduleReview(expectedState, event2.rating, new Date(event2.reviewTimestamp), { desiredRetention: 0.9, parameterSet: paramSet1, enableFuzz: false }).nextState;
    
    // Simulate reverse server discovery order
    const result = reconcileCardHistory(mockCard, [event2, event1], { [paramSet1.id]: paramSet1 });
    
    expect(result.ok).toBe(true);
    if (result.ok === true) {
      expect(result.state).toEqual(expectedState);
    }
  });

  it('proves two-device convergence (Hard+Good)', () => {
    const eventA = { ...baseEventTemplate, id: generateId(), rating: 'hard' as const, reviewTimestamp: '2024-01-02T10:00:00.000Z', deviceId: 'dev-A' };
    const eventB = { ...baseEventTemplate, id: generateId(), rating: 'good' as const, reviewTimestamp: '2024-01-03T10:00:00.000Z', deviceId: 'dev-B' };

    const resultAB = reconcileCardHistory(mockCard, [eventA, eventB], { [paramSet1.id]: paramSet1 });
    const resultBA = reconcileCardHistory(mockCard, [eventB, eventA], { [paramSet1.id]: paramSet1 });
    
    expect(resultAB.ok).toBe(true);
    expect(resultBA.ok).toBe(true);
    if (resultAB.ok && resultBA.ok) {
      expect(resultAB.state).toEqual(resultBA.state);
    }
  });

  it('uses tie-breaker ID for identical timestamps', () => {
    const ev1Id = generateId();
    const ev2Id = generateId();
    const idA = ev1Id < ev2Id ? ev1Id : ev2Id;
    const idB = ev1Id < ev2Id ? ev2Id : ev1Id;
    
    const eventA = { ...baseEventTemplate, id: idA, reviewTimestamp: '2024-01-02T10:00:00.000Z', rating: 'good' as const };
    const eventB = { ...baseEventTemplate, id: idB, reviewTimestamp: '2024-01-02T10:00:00.000Z', rating: 'again' as const };

    const resultAB = reconcileCardHistory(mockCard, [eventA, eventB], { [paramSet1.id]: paramSet1 });
    const resultBA = reconcileCardHistory(mockCard, [eventB, eventA], { [paramSet1.id]: paramSet1 });

    expect(resultAB.ok).toBe(true);
    expect(resultBA.ok).toBe(true);
    if (resultAB.ok && resultBA.ok) {
      expect(resultAB.state).toEqual(resultBA.state);
      
      let expectedState = createInitialCardState(cardId, new Date(mockCard.createdAt as string));
      expectedState = scheduleReview(expectedState, eventA.rating, new Date(eventA.reviewTimestamp), { desiredRetention: 0.9, parameterSet: paramSet1, enableFuzz: false }).nextState;
      expectedState = scheduleReview(expectedState, eventB.rating, new Date(eventB.reviewTimestamp), { desiredRetention: 0.9, parameterSet: paramSet1, enableFuzz: false }).nextState;
      expect(resultAB.state).toEqual(expectedState);
    }
  });

  it('proves historical multi-parameter replay', () => {
    const event1 = { ...baseEventTemplate, id: generateId(), reviewTimestamp: '2024-01-02T10:00:00.000Z', schedulerMetadata: { ...baseEventTemplate.schedulerMetadata, parameterSetId: paramSet1.id } };
    const event2 = { ...baseEventTemplate, id: generateId(), reviewTimestamp: '2024-01-03T10:00:00.000Z', schedulerMetadata: { ...baseEventTemplate.schedulerMetadata, parameterSetId: paramSet2.id } };

    let expectedState = createInitialCardState(cardId, new Date(mockCard.createdAt as string));
    expectedState = scheduleReview(expectedState, event1.rating, new Date(event1.reviewTimestamp), { desiredRetention: 0.9, parameterSet: paramSet1, enableFuzz: false }).nextState;
    expectedState = scheduleReview(expectedState, event2.rating, new Date(event2.reviewTimestamp), { desiredRetention: 0.9, parameterSet: paramSet2, enableFuzz: false }).nextState;

    const result = reconcileCardHistory(mockCard, [event1, event2], { [paramSet1.id]: paramSet1, [paramSet2.id]: paramSet2 });
    
    expect(result.ok).toBe(true);
    if (result.ok === true) {
      expect(result.state).toEqual(expectedState);
    }
  });
  
  it('fails explicitly for parameter set ID mismatch', () => {
    const badParamSet = { ...paramSet1, id: generateId() };
    const result = reconcileCardHistory(mockCard, [baseEventTemplate], { [paramSet1.id]: badParamSet });
    expect(result.ok).toBe(false);
    if (result.ok === false) {
      expect(result.error).toBe('parameter_set_mismatch');
    }
  });
});
