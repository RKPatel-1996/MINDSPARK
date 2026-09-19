import { describe, it, expect } from 'vitest';
import { selectNextCard, type CandidateCardBundle } from '../engine/reviewRouter';
import { generateId } from '../domain/id';
import type { KnowledgeItem } from '../domain/knowledge';
import type { ReviewCard } from '../domain/card';
import type { CardState } from '../domain/cardState';

function createMockBundle(params: {
  knowledgeId?: string;
  cardId?: string;
  knowledgeStatus?: 'active' | 'needs_review' | 'archived';
  suspended?: boolean;
  suspendedReason?: 'requires_clarification' | 'flagged_by_user' | 'draft_incomplete';
  state?: 'new' | 'learning' | 'review' | 'relearning';
  due: string;
  stability?: number;
  difficulty?: number;
  topicId?: string;
  domainId?: string;
  lastReview?: string;
  learningSteps?: number;
}): CandidateCardBundle {
  const knowledgeId = params.knowledgeId ?? generateId();
  const cardId = params.cardId ?? generateId();

  const knowledgeItem: KnowledgeItem = {
    id: knowledgeId,
    schemaVersion: 1,
    title: `Item ${knowledgeId.slice(0, 8)}`,
    content: 'Core knowledge content',
    taxonomy: {
      domainId: params.domainId ?? 'science',
      topicId: params.topicId ?? 'biology',
    },
    status: params.knowledgeStatus ?? 'active',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };

  const isSuspended = params.suspended ?? false;
  const card: ReviewCard = {
    id: cardId,
    knowledgeItemId: knowledgeId,
    schemaVersion: 1,
    suspended: isSuspended,
    suspendedReason: isSuspended ? (params.suspendedReason ?? 'flagged_by_user') : undefined,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    type: 'flashcard',
    front: 'Question',
    back: 'Answer',
  };

  const cardState: CardState = {
    cardId,
    due: params.due,
    stability: params.stability ?? (params.state === 'new' ? 0 : 2.5),
    difficulty: params.difficulty ?? (params.state === 'new' ? 0 : 5.0),
    elapsedDays: 1,
    scheduledDays: 1,
    reps: params.state === 'new' ? 0 : 1,
    lapses: 0,
    learningSteps: params.learningSteps ?? 0,
    state: params.state ?? 'review',
    lastReview: params.lastReview ?? (params.state === 'new' ? undefined : '2026-02-01T00:00:00.000Z'),
    schemaVersion: 1,
  };

  return { card, knowledgeItem, cardState };
}

