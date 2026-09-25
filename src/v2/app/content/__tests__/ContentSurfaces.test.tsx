import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { ApplicationProvider } from '../../../application/ApplicationContext';
import { bootstrapUserRepositories } from '../../../application/bootstrapService';
import type { Repositories } from '../../../application/types';
import type { KnowledgeItem } from '../../../domain/knowledge';
import type { ReviewCard } from '../../../domain/card';
import { createInMemoryRepositories } from '../../../persistence/memory/inMemoryRepositories';
import { LibraryView } from '../../library/LibraryView';
import { ReviewView } from '../../review/ReviewView';

const item: KnowledgeItem = {
  id: '11111111-1111-4111-8111-111111111111',
  schemaVersion: 1,
  title: 'Code and math fixture',
  content: 'Markdown **summary** with inline math $E = mc^2$.',
  blocks: [
    {
      type: 'text',
      content: '## Explanation\nA list:\n- one\n- two\n<img src=x onerror="alert(1)"> [unsafe](javascript:alert(2))',
    },
    { type: 'code', language: 'python', content: "  print('hello')\n\tprint('world')" },
    { type: 'math', content: '\\frac{m_1m_2}{r^2}' },
    { type: 'math', content: '\\frac{' },
  ],
  taxonomy: { domainId: 'computing', topicId: 'linux', subtopicId: 'shell' },
  status: 'active',
  createdAt: '2026-09-22T00:00:00.000Z',
  updatedAt: '2026-09-22T00:00:00.000Z',
};

const card: ReviewCard = {
  id: '22222222-2222-4222-8222-222222222222',
  knowledgeItemId: item.id,
  schemaVersion: 1,
  suspended: false,
  type: 'free_recall',
  prompt: 'Recall **the code and math content**. <script>alert("never")</script>',
  answerGuidance: 'Reveal the stored blocks.',
  createdAt: item.createdAt,
  updatedAt: item.updatedAt,
};

async function fixture(): Promise<Repositories> {
  const repos = createInMemoryRepositories();
  await bootstrapUserRepositories(repos);
  await repos.knowledge.create(item);
  await repos.reviewCards.create(card);
  return repos;
}

afterEach(cleanup);

describe('text/code/math product surfaces', () => {
  it('shows Markdown, code language/whitespace, and math in Library detail', async () => {
    const repos = await fixture();
    render(
      <ApplicationProvider customRepos={repos} isDev={true}>
        <LibraryView />
      </ApplicationProvider>,
    );

    await waitFor(() => expect(screen.getByText(item.title)).toBeDefined());
    fireEvent.click(screen.getByText(item.title));
    await waitFor(() => expect(screen.getByTestId('content-blocks')).toBeDefined());

    expect(screen.getByRole('heading', { name: 'Explanation' })).toBeDefined();
    expect(screen.getByText('python')).toBeDefined();
    expect(screen.getByTestId('content-code-block').querySelector('code')?.textContent)
      .toBe(item.blocks?.[1].content);
    expect(document.querySelector('.katex')).not.toBeNull();
  });

  it('keeps knowledge blocks hidden until Review reveal, then renders them without changing scheduling controls', async () => {
    const repos = await fixture();
    render(
      <ApplicationProvider customRepos={repos} isDev={true}>
        <ReviewView />
      </ApplicationProvider>,
    );

    await waitFor(() => expect(screen.getByText('the code and math content')).toBeDefined());
    expect(screen.queryByTestId('content-blocks')).toBeNull();
    expect(document.querySelector('script')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: /Reveal answer/ }));

    await waitFor(() => expect(screen.getByTestId('content-blocks')).toBeDefined());
    expect(screen.getByRole('heading', { name: 'Explanation' })).toBeDefined();
    expect(screen.getByText('python')).toBeDefined();
    expect(screen.getByTestId('content-code-block').querySelector('code')?.textContent)
      .toBe(item.blocks?.[1].content);
    expect(document.querySelector('.katex')).not.toBeNull();
    expect(screen.getByTestId('content-blocks').textContent).toContain('\\frac{');
    expect(document.querySelector('img')).toBeNull();
    expect(screen.getByText('unsafe').closest('a')?.getAttribute('href') ?? '')
      .not.toMatch(/^javascript:/i);
    expect(screen.queryByRole('button', { name: /image|media|upload|attach/i })).toBeNull();

    for (const rating of ['Again', 'Hard', 'Good', 'Easy']) {
      expect(screen.getByRole('button', { name: new RegExp(`^${rating}`, 'i') })).toBeDefined();
    }
    fireEvent.click(screen.getByRole('button', { name: /^Good/i }));
    await waitFor(() => expect(screen.getByText('All caught up')).toBeDefined());
    expect(await repos.reviewEvents.listForCard(card.id)).toEqual([
      expect.objectContaining({
        cardId: card.id,
        knowledgeItemId: item.id,
        cardType: 'free_recall',
        rating: 'good',
        objectiveCorrect: null,
      }),
    ]);
  });
});
