import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { InsightsService } from '../application/insightsService';
import type { Repositories } from '../application/types';
import { bootstrapUserRepositories } from '../application/bootstrapService';
import { applyReviewToCard } from '../reconciliation/reviewApplication';
import { reconcileCardHistory } from '../reconciliation';
import {
  calculateRetrievability,
  createInitialCardState,
  DEFAULT_FSRS_CONFIG,
} from '../engine/fsrsAdapter';
import { createInMemoryRepositories } from '../persistence/memory/inMemoryRepositories';
import type { KnowledgeItem } from '../domain/knowledge';
import type { ReviewCard } from '../domain/card';
import type { ReviewRating } from '../domain/event';
import type { TaxonomyRegistry } from '../domain/taxonomy';

const CREATED_AT = '2026-01-01T00:00:00.000Z';
const REVIEWED_AT = '2026-01-02T00:00:00.000Z';
const AS_OF = new Date('2026-02-01T00:00:00.000Z');

function id(value: number): string {
  return `00000000-0000-4000-8000-${String(value).padStart(12, '0')}`;
}

function createItem(
  value: number,
  topicId: string,
  status: KnowledgeItem['status'] = 'active',
): KnowledgeItem {
  return {
    id: id(value),
    schemaVersion: 1,
    title: `Item ${value}`,
    content: `Content ${value}`,
    taxonomy: { domainId: 'live-domain', topicId },
    status,
    createdAt: CREATED_AT,
    updatedAt: CREATED_AT,
  };
}

function createCard(value: number, knowledgeItemId: string, suspended = false): ReviewCard {
  return {
    id: id(10_000 + value),
    knowledgeItemId,
    schemaVersion: 1,
    suspended,
    ...(suspended ? { suspendedReason: 'flagged_by_user' as const } : {}),
    type: 'free_recall',
    prompt: `Prompt ${value}`,
    answerGuidance: `Answer ${value}`,
    createdAt: CREATED_AT,
    updatedAt: CREATED_AT,
  };
}

async function addReviewedCard(
  repos: Repositories,
  value: number,
  topicId: string,
  rating: ReviewRating,
  status: KnowledgeItem['status'] = 'active',
  suspended = false,
  corruptParameterSet = false,
): Promise<{ item: KnowledgeItem; card: ReviewCard }> {
  const item = createItem(value, topicId, status);
  const card = createCard(value, item.id, suspended);
  const parameterSet = await repos.parameterSets.get('fsrs-6-default');
  if (!parameterSet) throw new Error('Expected default parameter set');

  const applied = applyReviewToCard({
    card,
    currentState: createInitialCardState(card.id, new Date(CREATED_AT)),
    rating,
    objectiveCorrect: null,
    guessedOrStruggled: false,
    deviceId: 'insights-test-device',
    reviewTimestamp: REVIEWED_AT,
    desiredRetention: 0.90,
    parameterSet,
    schemaVersion: 1,
  });

  await repos.knowledge.create(item);
  await repos.reviewCards.create(card);
  await repos.reviewEvents.append(corruptParameterSet
    ? {
        ...applied.event,
        schedulerMetadata: {
          ...applied.event.schedulerMetadata,
          parameterSetId: 'missing-parameter-set',
        },
      }
    : applied.event);

  return { item, card };
}

