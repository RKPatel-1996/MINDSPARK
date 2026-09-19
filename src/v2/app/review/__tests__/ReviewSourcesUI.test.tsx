import React from 'react';
import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ApplicationProvider } from '../../../application/ApplicationContext';
import { bootstrapUserRepositories } from '../../../application/bootstrapService';
import type { Repositories } from '../../../application/types';
import { generateId } from '../../../domain/id';
import type { KnowledgeItem, SourceReference } from '../../../domain/knowledge';
import type { ReviewCard } from '../../../domain/card';
import { createInMemoryRepositories } from '../../../persistence/memory/inMemoryRepositories';
import { ReviewView } from '../ReviewView';

const SOURCE_URL = 'https://example.com/review-source';
const SOURCES: SourceReference[] = [{
  title: 'Answer-revealing source title',
  citation: 'Answer-revealing citation',
  url: SOURCE_URL,
}];

async function createFixture(
  type: 'free_recall' | 'mcq',
  sources?: SourceReference[],
): Promise<Repositories> {
  const repos = createInMemoryRepositories();
  await bootstrapUserRepositories(repos);
  const item: KnowledgeItem = {
    id: generateId(),
    schemaVersion: 1,
    title: 'Review source fixture',
    content: 'Review source content.',
    taxonomy: { domainId: 'computing', topicId: 'linux', subtopicId: 'shell' },
    status: 'active',
    sources,
    createdAt: '2026-09-01T10:00:00.000Z',
    updatedAt: '2026-09-01T10:00:00.000Z',
  };
  const card: ReviewCard = type === 'free_recall'
    ? {
        id: generateId(),
        knowledgeItemId: item.id,
        schemaVersion: 1,
        suspended: false,
        type: 'free_recall',
        prompt: 'Recall this source answer',
        answerGuidance: 'The recalled answer.',
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      }
    : {
        id: generateId(),
        knowledgeItemId: item.id,
        schemaVersion: 1,
        suspended: false,
        type: 'mcq',
        question: 'Which option is correct?',
        options: ['Correct option', 'Incorrect option'],
        correctOptionIndex: 0,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      };
  await repos.knowledge.create(item);
  await repos.reviewCards.create(card);
  return repos;
}

function renderReview(repos: Repositories): void {
  render(
    <ApplicationProvider customRepos={repos} isDev={true}>
      <ReviewView />
    </ApplicationProvider>
  );
}

describe('Review source presentation', () => {
  it('keeps sources hidden before free-recall Reveal and renders them afterwards', async () => {
    renderReview(await createFixture('free_recall', SOURCES));
    await waitFor(() => expect(screen.getByText('Recall this source answer')).toBeDefined());

    expect(screen.queryByText('Answer-revealing source title')).toBeNull();
    expect(screen.queryByText('Answer-revealing citation')).toBeNull();
    expect(screen.queryByRole('link', { name: SOURCE_URL })).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: /Reveal answer/ }));
    await waitFor(() => expect(screen.getByText('Answer-revealing source title')).toBeDefined());
    expect(screen.getByText('Answer-revealing citation')).toBeDefined();
    const link = screen.getByRole('link', { name: SOURCE_URL });
    expect(link.getAttribute('href')).toBe(SOURCE_URL);
    expect(link.getAttribute('target')).toBe('_blank');
    expect(link.getAttribute('rel')).toBe('noopener noreferrer');
  });

  it('keeps sources hidden before objective Check answer and renders them afterwards', async () => {
    renderReview(await createFixture('mcq', SOURCES));
    await waitFor(() => expect(screen.getByText('Which option is correct?')).toBeDefined());

    expect(screen.queryByText('Answer-revealing source title')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: /^1Correct option$/ }));
    fireEvent.click(screen.getByRole('button', { name: /Check answer/ }));

    await waitFor(() => expect(screen.getByText('Answer-revealing source title')).toBeDefined());
    expect(screen.getByRole('heading', { name: 'Sources' })).toBeDefined();
  });

  it('does not render an empty Sources section after retrieval when no sources exist', async () => {
    renderReview(await createFixture('free_recall'));
    await waitFor(() => expect(screen.getByText('Recall this source answer')).toBeDefined());
    fireEvent.click(screen.getByRole('button', { name: /Reveal answer/ }));

    await waitFor(() => expect(screen.getByText('The recalled answer.')).toBeDefined());
    expect(screen.queryByText('Sources')).toBeNull();
  });
});
