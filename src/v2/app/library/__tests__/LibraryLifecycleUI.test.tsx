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

  // Active item
  const item1: KnowledgeItem = {
    id: 'item-1-active',
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
    knowledgeItemId: 'item-1-active',
    schemaVersion: 1,
    type: 'flashcard',
    front: 'Mutex vs Semaphore',
    back: 'Binary mutex vs counting semaphore',
    suspended: false,
    createdAt: '2026-09-01T10:00:00.000Z',
    updatedAt: '2026-09-01T10:00:00.000Z',
  };

  // Needs review item
  const item2: KnowledgeItem = {
    id: 'item-2-needs-review',
    schemaVersion: 1,
    title: 'Virtual Memory & Paging',
    content: 'Address translation via TLB hardware',
    taxonomy: { domainId: 'comp-sci', topicId: 'operating-systems', subtopicId: 'memory' },
    tags: ['kernel'],
    status: 'needs_review',
    createdAt: '2026-09-02T10:00:00.000Z',
    updatedAt: '2026-09-03T10:00:00.000Z',
  };
  const card2: ReviewCard = {
    id: 'card-2',
    knowledgeItemId: 'item-2-needs-review',
    schemaVersion: 1,
    type: 'mcq',
    question: 'What is TLB?',
    options: ['Cache for page translations', 'Disk storage'],
    correctOptionIndex: 0,
    suspended: false,
    createdAt: '2026-09-02T10:00:00.000Z',
    updatedAt: '2026-09-02T10:00:00.000Z',
  };

  // Archived item
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