describe('InsightsService weak areas', () => {
  let repos: Repositories;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(AS_OF);
    repos = createInMemoryRepositories();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns no weak areas for first-use cards', async () => {
    const item = createItem(1, 'first-use-topic');
    await repos.knowledge.create(item);
    await repos.reviewCards.create(createCard(1, item.id));

    const summary = await new InsightsService(repos).getInsights();

    expect(summary.averageRetrievability).toBeNull();
    expect(summary.weakAreas).toEqual([]);
  });

  it('aggregates reconciled active-card retrievability by live taxonomy topic and preserves overall metrics', async () => {
    await bootstrapUserRepositories(repos);
    const registry: TaxonomyRegistry = {
      domains: [{ id: 'live-domain', name: 'Live Metrics Domain' }],
      topics: [
        { id: 'alpha-tie', domainId: 'live-domain', name: 'Live Alpha' },
        { id: 'count-tie', domainId: 'live-domain', name: 'Live Count' },
        { id: 'zeta-tie', domainId: 'live-domain', name: 'Live Zeta' },
        { id: 'high', domainId: 'live-domain', name: 'Live High' },
        { id: 'outside', domainId: 'live-domain', name: 'Live Outside' },
      ],
      subtopics: [],
      allowedTags: [],
    };
    await repos.taxonomy.save(registry);

    const reviewed = [
      await addReviewedCard(repos, 1, 'low', 'again'),
      await addReviewedCard(repos, 2, 'count-tie', 'good'),
      await addReviewedCard(repos, 3, 'count-tie', 'good'),
      await addReviewedCard(repos, 4, 'alpha-tie', 'good'),
      await addReviewedCard(repos, 5, 'zeta-tie', 'good'),
      await addReviewedCard(repos, 6, 'high', 'easy'),
      await addReviewedCard(repos, 7, 'outside', 'hard'),
    ];
    const newItem = createItem(8, 'new-topic');
    await repos.knowledge.create(newItem);
    await repos.reviewCards.create(createCard(8, newItem.id));
    await addReviewedCard(repos, 9, 'suspended-topic', 'good', 'active', true);
    await addReviewedCard(repos, 10, 'needs-review-topic', 'good', 'needs_review');
    await addReviewedCard(repos, 11, 'archived-topic', 'good', 'archived');
    const corrupt = await addReviewedCard(repos, 12, 'corrupt-topic', 'good', 'active', false, true);

    const parameterSet = await repos.parameterSets.get('fsrs-6-default');
    if (!parameterSet) throw new Error('Expected default parameter set');
    const expectedByTopic = new Map<string, { count: number; total: number }>();
    for (const { card, item } of reviewed) {
      const events = await repos.reviewEvents.listForCard(card.id);
      const reconciliation = reconcileCardHistory(card, events, { [parameterSet.id]: parameterSet });
      if (!reconciliation.ok) throw new Error(reconciliation.message);

      const retrievability = calculateRetrievability(reconciliation.state, AS_OF, DEFAULT_FSRS_CONFIG);
      const current = expectedByTopic.get(item.taxonomy.topicId) ?? { count: 0, total: 0 };
      current.count++;
      current.total += retrievability;
      expectedByTopic.set(item.taxonomy.topicId, current);
    }
    const expectedWeakAreas = Array.from(expectedByTopic.entries())
      .map(([topicId, area]) => ({
        domainId: 'live-domain',
        domainName: 'Live Metrics Domain',
        topicId,
        topicName: registry.topics.find((topic) => topic.id === topicId)?.name ?? topicId,
        reviewedCardCount: area.count,
        averageRetrievability: Math.round((area.total / area.count) * 100),
      }))
      .sort((left, right) => (
        left.averageRetrievability - right.averageRetrievability
        || right.reviewedCardCount - left.reviewedCardCount
        || left.topicId.localeCompare(right.topicId)
      ));

    const summary = await new InsightsService(repos).getInsights();

    expect(summary.weakAreas).toEqual(expectedWeakAreas.slice(0, 5));
    expect(summary.weakAreas).toHaveLength(5);
    expect(summary.weakAreas
      .filter((area) => ['alpha-tie', 'count-tie', 'zeta-tie'].includes(area.topicId))
      .map((area) => area.topicId))
      .toEqual(['count-tie', 'alpha-tie', 'zeta-tie']);
    expect(summary.weakAreas).not.toContainEqual(expect.objectContaining({ topicId: 'new-topic' }));
    expect(summary.weakAreas).not.toContainEqual(expect.objectContaining({ topicId: 'suspended-topic' }));
    expect(summary.weakAreas).not.toContainEqual(expect.objectContaining({ topicId: 'needs-review-topic' }));
    expect(summary.weakAreas).not.toContainEqual(expect.objectContaining({ topicId: 'archived-topic' }));
    expect(summary.weakAreas).not.toContainEqual(expect.objectContaining({ topicId: 'corrupt-topic' }));
    expect(summary.weakAreas).toContainEqual(expect.objectContaining({
      topicId: 'low',
      topicName: 'low',
    }));
    expect(summary.weakAreas).toContainEqual(expect.objectContaining({
      topicId: 'alpha-tie',
      topicName: 'Live Alpha',
      domainName: 'Live Metrics Domain',
    }));
    expect(summary.totalActiveItems).toBe(10);
    expect(summary.totalActiveCards).toBe(9);
    expect(summary.needsReviewCount).toBe(1);
    expect(summary.reviewedTodayCount).toBe(0);
    expect(summary.averageRetrievability).toBe(Math.round(
      Array.from(expectedByTopic.values()).reduce((total, area) => total + area.total, 0) / reviewed.length * 100,
    ));
    expect(summary.reconciliationErrors).toEqual([
      expect.objectContaining({ cardId: corrupt.card.id }),
    ]);
  });
});
