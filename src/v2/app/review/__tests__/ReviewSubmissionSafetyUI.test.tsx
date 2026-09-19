import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ApplicationProvider } from '../../../application/ApplicationContext';
import { bootstrapUserRepositories } from '../../../application/bootstrapService';
import { ReviewService } from '../../../application/reviewService';
import type { Repositories, ReviewSubmissionResult } from '../../../application/types';
import { generateId } from '../../../domain/id';
import type { KnowledgeItem } from '../../../domain/knowledge';
import type { ReviewCard } from '../../../domain/card';
import { createInMemoryRepositories } from '../../../persistence/memory/inMemoryRepositories';
import { ReviewView } from '../ReviewView';
import { useShortcutStore } from '../../store/shortcutStore';

async function createReviewFixture(type: 'mcq' | 'free_recall'): Promise<{
  repos: Repositories;
  item: KnowledgeItem;
  card: ReviewCard;
}> {
  const repos = createInMemoryRepositories();
  await bootstrapUserRepositories(repos);

  const item: KnowledgeItem = {
    id: generateId(),
    schemaVersion: 1,
    title: `${type} submission safety`,
    content: 'Review submission safety content.',
    taxonomy: { domainId: 'computing', topicId: 'algorithms', subtopicId: 'sorting' },
    status: 'active',
    createdAt: '2026-09-01T10:00:00.000Z',
    updatedAt: '2026-09-01T10:00:00.000Z',
  };
  const card: ReviewCard = type === 'mcq'
    ? {
        id: generateId(),
        knowledgeItemId: item.id,
        schemaVersion: 1,
        suspended: false,
        type: 'mcq',
        question: 'Which sorting algorithm is stable?',
        options: ['Merge sort', 'Heap sort'],
        correctOptionIndex: 0,
        explanation: 'Merge sort preserves the order of equal elements.',
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      }
    : {
        id: generateId(),
        knowledgeItemId: item.id,
        schemaVersion: 1,
        suspended: false,
        type: 'free_recall',
        prompt: 'State the stability property for merge sort.',
        answerGuidance: 'Equal elements retain their original relative order.',
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      };

  await repos.knowledge.create(item);
  await repos.reviewCards.create(card);
  return { repos, item, card };
}

function renderReview(repos: Repositories): void {
  render(
    <ApplicationProvider customRepos={repos} isDev={true}>
      <ReviewView />
    </ApplicationProvider>
  );
}

async function prepareAnsweredMcq(): Promise<void> {
  await waitFor(() => expect(screen.getByText('Which sorting algorithm is stable?')).toBeDefined());
  fireEvent.click(screen.getByRole('button', { name: /Merge sort/i }));
  fireEvent.click(screen.getByRole('button', { name: /Check answer/i }));
  await waitFor(() => expect(screen.getByText('Correct')).toBeDefined());
}

async function prepareRevealedRecall(): Promise<void> {
  await waitFor(() => expect(screen.getByText('State the stability property for merge sort.')).toBeDefined());
  fireEvent.click(screen.getByRole('button', { name: /Reveal answer/i }));
  await waitFor(() => expect(screen.getByText('Equal elements retain their original relative order.')).toBeDefined());
}

