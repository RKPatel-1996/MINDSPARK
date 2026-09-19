import React from 'react';
import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ApplicationProvider } from '../../../application/ApplicationContext';
import { bootstrapUserRepositories } from '../../../application/bootstrapService';
import type { Repositories } from '../../../application/types';
import { generateId } from '../../../domain/id';
import type { KnowledgeItem } from '../../../domain/knowledge';
import type { ReviewCard } from '../../../domain/card';
import { createInMemoryRepositories } from '../../../persistence/memory/inMemoryRepositories';
import { ReviewView } from '../ReviewView';

async function createClozeFixture(): Promise<{
  repos: Repositories;
  card: ReviewCard;
}> {
  const repos = createInMemoryRepositories();
  await bootstrapUserRepositories(repos);

  const item: KnowledgeItem = {
    id: generateId(),
    schemaVersion: 1,
    title: 'DNA synthesis direction',
    content: 'DNA polymerase adds nucleotides in the 5-prime to 3-prime direction.',
    taxonomy: { domainId: 'computing', topicId: 'algorithms', subtopicId: 'sorting' },
    status: 'active',
    createdAt: '2026-09-01T10:00:00.000Z',
    updatedAt: '2026-09-01T10:00:00.000Z',
  };

  const card: ReviewCard = {
    id: generateId(),
    knowledgeItemId: item.id,
    schemaVersion: 1,
    suspended: false,
    type: 'cloze',
    prompt: 'DNA polymerase synthesizes DNA in the ____ direction.',
    answer: '5-prime to 3-prime',
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };

  await repos.knowledge.create(item);
  await repos.reviewCards.create(card);

  return { repos, card };
}

function renderReview(repos: Repositories): void {
  render(
    <ApplicationProvider customRepos={repos} isDev={true}>
      <ReviewView />
    </ApplicationProvider>
  );
}

describe('Cloze Review UI', () => {
  it('uses the self-rated Reveal flow and persists a subjective ReviewEvent', async () => {
    const { repos, card } = await createClozeFixture();
    renderReview(repos);

    await waitFor(() =>
      expect(
        screen.getByText('DNA polymerase synthesizes DNA in the ____ direction.')
      ).toBeDefined()
    );

    expect(screen.queryByText('5-prime to 3-prime')).toBeNull();
    expect(screen.getByRole('button', { name: /Reveal answer/i })).toBeDefined();

    fireEvent.click(screen.getByRole('button', { name: /Reveal answer/i }));

    await waitFor(() =>
      expect(screen.getByText('5-prime to 3-prime')).toBeDefined()
    );

    for (const label of ['Again', 'Hard', 'Good', 'Easy']) {
      expect(
        screen.getByRole('button', { name: new RegExp(`^${label}`, 'i') })
      ).toBeDefined();
    }

    fireEvent.click(screen.getByRole('button', { name: /^Good/i }));

    await waitFor(() =>
      expect(screen.getByText('All caught up')).toBeDefined()
    );

    const events = await repos.reviewEvents.listForCard(card.id);
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      cardType: 'cloze',
      rating: 'good',
      objectiveCorrect: null,
    });
  });
});