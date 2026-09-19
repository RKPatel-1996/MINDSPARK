import React from 'react';
import { beforeEach, describe, expect, it } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ApplicationProvider } from '../../../application/ApplicationContext';
import { bootstrapUserRepositories } from '../../../application/bootstrapService';
import type { Repositories } from '../../../application/types';
import { generateId } from '../../../domain/id';
import type { KnowledgeItem } from '../../../domain/knowledge';
import type { ReviewCard } from '../../../domain/card';
import { createInMemoryRepositories } from '../../../persistence/memory/inMemoryRepositories';
import { useShortcutStore } from '../../store/shortcutStore';
import { ReviewView } from '../ReviewView';

async function createFixture(withSubtopic = true): Promise<Repositories> {
  const repos = createInMemoryRepositories();
  await bootstrapUserRepositories(repos);
  const item: KnowledgeItem = {
    id: generateId(),
    schemaVersion: 1,
    title: 'Review interaction fixture',
    content: 'A concise explanation for the review interaction fixture.',
    explanationMarkdown: 'A longer explanation that can be expanded and collapsed without changing review state.',
    taxonomy: withSubtopic
      ? { domainId: 'computing', topicId: 'algorithms', subtopicId: 'sorting' }
      : { domainId: 'computing', topicId: 'algorithms' },
    status: 'active',
    createdAt: '2026-09-01T10:00:00.000Z',
    updatedAt: '2026-09-01T10:00:00.000Z',
  };
  const card: ReviewCard = {
    id: generateId(),
    knowledgeItemId: item.id,
    schemaVersion: 1,
    suspended: false,
    type: 'mcq',
    question: 'Which algorithm is stable?',
    options: ['Merge sort', 'Heap sort'],
    correctOptionIndex: 0,
    explanation: 'Merge sort is stable.',
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

async function waitForQuestion(): Promise<void> {
  await waitFor(() => expect(screen.getByText('Which algorithm is stable?')).toBeDefined());
}

async function answerQuestion(): Promise<void> {
  fireEvent.click(screen.getByRole('button', { name: /Merge sort/i }));
  fireEvent.click(screen.getByRole('button', { name: /Check answer/i }));
  await waitFor(() => expect(screen.getByText('Correct')).toBeDefined());
}

describe('Review auxiliary interactions (D2)', () => {
  beforeEach(() => {
    useShortcutStore.getState().restoreDefaults();
  });

  it('opens Why with the default question-mark shortcut and closes it with Escape', async () => {
    renderReview(await createFixture());
    await waitForQuestion();

    fireEvent.keyDown(window, { key: '?' });
    await waitFor(() => expect(screen.getByText('Scheduling Context & Decision Reason')).toBeDefined());

    fireEvent.keyDown(window, { key: 'Escape' });
    await waitFor(() => expect(screen.queryByText('Scheduling Context & Decision Reason')).toBeNull());
  });

  it('keeps the Why panel Close button functional', async () => {
    renderReview(await createFixture());
    await waitForQuestion();

    fireEvent.click(screen.getByRole('button', { name: 'Why am I seeing this?' }));
    await waitFor(() => expect(screen.getByText('Scheduling Context & Decision Reason')).toBeDefined());
    fireEvent.click(screen.getByRole('button', { name: 'Close scheduling context' }));
    await waitFor(() => expect(screen.queryByText('Scheduling Context & Decision Reason')).toBeNull());
  });

  it('expands full explanation and collapses it again with Show less', async () => {
    renderReview(await createFixture());
    await waitForQuestion();
    await answerQuestion();

    const disclosure = screen.getByRole('button', { name: 'Read full details' });
    expect(disclosure.getAttribute('aria-expanded')).toBe('false');
    fireEvent.click(disclosure);
    expect(screen.getByRole('button', { name: 'Show less' }).getAttribute('aria-expanded')).toBe('true');

    fireEvent.click(screen.getByRole('button', { name: 'Show less' }));
    expect(screen.getByRole('button', { name: 'Read full details' }).getAttribute('aria-expanded')).toBe('false');
  });

  it('collapses expanded details with Escape', async () => {
    renderReview(await createFixture());
    await waitForQuestion();
    await answerQuestion();
    fireEvent.click(screen.getByRole('button', { name: 'Read full details' }));
    expect(screen.getByRole('button', { name: 'Show less' })).toBeDefined();

    fireEvent.keyDown(window, { key: 'Escape' });
    await waitFor(() => expect(screen.getByRole('button', { name: 'Read full details' })).toBeDefined());
  });

  it('closes both auxiliary disclosures with one Escape', async () => {
    renderReview(await createFixture());
    await waitForQuestion();
    await answerQuestion();
    fireEvent.click(screen.getByRole('button', { name: 'Why am I seeing this?' }));
    fireEvent.click(screen.getByRole('button', { name: 'Read full details' }));
    expect(screen.getByText('Scheduling Context & Decision Reason')).toBeDefined();
    expect(screen.getByRole('button', { name: 'Show less' })).toBeDefined();

    fireEvent.keyDown(window, { key: 'Escape' });
    await waitFor(() => {
      expect(screen.queryByText('Scheduling Context & Decision Reason')).toBeNull();
      expect(screen.getByRole('button', { name: 'Read full details' })).toBeDefined();
    });
  });

  it('does not alter the review question or selected answer when Escape has nothing to close', async () => {
    renderReview(await createFixture());
    await waitForQuestion();
    fireEvent.click(screen.getByRole('button', { name: /Merge sort/i }));

    const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true });
    window.dispatchEvent(escapeEvent);

    expect(screen.getByText('Which algorithm is stable?')).toBeDefined();
    expect((screen.getByRole('button', { name: /Check answer/i }) as HTMLButtonElement).disabled).toBe(false);
    expect(escapeEvent.defaultPrevented).toBe(false);
    fireEvent.click(screen.getByRole('button', { name: /Check answer/i }));
    await waitFor(() => expect(screen.getByText('Correct')).toBeDefined());
  });

  it('does not render an undefined subtopic or trailing taxonomy separator', async () => {
    renderReview(await createFixture(false));
    await waitForQuestion();
    fireEvent.click(screen.getByRole('button', { name: 'Why am I seeing this?' }));
    await waitFor(() => expect(screen.getByText('Taxonomy Hierarchy')).toBeDefined());

    const taxonomyValue = screen.getByText('Taxonomy Hierarchy').nextElementSibling;
    expect(taxonomyValue?.textContent).toBe('computing › algorithms');
    expect(taxonomyValue?.textContent).not.toContain('undefined');
    expect(taxonomyValue?.textContent).not.toMatch(/›\s*$/);
  });
});
