import { describe, it, expect, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LibraryView } from '../LibraryView';
import { ApplicationProvider } from '../../../application/ApplicationContext';
import { createInMemoryRepositories } from '../../../persistence/memory/inMemoryRepositories';
import type { KnowledgeItem } from '../../../domain/knowledge';
import type { ReviewCard } from '../../../domain/card';
import type { TaxonomyRegistry } from '../../../domain/taxonomy';

const testRegistry: TaxonomyRegistry = {
  domains: [
    { id: 'comp-sci', name: 'Computer Science' },
    { id: 'math', name: 'Mathematics' },
  ],
  topics: [
    { id: 'operating-systems', domainId: 'comp-sci', name: 'Operating Systems' },
    { id: 'linear-algebra', domainId: 'math', name: 'Linear Algebra' },
  ],
  subtopics: [
    { id: 'concurrency', topicId: 'operating-systems', name: 'Concurrency' },
    { id: 'memory', topicId: 'operating-systems', name: 'Memory Management' },
  ],
  allowedTags: ['kernel', 'performance'],
};

function setupTestRepositories() {
  const repos = createInMemoryRepositories();
  repos.taxonomy.save(testRegistry);

  const item1: KnowledgeItem = {
    id: 'item-1',
    schemaVersion: 1,
    title: 'Process Synchronization',
    content: 'Semaphores and mutexes in modern kernels',
    taxonomy: { domainId: 'comp-sci', topicId: 'operating-systems', subtopicId: 'concurrency' },
    tags: ['kernel'],
    status: 'active',
    createdAt: '2026-09-01T10:00:00.000Z',
    updatedAt: '2026-09-04T10:00:00.000Z',
  };
  const card1: ReviewCard = {
    id: 'card-1',
    knowledgeItemId: 'item-1',
    schemaVersion: 1,
    type: 'flashcard',
    front: 'Mutex vs Semaphore',
    back: 'Binary mutex vs counting semaphore',
    suspended: false,
    createdAt: '2026-09-01T10:00:00.000Z',
    updatedAt: '2026-09-01T10:00:00.000Z',
  };

  const item2: KnowledgeItem = {
    id: 'item-2',
    schemaVersion: 1,
    title: 'Virtual Memory & Paging',
    content: 'Address translation via TLB hardware',
    taxonomy: { domainId: 'comp-sci', topicId: 'operating-systems', subtopicId: 'memory' },
    tags: ['kernel'],
    status: 'active',
    createdAt: '2026-09-02T10:00:00.000Z',
    updatedAt: '2026-09-03T10:00:00.000Z',
  };
  const card2: ReviewCard = {
    id: 'card-2',
    knowledgeItemId: 'item-2',
    schemaVersion: 1,
    type: 'mcq',
    question: 'What is TLB?',
    options: ['Cache for page translations', 'Disk storage'],
    correctOptionIndex: 0,
    suspended: false,
    createdAt: '2026-09-02T10:00:00.000Z',
    updatedAt: '2026-09-02T10:00:00.000Z',
  };

  const item3: KnowledgeItem = {
    id: 'item-3-archived',
    schemaVersion: 1,
    title: 'Eigenvalues and Eigenvectors',
    content: 'Matrix transformations and spectral theory',
    taxonomy: { domainId: 'math', topicId: 'linear-algebra' },
    tags: [],
    status: 'archived',
    createdAt: '2026-09-03T10:00:00.000Z',
    updatedAt: '2026-09-03T10:00:00.000Z',
  };
  const card3: ReviewCard = {
    id: 'card-3',
    knowledgeItemId: 'item-3-archived',
    schemaVersion: 1,
    type: 'true_false',
    statement: 'Every square matrix has eigenvalues.',
    isTrue: true,
    suspended: false,
    createdAt: '2026-09-03T10:00:00.000Z',
    updatedAt: '2026-09-03T10:00:00.000Z',
  };

  repos.knowledge.create(item1);
  repos.knowledge.create(item2);
  repos.knowledge.create(item3);
  repos.reviewCards.create(card1);
  repos.reviewCards.create(card2);
  repos.reviewCards.create(card3);

  return repos;
}