describe('V2 Review Router Policy and Accounting', () => {
  const now = new Date('2026-03-01T12:00:00.000Z');

  it('separately tracks needs_review and archived in router stats while excluding both from review', () => {
    const archivedCandidate = createMockBundle({
      knowledgeStatus: 'archived',
      state: 'review',
      due: '2026-03-01T10:00:00.000Z', // overdue!
    });

    const needsReviewCandidate = createMockBundle({
      knowledgeStatus: 'needs_review',
      state: 'review',
      due: '2026-03-01T10:00:00.000Z', // overdue!
    });

    const result = selectNextCard([archivedCandidate, needsReviewCandidate], { now });
    expect(result.status).toBe('caught_up');
    expect(result.reason).toBe('caught_up');
    expect(result.stats.archivedCount).toBe(1);
    expect(result.stats.needsReviewCount).toBe(1);
    expect(result.stats.activeCandidates).toBe(0);
  });

  it('excludes any genuinely suspended card and counts them in suspendedCount', () => {
    const suspendedFlagged = createMockBundle({
      suspended: true,
      suspendedReason: 'flagged_by_user',
      state: 'review',
      due: '2026-03-01T10:00:00.000Z',
    });

    const suspendedClarification = createMockBundle({
      suspended: true,
      suspendedReason: 'requires_clarification',
      state: 'review',
      due: '2026-03-01T10:00:00.000Z',
    });

    const result = selectNextCard([suspendedFlagged, suspendedClarification], { now });
    expect(result.status).toBe('caught_up');
    expect(result.stats.suspendedCount).toBe(2);
  });

  it('buries sibling cards using buriedKnowledgeItemIds across micro-sessions', () => {
    const kid = generateId();
    const sibling1 = createMockBundle({
      knowledgeId: kid,
      state: 'review',
      due: '2026-03-01T10:00:00.000Z',
    });
    const sibling2 = createMockBundle({
      knowledgeId: kid,
      state: 'review',
      due: '2026-03-01T10:00:00.000Z',
    });

    // When the app is closed and reopened in a micro-session later in the review day:
    // the caller passes buriedKnowledgeItemIds containing items reviewed earlier today
    const result = selectNextCard([sibling1, sibling2], {
      now,
      buriedKnowledgeItemIds: [kid],
    });

    expect(result.status).toBe('caught_up');
    expect(result.stats.buriedCount).toBe(2);
  });

  it('enforces strict tier precedence: learning/relearning > due review > new > reserve ordering', () => {
    const learningDue = createMockBundle({
      state: 'learning',
      due: '2026-03-01T11:00:00.000Z',
    });
    const reviewDue = createMockBundle({
      state: 'review',
      due: '2026-03-01T10:00:00.000Z',
    });
    const newCard = createMockBundle({
      state: 'new',
      due: '2026-03-01T10:00:00.000Z',
    });
    const reserveCard = createMockBundle({
      state: 'review',
      due: '2026-03-01T18:00:00.000Z',
      lastReview: '2026-02-20T00:00:00.000Z',
    });

    // All 4 present -> Tier 1 (Learning) must win
    const res1 = selectNextCard([reserveCard, newCard, reviewDue, learningDue], { now });
    expect(res1.status).toBe('selected');
    if (res1.status === 'selected') {
      expect(res1.card.id).toBe(learningDue.card.id);
      expect(res1.evidence.tier).toBe('learning_relearning');
    }

    // Without Learning -> Tier 2 (Review due) must win
    const res2 = selectNextCard([reserveCard, newCard, reviewDue], { now });
    expect(res2.status).toBe('selected');
    if (res2.status === 'selected') {
      expect(res2.card.id).toBe(reviewDue.card.id);
      expect(res2.evidence.tier).toBe('review_due');
    }

    // Without Review due -> Tier 3 (New) must win
    const res3 = selectNextCard([reserveCard, newCard], { now });
    expect(res3.status).toBe('selected');
    if (res3.status === 'selected') {
      expect(res3.card.id).toBe(newCard.card.id);
      expect(res3.evidence.tier).toBe('new_card');
    }

    // Without New (e.g. daily limit reached) -> Tier 4 (Reserve) must win
    const res4 = selectNextCard([reserveCard], { now, newCardsIntroducedToday: 5 });
    expect(res4.status).toBe('selected');
    if (res4.status === 'selected') {
      expect(res4.card.id).toBe(reserveCard.card.id);
      expect(res4.evidence.tier).toBe('near_due_reserve');
    }
  });

  it('sorts due review cards by lowest retrievability first', () => {
    // Card A: last reviewed 20 days ago (much lower retrievability)
    const urgentCard = createMockBundle({
      state: 'review',
      due: '2026-03-01T10:00:00.000Z',
      lastReview: '2026-02-09T10:00:00.000Z',
      stability: 1.0,
    });

    // Card B: last reviewed 2 days ago with high stability (higher retrievability)
    const lessUrgentCard = createMockBundle({
      state: 'review',
      due: '2026-03-01T11:00:00.000Z',
      lastReview: '2026-02-27T10:00:00.000Z',
      stability: 10.0,
    });

    const result = selectNextCard([lessUrgentCard, urgentCard], { now });
    expect(result.status).toBe('selected');
    if (result.status === 'selected') {
      expect(result.card.id).toBe(urgentCard.card.id);
      expect(result.reason).toBe('review_due');
    }
  });

  it('enforces daily new cards limit', () => {
    const newCard = createMockBundle({
      state: 'new',
      due: '2026-03-01T10:00:00.000Z',
    });

    // Limit is 5 by default; if already 5 introduced today, new card is not eligible
    const result = selectNextCard([newCard], {
      now,
      newCardsIntroducedToday: 5,
    });

    expect(result.status).toBe('caught_up');
    expect(result.stats.newEligibleCount).toBe(0);

    // If only 4 introduced today, new card is selected
    const resultEligible = selectNextCard([newCard], {
      now,
      newCardsIntroducedToday: 4,
    });

    expect(resultEligible.status).toBe('selected');
    if (resultEligible.status === 'selected') {
      expect(resultEligible.reason).toBe('new_card');
    }
  });

  it('routes near-due reserve cards within horizon only when neither due nor new cards exist', () => {
    // Card due in 6 hours (within default 24h reserve horizon)
    const reserveCard = createMockBundle({
      state: 'review',
      due: '2026-03-01T18:00:00.000Z', // 6 hours ahead of now
      lastReview: '2026-02-20T00:00:00.000Z',
    });

    // Card due in 36 hours (outside horizon)
    const distantCard = createMockBundle({
      state: 'review',
      due: '2026-03-03T00:00:00.000Z', // 36 hours ahead
      lastReview: '2026-02-20T00:00:00.000Z',
    });

    const result = selectNextCard([distantCard, reserveCard], {
      now,
      newCardsIntroducedToday: 5, // new cards capped
    });

    expect(result.status).toBe('selected');
    if (result.status === 'selected') {
      expect(result.card.id).toBe(reserveCard.card.id);
      expect(result.reason).toBe('near_due_reserve');
      expect(result.evidence.tier).toBe('near_due_reserve');
    }
  });

  it('returns caught_up when no cards meet any criteria', () => {
    const distantCard = createMockBundle({
      state: 'review',
      due: '2026-03-05T00:00:00.000Z',
    });

    const result = selectNextCard([distantCard], {
      now,
      newCardsIntroducedToday: 5,
    });

    expect(result.status).toBe('caught_up');
    expect(result.reason).toBe('caught_up');
  });
});
