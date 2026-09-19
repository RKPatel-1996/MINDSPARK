import { describe, it, expect } from 'vitest';
import {
  createInitialCardState,
  scheduleReview,
  calculateRetrievability,
  getSchedulingForecast,
  domainToFsrsCard,
  fsrsToDomainCard,
  DEFAULT_FSRS_CONFIG,
} from '../engine/fsrsAdapter';
import { generateId } from '../domain/id';
import { DEFAULT_SCHEDULER_IDENTITY, type ReviewRating } from '../domain/event';
import { fsrs, createEmptyCard, Rating, generatorParameters } from 'ts-fsrs';

describe('V2 FSRS Adapter and Multi-Step Round-Tripping', () => {
  it('has explicit scheduler identity and default desired retention 0.90', () => {
    expect(DEFAULT_FSRS_CONFIG.desiredRetention).toBe(0.90);
    expect(DEFAULT_SCHEDULER_IDENTITY.algorithm).toBe('fsrs-6');
    expect(DEFAULT_SCHEDULER_IDENTITY.implementation).toBe('ts-fsrs');
    expect(DEFAULT_SCHEDULER_IDENTITY.implementationVersion).toBe('5.4.2');
    expect(DEFAULT_SCHEDULER_IDENTITY.parameterSetId).toBe('fsrs-6-default');
  });

  it('initializes a new card state with learningSteps = 0 and valid FSRS defaults', () => {
    const cardId = generateId();
    const now = new Date('2026-03-01T10:00:00.000Z');
    const initial = createInitialCardState(cardId, now);

    expect(initial.cardId).toBe(cardId);
    expect(initial.state).toBe('new');
    expect(initial.learningSteps).toBe(0);
    expect(initial.stability).toBe(0);
    expect(initial.difficulty).toBe(0);
    expect(initial.reps).toBe(0);
    expect(initial.lapses).toBe(0);
    expect(initial.due).toBe(now.toISOString());
  });

  it('preserves learningSteps independently from reps across domain <-> FSRS roundtrip', () => {
    const cardId = generateId();
    const domainCard = {
      cardId,
      due: '2026-03-01T12:00:00.000Z',
      stability: 2.5,
      difficulty: 4.0,
      elapsedDays: 1,
      scheduledDays: 1,
      reps: 5, // Reps is 5
      lapses: 1,
      learningSteps: 2, // learningSteps is 2 (independent of reps!)
      state: 'learning' as const,
      lastReview: '2026-03-01T10:00:00.000Z',
      schemaVersion: 1 as const,
    };

    const fsrsCard = domainToFsrsCard(domainCard);
    expect(fsrsCard.learning_steps).toBe(2);
    expect(fsrsCard.reps).toBe(5);

    const roundTripped = fsrsToDomainCard(fsrsCard, cardId);
    expect(roundTripped.learningSteps).toBe(2);
    expect(roundTripped.reps).toBe(5);
  });

  it('matches direct ts-fsrs scheduling identically across a multi-review Learning and Relearning sequence', () => {
    // We will run the exact same sequence of reviews in parallel:
    // 1. Direct ts-fsrs Card
    // 2. V2 Adapter CardState, which is converted to FSRSCard, scheduled, converted back to CardState
    const cardId = generateId();
    const startTime = new Date('2026-03-01T08:00:00.000Z');

    const directFsrs = fsrs(generatorParameters({
      request_retention: DEFAULT_FSRS_CONFIG.desiredRetention,
      enable_fuzz: false,
    }));

    let directCard = createEmptyCard(startTime);
    let adapterState = createInitialCardState(cardId, startTime);

    const reviewSteps: Array<{ rating: ReviewRating; tsFsrsRating: Rating; advanceMinutes: number }> = [
      { rating: 'good', tsFsrsRating: Rating.Good, advanceMinutes: 10 }, // Step 1: Learning step 1
      { rating: 'good', tsFsrsRating: Rating.Good, advanceMinutes: 60 * 24 }, // Step 2: Graduated to Review
      { rating: 'again', tsFsrsRating: Rating.Again, advanceMinutes: 60 * 48 }, // Step 3: Lapse to Relearning
      { rating: 'good', tsFsrsRating: Rating.Good, advanceMinutes: 10 }, // Step 4: Relearning step
      { rating: 'good', tsFsrsRating: Rating.Good, advanceMinutes: 60 * 24 * 3 }, // Step 5: Back to Review
      { rating: 'easy', tsFsrsRating: Rating.Easy, advanceMinutes: 60 * 24 * 7 }, // Step 6: Easy review
    ];

    let currentTime = new Date(startTime);

    for (let i = 0; i < reviewSteps.length; i++) {
      const step = reviewSteps[i];
      currentTime = new Date(currentTime.getTime() + step.advanceMinutes * 60 * 1000);

      // 1. Direct ts-fsrs scheduling
      const directRecord = directFsrs.repeat(directCard, currentTime);
      directCard = directRecord[step.tsFsrsRating].card;

      // 2. V2 Adapter scheduling (converts CardState -> FSRSCard -> repeat -> CardState)
      const adapterResult = scheduleReview(adapterState, step.rating, currentTime);
      adapterState = adapterResult.nextState;

      // Assert that V2 CardState preserves exact scheduler state
      expect(adapterState.learningSteps).toBe(directCard.learning_steps);
      expect(adapterState.reps).toBe(directCard.reps);
      expect(adapterState.lapses).toBe(directCard.lapses);
      expect(adapterState.stability).toBeCloseTo(directCard.stability, 3);
      expect(adapterState.difficulty).toBeCloseTo(directCard.difficulty, 3);
      expect(adapterState.scheduledDays).toBe(directCard.scheduled_days);
      expect(new Date(adapterState.due).getTime()).toBe(directCard.due.getTime());

      // Check scheduler metadata emitted with review
      expect(adapterResult.schedulerMetadata.algorithm).toBe('fsrs-6');
      expect(adapterResult.schedulerMetadata.implementation).toBe('ts-fsrs');
      expect(adapterResult.schedulerMetadata.implementationVersion).toBe('5.4.2');
      expect(adapterResult.schedulerMetadata.parameterSetId).toBe('fsrs-6-default');
    }
  });

  it('produces valid state transitions for Again, Hard, Good, and Easy', () => {
    const cardId = generateId();
    const reviewTime = new Date('2026-03-01T12:00:00.000Z');
    const ratings: ReviewRating[] = ['again', 'hard', 'good', 'easy'];

    for (const rating of ratings) {
      const initial = createInitialCardState(cardId, reviewTime);
      const result = scheduleReview(initial, rating, reviewTime);

      expect(result.nextState.cardId).toBe(cardId);
      expect(result.nextState.lastReview).toBe(reviewTime.toISOString());
      expect(result.nextState.reps).toBe(1);
      expect(result.nextState.stability).toBeGreaterThan(0);
      expect(result.nextState.difficulty).toBeGreaterThan(0);
      expect(result.nextState.learningSteps).toBeGreaterThanOrEqual(0);

      expect(['learning', 'review']).toContain(result.nextState.state);
      expect(new Date(result.nextState.due).getTime()).toBeGreaterThanOrEqual(reviewTime.getTime());
    }
  });

  it('Easy on a new card produces higher stability than Again on a new card', () => {
    const reviewTime = new Date('2026-03-01T12:00:00.000Z');
    const initialAgain = createInitialCardState(generateId(), reviewTime);
    const initialEasy = createInitialCardState(generateId(), reviewTime);

    const resAgain = scheduleReview(initialAgain, 'again', reviewTime);
    const resEasy = scheduleReview(initialEasy, 'easy', reviewTime);

    expect(resEasy.nextState.stability).toBeGreaterThan(resAgain.nextState.stability);
    expect(resEasy.nextState.scheduledDays).toBeGreaterThanOrEqual(resAgain.nextState.scheduledDays);
  });

  it('calculates retrievability correctly: 0 for new cards, decaying over elapsed time', () => {
    const reviewTime = new Date('2026-03-01T12:00:00.000Z');
    const initial = createInitialCardState(generateId(), reviewTime);

    // New card retrievability is 0
    expect(calculateRetrievability(initial, reviewTime)).toBe(0);

    // Review with Good
    const review1 = scheduleReview(initial, 'good', reviewTime);
    const stateAfterGood = review1.nextState;

    // Retrievability right at review time is 1.0 (or close to 1)
    const rImmediate = calculateRetrievability(stateAfterGood, reviewTime);
    expect(rImmediate).toBeCloseTo(1.0, 1);

    // Retrievability 30 days later has decayed
    const futureTime = new Date('2026-03-31T12:00:00.000Z');
    const rFuture = calculateRetrievability(stateAfterGood, futureTime);
    expect(rFuture).toBeLessThan(rImmediate);
    expect(rFuture).toBeGreaterThanOrEqual(0);
  });

  it('provides scheduling forecast for all 4 ratings without side effects', () => {
    const reviewTime = new Date('2026-03-01T12:00:00.000Z');
    const state = createInitialCardState(generateId(), reviewTime);

    const forecast = getSchedulingForecast(state, reviewTime);

    expect(forecast).toHaveProperty('again');
    expect(forecast).toHaveProperty('hard');
    expect(forecast).toHaveProperty('good');
    expect(forecast).toHaveProperty('easy');

    expect(forecast.easy.stability).toBeGreaterThan(forecast.again.stability);
  });
});

