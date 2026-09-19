import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ApplicationProvider, useApplication } from '../../../application/ApplicationContext';
import { InsightsService } from '../../../application/insightsService';
import type { InsightsSummary, Repositories } from '../../../application/types';
import { createInMemoryRepositories } from '../../../persistence/memory/inMemoryRepositories';
import { InsightsView } from '../InsightsView';

function createSummary(weakAreas: InsightsSummary['weakAreas'] = []): InsightsSummary {
  return {
    totalActiveItems: 8,
    totalActiveCards: 10,
    averageRetrievability: 76,
    weakAreas,
    needsReviewCount: 1,
    reviewedTodayCount: 3,
    stageCounts: { new: 2, learning: 3, review: 4, relearning: 1 },
  };
}

function RefreshInsightsButton(): React.ReactElement {
  const { triggerRefresh } = useApplication();
  return <button onClick={triggerRefresh}>Refresh Insights</button>;
}

function renderInsights(repos: Repositories, includeRefreshButton = false): void {
  render(
    <MemoryRouter initialEntries={['/insights']}>
      <ApplicationProvider customRepos={repos} isDev={true}>
        {includeRefreshButton && <RefreshInsightsButton />}
        <InsightsView />
      </ApplicationProvider>
    </MemoryRouter>
  );
}

describe('InsightsView', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders supplied weak areas in service order with retrievability and reviewed-card evidence', async () => {
    vi.spyOn(InsightsService.prototype, 'getInsights').mockResolvedValue(createSummary([
      {
        domainId: 'biology',
        domainName: 'Biology',
        topicId: 'cell-biology',
        topicName: 'Cell Biology',
        reviewedCardCount: 1,
        averageRetrievability: 63,
      },
      {
        domainId: 'chemistry',
        domainName: 'Chemistry',
        topicId: 'organic-chemistry',
        topicName: 'Organic Chemistry',
        reviewedCardCount: 4,
        averageRetrievability: 68,
      },
    ]));

    renderInsights(createInMemoryRepositories());

    await waitFor(() => expect(screen.getByRole('heading', { name: 'Weak Areas' })).toBeDefined());
    expect(screen.getByText('Biology › Cell Biology')).toBeDefined();
    expect(screen.getByText('Chemistry › Organic Chemistry')).toBeDefined();
    expect(screen.getByText('63%')).toBeDefined();
    expect(screen.getByText('68%')).toBeDefined();
    expect(screen.getByText('1 reviewed card')).toBeDefined();
    expect(screen.getByText('4 reviewed cards')).toBeDefined();

    const pageText = document.body.textContent ?? '';
    expect(pageText.indexOf('Biology › Cell Biology')).toBeLessThan(
      pageText.indexOf('Chemistry › Organic Chemistry'),
    );
    expect(screen.queryByText(/severity|grade|score|rank/i)).toBeNull();
  });

  it('renders the truthful empty weak-area state', async () => {
    vi.spyOn(InsightsService.prototype, 'getInsights').mockResolvedValue(createSummary());

    renderInsights(createInMemoryRepositories());

    await waitFor(() => expect(screen.getByText(
      'Not enough review history to identify weak areas yet.',
    )).toBeDefined());
  });

  it('shows a stable error state after an initial load failure without exposing raw errors', async () => {
    const getInsights = vi.spyOn(InsightsService.prototype, 'getInsights')
      .mockRejectedValueOnce(new Error('untrusted storage connection details'));

    renderInsights(createInMemoryRepositories());

    await waitFor(() => expect(screen.getByRole('alert')).toBeDefined());
    expect(screen.getByRole('heading', { name: 'Insights could not be loaded' })).toBeDefined();
    expect(screen.getByText('Your learning data was not changed. Try loading Insights again.')).toBeDefined();
    expect(screen.getByRole('button', { name: 'Retry' })).toBeDefined();
    expect(screen.queryByText('untrusted storage connection details')).toBeNull();
    expect(getInsights).toHaveBeenCalledTimes(1);
  });

  it('retries through the same loader and replaces a failure with fresh weak-area data', async () => {
    const getInsights = vi.spyOn(InsightsService.prototype, 'getInsights')
      .mockRejectedValueOnce(new Error('temporary failure'))
      .mockResolvedValueOnce(createSummary([{
        domainId: 'physics',
        domainName: 'Physics',
        topicId: 'mechanics',
        topicName: 'Mechanics',
        reviewedCardCount: 2,
        averageRetrievability: 54,
      }]));

    renderInsights(createInMemoryRepositories());

    await waitFor(() => expect(screen.getByRole('alert')).toBeDefined());
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));

    await waitFor(() => expect(screen.getByText('Physics › Mechanics')).toBeDefined());
    expect(screen.queryByRole('alert')).toBeNull();
    expect(getInsights).toHaveBeenCalledTimes(2);
  });

  it('reloads Insights when refreshCount changes after a successful load', async () => {
    const getInsights = vi.spyOn(InsightsService.prototype, 'getInsights')
      .mockResolvedValueOnce(createSummary([{
        domainId: 'biology',
        domainName: 'Biology',
        topicId: 'genetics',
        topicName: 'Genetics',
        reviewedCardCount: 2,
        averageRetrievability: 61,
      }]))
      .mockResolvedValueOnce(createSummary([{
        domainId: 'biology',
        domainName: 'Biology',
        topicId: 'ecology',
        topicName: 'Ecology',
        reviewedCardCount: 3,
        averageRetrievability: 58,
      }]));

    renderInsights(createInMemoryRepositories(), true);

    await waitFor(() => expect(screen.getByText('Biology › Genetics')).toBeDefined());
    fireEvent.click(screen.getByRole('button', { name: 'Refresh Insights' }));

    await waitFor(() => expect(screen.getByText('Biology › Ecology')).toBeDefined());
    expect(getInsights).toHaveBeenCalledTimes(2);
  });
});