describe('Library Select Mode UI (Task 5-1)', () => {
  let repos: ReturnType<typeof setupTestRepositories>;

  beforeEach(() => {
    repos = setupTestRepositories();
  });

  function renderLibrary(customRepos = repos) {
    return render(
      <ApplicationProvider customRepos={customRepos} isDev={true}>
        <LibraryView />
      </ApplicationProvider>
    );
  }

  it('1. Select mode is off by default', async () => {
    renderLibrary();

    await waitFor(() => {
      expect(screen.getByText('Process Synchronization')).toBeDefined();
    });

    // Select mode toggle button is present
    expect(screen.getByTestId('library-select-mode-btn')).toBeDefined();
    // Selection toolbar is NOT present
    expect(screen.queryByTestId('selection-toolbar')).toBeNull();
    // Checkboxes are NOT present on item cards
    expect(screen.queryByTestId('select-item-checkbox-item-1')).toBeNull();
  });

  it('2. entering Select mode starts with zero selected', async () => {
    renderLibrary();

    await waitFor(() => {
      expect(screen.getByText('Process Synchronization')).toBeDefined();
    });

    // Click Select button
    fireEvent.click(screen.getByTestId('library-select-mode-btn'));

    // Selection toolbar appears with "0 selected"
    await waitFor(() => {
      expect(screen.getByTestId('selection-toolbar')).toBeDefined();
    });
    expect(screen.getByTestId('selected-count').textContent).toContain('0 selected');

    // Checkboxes appear on visible items and are unchecked
    const checkbox1 = screen.getByTestId('select-item-checkbox-item-1') as HTMLInputElement;
    expect(checkbox1.checked).toBe(false);
  });

  it('3 & 4. selecting and deselecting an item updates the count', async () => {
    renderLibrary();

    await waitFor(() => {
      expect(screen.getByText('Process Synchronization')).toBeDefined();
    });

    fireEvent.click(screen.getByTestId('library-select-mode-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('selected-count')).toBeDefined();
    });

    // Select first item
    fireEvent.click(screen.getByTestId('select-item-checkbox-item-1'));

    expect(screen.getByTestId('selected-count').textContent).toContain('1 selected');

    // Deselect first item
    fireEvent.click(screen.getByTestId('select-item-checkbox-item-1'));

    expect(screen.getByTestId('selected-count').textContent).toContain('0 selected');
  });

  it('5. clicking an item card in Select mode toggles selection instead of opening inspector', async () => {
    renderLibrary();

    await waitFor(() => {
      expect(screen.getByText('Process Synchronization')).toBeDefined();
    });

    fireEvent.click(screen.getByTestId('library-select-mode-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('selected-count')).toBeDefined();
    });

    // Click item card directly
    fireEvent.click(screen.getByTestId('knowledge-item-card-item-1'));

    // Toggles selection count to 1
    expect(screen.getByTestId('selected-count').textContent).toContain('1 selected');

    // Inspector modal MUST NOT open
    expect(screen.queryByTestId('item-inspector-modal')).toBeNull();
  });

  it('6. normal item opening still works outside Select mode', async () => {
    renderLibrary();

    await waitFor(() => {
      expect(screen.getByText('Process Synchronization')).toBeDefined();
    });

    // Click item card while Select mode is OFF
    fireEvent.click(screen.getByTestId('knowledge-item-card-item-1'));

    // Inspector modal opens
    await waitFor(() => {
      expect(screen.getByTestId('item-inspector-modal')).toBeDefined();
    });
  });

  it('7. Cancel exits Select mode and clears selection', async () => {
    renderLibrary();

    await waitFor(() => {
      expect(screen.getByText('Process Synchronization')).toBeDefined();
    });

    fireEvent.click(screen.getByTestId('library-select-mode-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('selected-count')).toBeDefined();
    });

    // Select items
    fireEvent.click(screen.getByTestId('select-item-checkbox-item-1'));
    expect(screen.getByTestId('selected-count').textContent).toContain('1 selected');

    // Click Cancel
    fireEvent.click(screen.getByTestId('cancel-select-btn'));

    // Exits Select mode
    await waitFor(() => {
      expect(screen.queryByTestId('selection-toolbar')).toBeNull();
    });

    // Re-entering Select mode starts fresh with 0 selected
    fireEvent.click(screen.getByTestId('library-select-mode-btn'));
    await waitFor(() => {
      expect(screen.getByTestId('selected-count').textContent).toContain('0 selected');
    });
  });

  it('8. changing query (search/status/filter) removes selected IDs no longer visible', async () => {
    renderLibrary();

    await waitFor(() => {
      expect(screen.getByText('Process Synchronization')).toBeDefined();
    });

    fireEvent.click(screen.getByTestId('library-select-mode-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('selected-count')).toBeDefined();
    });

    // Select item-1 ("Process Synchronization")
    fireEvent.click(screen.getByTestId('select-item-checkbox-item-1'));
    expect(screen.getByTestId('selected-count').textContent).toContain('1 selected');

    // Type search query "Virtual" which hides item-1 and shows only item-2
    const searchInput = screen.getByPlaceholderText('Search knowledge…');
    fireEvent.change(searchInput, { target: { value: 'Virtual' } });

    // Item 1 is no longer in visible set, so selected count drops back to 0
    await waitFor(() => {
      expect(screen.getByTestId('selected-count').textContent).toContain('0 selected');
    });

    // Clear search query
    fireEvent.change(searchInput, { target: { value: '' } });

    await waitFor(() => {
      expect(screen.getByText('Process Synchronization')).toBeDefined();
    });

    // Confirm count is still 0 (item-1 was pruned, not silently retained)
    expect(screen.getByTestId('selected-count').textContent).toContain('0 selected');
  });

  it('9. Select visible selects only currently visible results', async () => {
    renderLibrary();

    await waitFor(() => {
      expect(screen.getByText('Process Synchronization')).toBeDefined();
    });

    fireEvent.click(screen.getByTestId('library-select-mode-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('select-visible-btn')).toBeDefined();
    });

    // Click Select visible
    fireEvent.click(screen.getByTestId('select-visible-btn'));

    // Current tab has 2 active items (item-1 and item-2), item-3 is archived
    expect(screen.getByTestId('selected-count').textContent).toContain('2 selected');

    const checkbox1 = screen.getByTestId('select-item-checkbox-item-1') as HTMLInputElement;
    const checkbox2 = screen.getByTestId('select-item-checkbox-item-2') as HTMLInputElement;
    expect(checkbox1.checked).toBe(true);
    expect(checkbox2.checked).toBe(true);
  });

  it('10. no bulk lifecycle mutation is performed in this task', async () => {
    renderLibrary();

    await waitFor(() => {
      expect(screen.getByText('Process Synchronization')).toBeDefined();
    });

    fireEvent.click(screen.getByTestId('library-select-mode-btn'));
    fireEvent.click(screen.getByTestId('select-visible-btn'));

    // Neutral action area is displayed, but no bulk mutation controls exist
    expect(screen.getByTestId('neutral-action-area')).toBeDefined();
    expect(screen.queryByRole('button', { name: /Archive selected/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /Restore selected/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /Mark resolved selected/i })).toBeNull();

    // Repository status remains unchanged
    const items = await repos.knowledge.list();
    const activeItems = items.filter((i) => i.status === 'active');
    expect(activeItems.length).toBe(2);
  });
});
