import React from 'react';
import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ApplicationProvider } from '../../../application/ApplicationContext';
import { bootstrapUserRepositories } from '../../../application/bootstrapService';
import { generateId } from '../../../domain/id';
import type { KnowledgeItem } from '../../../domain/knowledge';
import type { ReviewCard } from '../../../domain/card';
import { createInMemoryRepositories } from '../../../persistence/memory/inMemoryRepositories';
import { LibraryView } from '../LibraryView';

describe('Library Cloze UI', () => {
  it('exposes the Cloze filter and shows the Cloze prompt in the inspector', async () => {
    const repos = createInMemoryRepositories();
    await bootstrapUserRepositories(repos);

    const item: KnowledgeItem = {
      id: generateId(),
      schemaVersion: 1,
      title: 'Cloze library fixture',
      content: 'Cloze knowledge content.',
      taxonomy: { domainId: 'computing', topicId: 'linux', subtopicId: 'shell' },
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
      prompt: 'The command interpreter is commonly called a ____.',
      answer: 'shell',
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };

    await repos.knowledge.create(item);
    await repos.reviewCards.create(card);

    render(
      <ApplicationProvider customRepos={repos} isDev={true}>
        <LibraryView />
      </ApplicationProvider>
    );

    await waitFor(() =>
      expect(screen.getByText('Cloze library fixture')).toBeDefined()
    );

    fireEvent.click(screen.getByRole('button', { name: 'Filters' }));

    expect(screen.getByRole('button', { name: 'Cloze' })).toBeDefined();

    fireEvent.click(screen.getByText('Cloze library fixture'));

    await waitFor(() =>
      expect(
        screen.getByText('The command interpreter is commonly called a ____.')
      ).toBeDefined()
    );
  });
});