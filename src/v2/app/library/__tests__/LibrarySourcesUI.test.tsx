import React from 'react';
import { describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ApplicationProvider } from '../../../application/ApplicationContext';
import { bootstrapUserRepositories } from '../../../application/bootstrapService';
import type { Repositories } from '../../../application/types';
import { generateId } from '../../../domain/id';
import type { KnowledgeItem, SourceReference } from '../../../domain/knowledge';
import type { ReviewCard } from '../../../domain/card';
import { createInMemoryRepositories } from '../../../persistence/memory/inMemoryRepositories';
import { LibraryView } from '../LibraryView';

const SOURCE_URL = 'https://example.com/reference';

async function createFixture(sources?: SourceReference[]): Promise<{ repos: Repositories; item: KnowledgeItem }> {
  const repos = createInMemoryRepositories();
  await bootstrapUserRepositories(repos);

  const item: KnowledgeItem = {
    id: generateId(),
    schemaVersion: 1,
    title: 'Source fixture',
    content: 'A knowledge item used to verify source presentation.',
    explanationMarkdown: 'A detailed explanation.',
    taxonomy: { domainId: 'computing', topicId: 'linux', subtopicId: 'shell' },
    status: 'active',
    sources,
    createdAt: '2026-09-01T10:00:00.000Z',
    updatedAt: '2026-09-01T10:00:00.000Z',
  };
  const card: ReviewCard = {
    id: generateId(),
    knowledgeItemId: item.id,
    schemaVersion: 1,
    suspended: false,
    type: 'free_recall',
    prompt: 'What source data is displayed?',
    answerGuidance: 'The stored source data is displayed.',
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
  await repos.knowledge.create(item);
  await repos.reviewCards.create(card);
  return { repos, item };
}

function renderLibrary(repos: Repositories): void {
  render(
    <ApplicationProvider customRepos={repos} isDev={true}>
      <LibraryView />
    </ApplicationProvider>
  );
}

async function openInspector(): Promise<void> {
  await waitFor(() => expect(screen.getByText('Source fixture')).toBeDefined());
  fireEvent.click(screen.getByText('Source fixture'));
  await waitFor(() => expect(screen.getByTestId('item-inspector-modal')).toBeDefined());
}

describe('Library source presentation', () => {
  it('displays title, citation, and a safe external URL for a complete source', async () => {
    const { repos } = await createFixture([{
      title: 'Reference Title',
      citation: 'Reference citation text',
      url: SOURCE_URL,
    }]);
    renderLibrary(repos);
    await openInspector();

    expect(screen.getByRole('heading', { name: 'Sources' })).toBeDefined();
    expect(screen.getByText('Reference Title')).toBeDefined();
    expect(screen.getByText('Reference citation text')).toBeDefined();
    const link = screen.getByRole('link', { name: SOURCE_URL });
    expect(link.getAttribute('href')).toBe(SOURCE_URL);
    expect(link.getAttribute('target')).toBe('_blank');
    expect(link.getAttribute('rel')).toContain('noopener');
    expect(link.getAttribute('rel')).toContain('noreferrer');
  });

  it('renders each independently supplied source field without blank rows', async () => {
    const { repos } = await createFixture([
      { title: 'Title-only source' },
      { citation: 'Citation-only source' },
      { url: 'https://example.com/url-only' },
      {},
    ]);
    renderLibrary(repos);
    await openInspector();

    expect(screen.getByText('Title-only source')).toBeDefined();
    expect(screen.getByText('Citation-only source')).toBeDefined();
    expect(screen.getByRole('link', { name: 'https://example.com/url-only' })).toBeDefined();
    expect(screen.queryByText('undefined')).toBeNull();
  });

  it('omits Sources when an item has no sources or only empty source objects', async () => {
    const noSources = await createFixture();
    renderLibrary(noSources.repos);
    await openInspector();
    expect(screen.queryByRole('heading', { name: 'Sources' })).toBeNull();

    cleanup();
    const emptySource = await createFixture([{}]);
    renderLibrary(emptySource.repos);
    await openInspector();
    expect(screen.queryByRole('heading', { name: 'Sources' })).toBeNull();
  });

  it('preserves sources through the existing normal edit flow', async () => {
    const sources: SourceReference[] = [{ title: 'Preserved source', url: SOURCE_URL }];
    const { repos, item } = await createFixture(sources);
    renderLibrary(repos);
    await openInspector();

    const editButton = document.querySelector<HTMLButtonElement>('button[title="Edit Knowledge Item"]');
    if (!editButton) throw new Error('Expected the Library edit button');
    fireEvent.click(editButton);
    fireEvent.change(screen.getByDisplayValue('Source fixture'), { target: { value: 'Edited source fixture' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }));

    await waitFor(() => expect(screen.getByText('Edited source fixture')).toBeDefined());
    expect((await repos.knowledge.get(item.id))?.sources).toEqual(sources);
  });
});