describe('Review submission safety UI (D1)', () => {
  beforeEach(() => {
    useShortcutStore.getState().restoreDefaults();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('submits an objective Continue only once under rapid repeated activation', async () => {
    const { repos, card } = await createReviewFixture('mcq');
    const submitSpy = vi.spyOn(ReviewService.prototype, 'submitReview');
    renderReview(repos);
    await prepareAnsweredMcq();

    const continueButton = screen.getByRole('button', { name: /^Continue$/i });
    fireEvent.click(continueButton);
    fireEvent.click(continueButton);

    await waitFor(() => expect(screen.getByText('All caught up')).toBeDefined());
    expect(submitSpy).toHaveBeenCalledTimes(1);
    expect(await repos.reviewEvents.listForCard(card.id)).toHaveLength(1);
  });

  it('submits a free-recall self-rating only once under rapid repeated activation', async () => {
    const { repos, card } = await createReviewFixture('free_recall');
    const submitSpy = vi.spyOn(ReviewService.prototype, 'submitReview');
    renderReview(repos);
    await prepareRevealedRecall();

    const goodButton = screen.getByRole('button', { name: /^Good/i });
    fireEvent.click(goodButton);
    fireEvent.click(goodButton);

    await waitFor(() => expect(screen.getByText('All caught up')).toBeDefined());
    expect(submitSpy).toHaveBeenCalledTimes(1);
    expect(await repos.reviewEvents.listForCard(card.id)).toHaveLength(1);
  });

  it('disables objective submission controls and ignores repeat clicks and Enter while pending', async () => {
    const { repos } = await createReviewFixture('mcq');
    let resolveSubmission: (value: ReviewSubmissionResult) => void = () => {};
    const pendingSubmission = new Promise<ReviewSubmissionResult>((resolve) => {
      resolveSubmission = resolve;
    });
    const submitSpy = vi.spyOn(ReviewService.prototype, 'submitReview').mockImplementation(() => pendingSubmission);
    renderReview(repos);
    await prepareAnsweredMcq();

    const continueButton = screen.getByRole('button', { name: /^Continue$/i }) as HTMLButtonElement;
    const guessedButton = screen.getByRole('button', { name: /^I guessed$/i }) as HTMLButtonElement;
    fireEvent.click(continueButton);
    fireEvent.click(continueButton);
    fireEvent.keyDown(window, { key: 'Enter' });

    expect(submitSpy).toHaveBeenCalledTimes(1);
    expect(continueButton.disabled).toBe(true);
    expect(guessedButton.disabled).toBe(true);

    resolveSubmission({} as ReviewSubmissionResult);
    await waitFor(() => expect(screen.getByText('2/5')).toBeDefined());
  });

  it('disables all self-rating controls and ignores repeat activation while pending', async () => {
    const { repos } = await createReviewFixture('free_recall');
    let resolveSubmission: (value: ReviewSubmissionResult) => void = () => {};
    const pendingSubmission = new Promise<ReviewSubmissionResult>((resolve) => {
      resolveSubmission = resolve;
    });
    const submitSpy = vi.spyOn(ReviewService.prototype, 'submitReview').mockImplementation(() => pendingSubmission);
    renderReview(repos);
    await prepareRevealedRecall();

    const buttons = ['Again', 'Hard', 'Good', 'Easy'].map(
      (label) => screen.getByRole('button', { name: new RegExp(`^${label}`, 'i') }) as HTMLButtonElement
    );
    fireEvent.click(buttons[2]);
    fireEvent.click(buttons[2]);
    fireEvent.keyDown(window, { key: '3' });

    expect(submitSpy).toHaveBeenCalledTimes(1);
    for (const button of buttons) {
      expect(button.disabled).toBe(true);
    }

    resolveSubmission({} as ReviewSubmissionResult);
    await waitFor(() => expect(screen.getByText('2/5')).toBeDefined());
  });

  it('preserves a failed objective answer and lets the user retry without advancing focus', async () => {
    const { repos, card } = await createReviewFixture('mcq');
    const submitSpy = vi.spyOn(ReviewService.prototype, 'submitReview').mockRejectedValueOnce(new Error('persistence unavailable'));
    const nextSpy = vi.spyOn(ReviewService.prototype, 'getNextReview');
    renderReview(repos);
    await prepareAnsweredMcq();
    const initialNextCalls = nextSpy.mock.calls.length;

    fireEvent.click(screen.getByRole('button', { name: /^Continue$/i }));

    await waitFor(() => expect(screen.getByTestId('review-submission-error')).toBeDefined());
    expect(screen.getByText('Review could not be saved. Try again.')).toBeDefined();
    expect(screen.getByText('Correct')).toBeDefined();
    expect(screen.getByText('1/5')).toBeDefined();
    expect(nextSpy).toHaveBeenCalledTimes(initialNextCalls);
    expect(await repos.reviewEvents.listForCard(card.id)).toHaveLength(0);
    expect((screen.getByRole('button', { name: /^Continue$/i }) as HTMLButtonElement).disabled).toBe(false);

    fireEvent.click(screen.getByRole('button', { name: /^Continue$/i }));
    await waitFor(() => expect(screen.getByText('All caught up')).toBeDefined());
    expect(submitSpy).toHaveBeenCalledTimes(2);
    expect(await repos.reviewEvents.listForCard(card.id)).toHaveLength(1);
  });

  it('preserves a failed revealed free-recall answer and lets the user retry without advancing focus', async () => {
    const { repos, card } = await createReviewFixture('free_recall');
    const submitSpy = vi.spyOn(ReviewService.prototype, 'submitReview').mockRejectedValueOnce(new Error('persistence unavailable'));
    const nextSpy = vi.spyOn(ReviewService.prototype, 'getNextReview');
    renderReview(repos);
    await prepareRevealedRecall();
    const initialNextCalls = nextSpy.mock.calls.length;

    fireEvent.click(screen.getByRole('button', { name: /^Good/i }));

    await waitFor(() => expect(screen.getByTestId('review-submission-error')).toBeDefined());
    expect(screen.getByText('Review could not be saved. Try again.')).toBeDefined();
    expect(screen.getByText('Equal elements retain their original relative order.')).toBeDefined();
    expect(screen.getByText('1/5')).toBeDefined();
    expect(nextSpy).toHaveBeenCalledTimes(initialNextCalls);
    expect(await repos.reviewEvents.listForCard(card.id)).toHaveLength(0);
    expect((screen.getByRole('button', { name: /^Good/i }) as HTMLButtonElement).disabled).toBe(false);

    fireEvent.click(screen.getByRole('button', { name: /^Good/i }));
    await waitFor(() => expect(screen.getByText('All caught up')).toBeDefined());
    expect(submitSpy).toHaveBeenCalledTimes(2);
    expect(await repos.reviewEvents.listForCard(card.id)).toHaveLength(1);
  });
});