describe('Library KnowledgeItem Lifecycle UI (Task 3/5)', () => {
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

  it('exposes only valid actions for active items', async () => {
    renderLibrary();

    await waitFor(() => {
      expect(screen.getByText('Process Synchronization')).toBeDefined();
    });

    // Open active item inspector
    fireEvent.click(screen.getByTestId('knowledge-item-card-item-1-active'));

    await waitFor(() => {
      expect(screen.getByTestId('item-inspector-modal')).toBeDefined();
    });

    // Valid actions for active: Mark needs attention, Archive
    expect(screen.getByRole('button', { name: /Mark needs attention/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /^Archive$/i })).toBeDefined();

    // Forbidden actions
    expect(screen.queryByRole('button', { name: /Mark resolved/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /Restore/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /Delete/i })).toBeNull();
  });

  it('exposes only valid actions for needs_review items', async () => {
    renderLibrary();

    // Switch to Needs Attention tab
    const attentionTab = screen.getByRole('button', { name: /Needs Attention/i });
    fireEvent.click(attentionTab);

    await waitFor(() => {
      expect(screen.getByText('Virtual Memory & Paging')).toBeDefined();
    });

    // Open needs_review item inspector
    fireEvent.click(screen.getByTestId('knowledge-item-card-item-2-needs-review'));

    await waitFor(() => {
      expect(screen.getByTestId('item-inspector-modal')).toBeDefined();
    });

    // Valid actions for needs_review: Mark resolved, Archive
    expect(screen.getByRole('button', { name: /Mark resolved/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /^Archive$/i })).toBeDefined();

    // Forbidden actions
    expect(screen.queryByRole('button', { name: /Mark needs attention/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /Restore/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /Delete/i })).toBeNull();
  });

  it('exposes only Restore action for archived items', async () => {
    renderLibrary();

    // Switch to Archived tab
    const archivedTab = screen.getByRole('button', { name: /Archived/i });
    fireEvent.click(archivedTab);

    await waitFor(() => {
      expect(screen.getByText('Eigenvalues and Eigenvectors')).toBeDefined();
    });

    // Open archived item inspector
    fireEvent.click(screen.getByTestId('knowledge-item-card-item-3-archived'));

    await waitFor(() => {
      expect(screen.getByTestId('item-inspector-modal')).toBeDefined();
    });

    // Valid actions for archived: Restore only
    expect(screen.getByRole('button', { name: /Restore/i })).toBeDefined();

    // Forbidden actions
    expect(screen.queryByRole('button', { name: /^Archive$/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /Mark needs attention/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /Mark resolved/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /Delete/i })).toBeNull();
  });

  it('archive from Current disappears after refresh/query and appears in Archived', async () => {
    renderLibrary();

    await waitFor(() => {
      expect(screen.getByText('Process Synchronization')).toBeDefined();
    });

    // Open active item inspector
    fireEvent.click(screen.getByTestId('knowledge-item-card-item-1-active'));

    await waitFor(() => {
      expect(screen.getByTestId('item-inspector-modal')).toBeDefined();
    });

    // Click Archive
    const archiveBtn = screen.getByRole('button', { name: /^Archive$/i });
    fireEvent.click(archiveBtn);

    // Modal closes and item is removed from Current tab
    await waitFor(() => {
      expect(screen.queryByTestId('knowledge-item-card-item-1-active')).toBeNull();
    });

    // Switch to Archived tab
    const archivedTab = screen.getByRole('button', { name: /Archived/i });
    fireEvent.click(archivedTab);

    // Item appears in Archived tab
    await waitFor(() => {
      expect(screen.getByTestId('knowledge-item-card-item-1-active')).toBeDefined();
    });
  });

  it('marking needs_review from Current keeps item in Current and adds to Needs Attention', async () => {
    renderLibrary();

    await waitFor(() => {
      expect(screen.getByText('Process Synchronization')).toBeDefined();
    });

    // Open active item inspector
    fireEvent.click(screen.getByTestId('knowledge-item-card-item-1-active'));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Mark needs attention/i })).toBeDefined();
    });

    // Mark needs attention
    fireEvent.click(screen.getByRole('button', { name: /Mark needs attention/i }));

    // Button updates to Mark resolved
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Mark resolved/i })).toBeDefined();
    });

    // Close modal
    fireEvent.click(screen.getByRole('button', { name: /Close/i }));

    // Item remains visible in Current tab (Current tab shows active + needs_review)
    await waitFor(() => {
      expect(screen.getByTestId('knowledge-item-card-item-1-active')).toBeDefined();
    });

    // Switch to Needs Attention tab
    const attentionTab = screen.getByRole('button', { name: /Needs Attention/i });
    fireEvent.click(attentionTab);

    // Item appears in Needs Attention tab
    await waitFor(() => {
      expect(screen.getByTestId('knowledge-item-card-item-1-active')).toBeDefined();
    });
  });

  it('marking resolved from Needs Attention leaves Needs Attention but remains in Current', async () => {
    renderLibrary();

    // Switch to Needs Attention tab
    const attentionTab = screen.getByRole('button', { name: /Needs Attention/i });
    fireEvent.click(attentionTab);

    await waitFor(() => {
      expect(screen.getByTestId('knowledge-item-card-item-2-needs-review')).toBeDefined();
    });

    // Open item inspector
    fireEvent.click(screen.getByTestId('knowledge-item-card-item-2-needs-review'));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Mark resolved/i })).toBeDefined();
    });

    // Click Mark resolved
    fireEvent.click(screen.getByRole('button', { name: /Mark resolved/i }));

    // Button updates to Mark needs attention
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Mark needs attention/i })).toBeDefined();
    });

    // Close modal
    fireEvent.click(screen.getByRole('button', { name: /Close/i }));

    // In Needs Attention tab, item is no longer displayed
    await waitFor(() => {
      expect(screen.queryByTestId('knowledge-item-card-item-2-needs-review')).toBeNull();
    });

    // Switch to Current tab
    const currentTab = screen.getByRole('button', { name: /^Current$/i });
    fireEvent.click(currentTab);

    // Item remains in Current tab
    await waitFor(() => {
      expect(screen.getByTestId('knowledge-item-card-item-2-needs-review')).toBeDefined();
    });
  });

  it('restore from Archived leaves Archived and appears in Current', async () => {
    renderLibrary();

    // Switch to Archived tab
    const archivedTab = screen.getByRole('button', { name: /Archived/i });
    fireEvent.click(archivedTab);

    await waitFor(() => {
      expect(screen.getByTestId('knowledge-item-card-item-3-archived')).toBeDefined();
    });

    // Open archived item inspector
    fireEvent.click(screen.getByTestId('knowledge-item-card-item-3-archived'));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Restore/i })).toBeDefined();
    });

    // Click Restore
    fireEvent.click(screen.getByRole('button', { name: /Restore/i }));

    // Modal closes and item leaves Archived tab
    await waitFor(() => {
      expect(screen.queryByTestId('knowledge-item-card-item-3-archived')).toBeNull();
    });

    // Switch to Current tab
    const currentTab = screen.getByRole('button', { name: /^Current$/i });
    fireEvent.click(currentTab);

    // Item appears in Current tab
    await waitFor(() => {
      expect(screen.getByTestId('knowledge-item-card-item-3-archived')).toBeDefined();
    });
  });

  it('failed persistence does not optimistically change displayed status and shows error banner', async () => {
    // Inject repository failure
    repos.knowledge.updateStatus = async () => {
      throw new Error('Network write timeout');
    };

    renderLibrary();

    await waitFor(() => {
      expect(screen.getByTestId('knowledge-item-card-item-1-active')).toBeDefined();
    });

    // Open active item inspector
    fireEvent.click(screen.getByTestId('knowledge-item-card-item-1-active'));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Mark needs attention/i })).toBeDefined();
    });

    // Attempt transition
    fireEvent.click(screen.getByRole('button', { name: /Mark needs attention/i }));

    // Error banner appears
    await waitFor(() => {
      expect(screen.getByTestId('lifecycle-error-banner')).toBeDefined();
      expect(screen.getByText(/Network write timeout/i)).toBeDefined();
    });

    // Status was not optimistically changed; actions remain for active item
    expect(screen.getByRole('button', { name: /Mark needs attention/i })).toBeDefined();
    expect(screen.queryByRole('button', { name: /Mark resolved/i })).toBeNull();
  });
});