describe('Parameter-Set Behavior', () => {
  it('default scheduling uses the canonical default parameter set and reports its exact ID', () => {
    const cardId = generateId();
    const reviewTime = new Date('2026-03-01T12:00:00.000Z');
    const initial = createInitialCardState(cardId, reviewTime);
    const result = scheduleReview(initial, 'good', reviewTime);

    // Verify metadata uses canonical defaults
    expect(result.schedulerMetadata.parameterSetId).toBe('fsrs-6-default');
    expect(result.schedulerMetadata.algorithm).toBe('fsrs-6');
    expect(result.schedulerMetadata.implementation).toBe('ts-fsrs');
  });

  it('supplying a deliberately modified parameter set changes scheduler behavior and metadata together', () => {
    const cardId = generateId();
    const reviewTime = new Date('2026-03-01T12:00:00.000Z');
    const initial = createInitialCardState(cardId, reviewTime);

    // Get baseline result
    const defaultResult = scheduleReview(initial, 'good', reviewTime);

    // Create custom parameter set with much higher initial stability weights
    const customParams = {
      ...DEFAULT_FSRS_CONFIG.parameterSet!,
      id: 'custom-high-stability',
      weights: [...DEFAULT_FSRS_CONFIG.parameterSet!.weights]
    };
    customParams.weights[0] = 5.0; // Higher initial stability for 'again'
    customParams.weights[1] = 10.0; // Higher initial stability for 'hard'
    customParams.weights[2] = 15.0; // Higher initial stability for 'good'

    const customConfig = {
      ...DEFAULT_FSRS_CONFIG,
      parameterSet: customParams
    };

    const customResult = scheduleReview(initial, 'good', reviewTime, customConfig);

    // Metadata should reflect custom ID
    expect(customResult.schedulerMetadata.parameterSetId).toBe('custom-high-stability');
    
    // Behavior (stability) should have changed significantly
    expect(customResult.stability).not.toBeCloseTo(defaultResult.stability);
    expect(customResult.stability).toBeGreaterThan(defaultResult.stability);
  });
});
