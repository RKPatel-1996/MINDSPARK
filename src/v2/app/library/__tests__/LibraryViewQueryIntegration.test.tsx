import { describe, it, expect, beforeEach, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LibraryView } from '../LibraryView';
import { ApplicationProvider } from '../../../application/ApplicationContext';
import { createInMemoryRepositories } from '../../../persistence/memory/inMemoryRepositories';
import * as libraryQueryModule from '../../../application/libraryQuery';
import type { KnowledgeItem } from '../../../domain/knowledge';
import type { ReviewCard } from '../../../domain/card';
import type { TaxonomyRegistry } from '../../../domain/taxonomy';
import fs from 'fs';
import path from 'path';

const customRegistry: TaxonomyRegistry = {
  domains: [
    { id: 'comp-sci', name: 'Computer Science' },
    { id: 'math', name: 'Mathematics' },
  ],
  topics: [
    { id: 'operating-systems', domainId: 'comp-sci', name: 'Operating Systems' },
    { id: 'algorithms', domainId: 'comp-sci', name: 'Algorithms' },
    { id: 'linear-algebra', domainId: 'math', name: 'Linear Algebra' },
  ],
  subtopics: [
    { id: 'concurrency', topicId: 'operating-systems', name: 'Concurrency' },
    { id: 'memory', topicId: 'operating-systems', name: 'Memory Management' },
    { id: 'sorting', topicId: 'algorithms', name: 'Sorting' },
  ],
  allowedTags: ['kernel', 'performance'],
};

function setupTestRepositories() {
  const repos = createInMemoryRepositories();

  // Seed taxonomy
  repos.taxonomy.save(customRegistry);

  // Item 1: Active, Concurrency, Flashcard
  const item1: KnowledgeItem = {
    id: '11111111-1111-4111-8111-111111111111',
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
    id: 'a1111111-1111-4111-8111-111111111111',
    knowledgeItemId: '11111111-1111-4111-8111-111111111111',
    schemaVersion: 1,
    type: 'flashcard',
    front: 'Mutex vs Semaphore',
    back: 'Binary mutex vs counting semaphore',
    suspended: false,
    createdAt: '2026-09-01T10:00:00.000Z',
    updatedAt: '2026-09-01T10:00:00.000Z',
  };

  // Item 2: Needs Review, Memory, MCQ
  const item2: KnowledgeItem = {
    id: '22222222-2222-4222-8222-222222222222',
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
    id: 'a2222222-2222-4222-8222-222222222222',
    knowledgeItemId: '22222222-2222-4222-8222-222222222222',
    schemaVersion: 1,
    type: 'mcq',
    question: 'What is TLB?',
    options: ['Cache for page translations', 'Disk storage'],
    correctOptionIndex: 0,
    suspended: false,
    createdAt: '2026-09-02T10:00:00.000Z',
    updatedAt: '2026-09-02T10:00:00.000Z',
  };

  // Item 3: Archived, Linear Algebra, True/False
  const item3: KnowledgeItem = {
    id: '33333333-3333-4333-8333-333333333333',
    schemaVersion: 1,
    title: 'Eigenvalues and Eigenvectors',
    content: 'Matrix transformations and spectral theory',
    taxonomy: { domainId: 'math', topicId: 'linear-algebra' },
    tags: [],
    status: 'archived',
    createdAt: '2026-09-03T10:00:00.000Z',
    updatedAt: '2026-09-01T10:00:00.000Z',
  };
  const card3: ReviewCard = {
    id: 'a3333333-3333-4333-8333-333333333333',
    knowledgeItemId: '33333333-3333-4333-8333-333333333333',
    schemaVersion: 1,
    type: 'true_false',
    statement: 'Determinant is the product of eigenvalues',
    isTrue: true,
    suspended: false,
    createdAt: '2026-09-03T10:00:00.000Z',
    updatedAt: '2026-09-03T10:00:00.000Z',
  };

  // Item 4: Active, Algorithms, Free Recall
  const item4: KnowledgeItem = {
    id: '44444444-4444-4444-8444-444444444444',
    schemaVersion: 1,
    title: 'Quicksort Partitioning',
    content: 'Lomuto vs Hoare partition schemes',
    taxonomy: { domainId: 'comp-sci', topicId: 'algorithms', subtopicId: 'sorting' },
    tags: ['performance'],
    status: 'active',
    createdAt: '2026-09-04T10:00:00.000Z',
    updatedAt: '2026-09-02T10:00:00.000Z',
  };
  const card4: ReviewCard = {
    id: 'a4444444-4444-4444-8444-444444444444',
    knowledgeItemId: '44444444-4444-4444-8444-444444444444',
    schemaVersion: 1,
    type: 'free_recall',
    prompt: 'Explain Lomuto partition scheme',
    answerGuidance: 'Pivot at end, scan and swap',
    suspended: false,
    createdAt: '2026-09-04T10:00:00.000Z',
    updatedAt: '2026-09-04T10:00:00.000Z',
  };

  repos.knowledge.create(item1);
  repos.knowledge.create(item2);
  repos.knowledge.create(item3);
  repos.knowledge.create(item4);

  repos.reviewCards.create(card1);
  repos.reviewCards.create(card2);
  repos.reviewCards.create(card3);
  repos.reviewCards.create(card4);

  return repos;
}

describe('LibraryView Query Engine Integration (Task 2/5)', () => {
  it('proves Library results are produced through queryLibraryItems', async () => {
    const repos = setupTestRepositories();
    const querySpy = vi.spyOn(libraryQueryModule, 'queryLibraryItems');

    render(
      <ApplicationProvider customRepos={repos}>
        <LibraryView />
      </ApplicationProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Process Synchronization')).toBeDefined();
    });

    expect(querySpy).toHaveBeenCalled();
    const lastCall = querySpy.mock.calls[querySpy.mock.calls.length - 1];
    expect(lastCall[2]).toMatchObject({
      status: 'current',
      sort: 'updated_desc',
      searchText: '',
    });

    querySpy.mockRestore();
  });

  it('default status is current: shows active + needs_review and excludes archived', async () => {
    const repos = setupTestRepositories();

    render(
      <ApplicationProvider customRepos={repos}>
        <LibraryView />
      </ApplicationProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Process Synchronization')).toBeDefined(); // active
    });

    expect(screen.getByText('Virtual Memory & Paging')).toBeDefined(); // needs_review
    expect(screen.getByText('Quicksort Partitioning')).toBeDefined(); // active
    expect(screen.queryByText('Eigenvalues and Eigenvectors')).toBeNull(); // archived (excluded)

    // Result count should display "3 items"
    expect(screen.getByText('3 items')).toBeDefined();
  });

  it('Needs Attention and Archived tabs map correctly', async () => {
    const repos = setupTestRepositories();

    render(
      <ApplicationProvider customRepos={repos}>
        <LibraryView />
      </ApplicationProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Process Synchronization')).toBeDefined();
    });

    // Click "Needs Attention" tab
    fireEvent.click(screen.getByRole('button', { name: 'Needs Attention' }));

    await waitFor(() => {
      expect(screen.getByText('Virtual Memory & Paging')).toBeDefined();
    });
    expect(screen.queryByText('Process Synchronization')).toBeNull();
    expect(screen.queryByText('Quicksort Partitioning')).toBeNull();
    expect(screen.queryByText('Eigenvalues and Eigenvectors')).toBeNull();
    expect(screen.getByText('1 item')).toBeDefined();

    // Click "Archived" tab
    fireEvent.click(screen.getByRole('button', { name: 'Archived' }));

    await waitFor(() => {
      expect(screen.getByText('Eigenvalues and Eigenvectors')).toBeDefined();
    });
    expect(screen.queryByText('Process Synchronization')).toBeNull();
    expect(screen.queryByText('Virtual Memory & Paging')).toBeNull();
    expect(screen.queryByText('Quicksort Partitioning')).toBeNull();
    expect(screen.getByText('1 item')).toBeDefined();

    // Click back to "Current" tab
    fireEvent.click(screen.getByRole('button', { name: 'Current' }));
    await waitFor(() => {
      expect(screen.getByText('Process Synchronization')).toBeDefined();
    });
    expect(screen.getByText('3 items')).toBeDefined();
  });

  it('search updates visible results immediately without artificial debounce', async () => {
    const repos = setupTestRepositories();

    render(
      <ApplicationProvider customRepos={repos}>
        <LibraryView />
      </ApplicationProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Process Synchronization')).toBeDefined();
    });

    const searchInput = screen.getByPlaceholderText('Search knowledge…') as HTMLInputElement;

    // Type "tlb" - matches only item 2 via content
    fireEvent.change(searchInput, { target: { value: 'tlb' } });

    await waitFor(() => {
      expect(screen.getByText('Virtual Memory & Paging')).toBeDefined();
    });
    expect(screen.queryByText('Process Synchronization')).toBeNull();
    expect(screen.queryByText('Quicksort Partitioning')).toBeNull();
    expect(screen.getByText('1 item')).toBeDefined();
  });

  it('taxonomy names are displayed rather than IDs in cards and detail view', async () => {
    const repos = setupTestRepositories();

    render(
      <ApplicationProvider customRepos={repos}>
        <LibraryView />
      </ApplicationProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Process Synchronization')).toBeDefined();
    });

    // Verify card displays resolved names
    expect(screen.getAllByText(/Computer Science › Operating Systems/i).length).toBeGreaterThan(0);
    // Verify IDs are not displayed
    expect(screen.queryByText('comp-sci › operating-systems')).toBeNull();
  });

  it('selecting Domain scopes Topic options, selecting Topic scopes Subtopics, and parent changes clear incompatible children', async () => {
    const repos = setupTestRepositories();

    render(
      <ApplicationProvider customRepos={repos}>
        <LibraryView />
      </ApplicationProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Process Synchronization')).toBeDefined();
    });

    // Open filter panel
    fireEvent.click(screen.getByRole('button', { name: /Filters/i }));

    const domainSelect = screen.getByLabelText('Domain') as HTMLSelectElement;
    const topicSelect = screen.getByLabelText('Topic') as HTMLSelectElement;
    const subtopicSelect = screen.getByLabelText('Subtopic') as HTMLSelectElement;

    // Select Computer Science
    fireEvent.change(domainSelect, { target: { value: 'comp-sci' } });

    // Topic options should only include Operating Systems and Algorithms (NOT Linear Algebra)
    const topicOptionTexts = Array.from(topicSelect.options).map((o) => o.text);
    expect(topicOptionTexts).toContain('All Topics');
    expect(topicOptionTexts).toContain('Operating Systems');
    expect(topicOptionTexts).toContain('Algorithms');
    expect(topicOptionTexts).not.toContain('Linear Algebra');

    // Select Operating Systems
    fireEvent.change(topicSelect, { target: { value: 'operating-systems' } });

    // Subtopic options should only include Concurrency and Memory Management (NOT Sorting)
    const subtopicOptionTexts = Array.from(subtopicSelect.options).map((o) => o.text);
    expect(subtopicOptionTexts).toContain('All Subtopics');
    expect(subtopicOptionTexts).toContain('Concurrency');
    expect(subtopicOptionTexts).toContain('Memory Management');
    expect(subtopicOptionTexts).not.toContain('Sorting');

    // Select Concurrency subtopic
    fireEvent.change(subtopicSelect, { target: { value: 'concurrency' } });
    expect(subtopicSelect.value).toBe('concurrency');

    // Now switch Topic to Algorithms
    fireEvent.change(topicSelect, { target: { value: 'algorithms' } });

    // Concurrency is incompatible with Algorithms, so subtopic should be cleared!
    expect(subtopicSelect.value).toBe('');

    // Now switch Domain to Mathematics
    fireEvent.change(domainSelect, { target: { value: 'math' } });

    // Algorithms was under Computer Science, so topic must be cleared!
    expect(topicSelect.value).toBe('');
    expect(subtopicSelect.value).toBe('');
  });

  it('multiple card types can be selected (OR within card-type filter)', async () => {
    const repos = setupTestRepositories();

    render(
      <ApplicationProvider customRepos={repos}>
        <LibraryView />
      </ApplicationProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Process Synchronization')).toBeDefined();
    });

    // Open filter panel
    fireEvent.click(screen.getByRole('button', { name: /Filters/i }));

    const mcqButton = screen.getByRole('button', { name: 'MCQ' });
    const freeRecallButton = screen.getByRole('button', { name: 'Free recall' });

    // Select MCQ
    fireEvent.click(mcqButton);

    await waitFor(() => {
      expect(screen.getByText('Virtual Memory & Paging')).toBeDefined();
    });
    expect(screen.queryByText('Process Synchronization')).toBeNull();
    expect(screen.queryByText('Quicksort Partitioning')).toBeNull();

    // Select Free recall (both MCQ and Free recall now selected)
    fireEvent.click(freeRecallButton);

    await waitFor(() => {
      expect(screen.getByText('Virtual Memory & Paging')).toBeDefined(); // MCQ
      expect(screen.getByText('Quicksort Partitioning')).toBeDefined(); // Free recall
    });
    // Flashcard is still not selected
    expect(screen.queryByText('Process Synchronization')).toBeNull();
  });

  it('Clear filters clears taxonomy and card types, but preserves search text and status tab', async () => {
    const repos = setupTestRepositories();

    render(
      <ApplicationProvider customRepos={repos}>
        <LibraryView />
      </ApplicationProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Process Synchronization')).toBeDefined();
    });

    // Set search text
    const searchInput = screen.getByPlaceholderText('Search knowledge…') as HTMLInputElement;
    fireEvent.change(searchInput, { target: { value: 'partition' } });

    // Open filters
    fireEvent.click(screen.getByRole('button', { name: /Filters/i }));

    const domainSelect = screen.getByLabelText('Domain') as HTMLSelectElement;
    fireEvent.change(domainSelect, { target: { value: 'comp-sci' } });

    const freeRecallButton = screen.getByRole('button', { name: 'Free recall' });
    fireEvent.click(freeRecallButton);

    // Click "Clear filters" in filter panel
    const clearBtn = screen.getByRole('button', { name: 'Clear filters' });
    fireEvent.click(clearBtn);

    // Taxonomy and card type filters cleared
    expect(domainSelect.value).toBe('');

    // Search query remains preserved!
    expect(searchInput.value).toBe('partition');

    // Item 4 matches 'partition' and is visible
    expect(screen.getByText('Quicksort Partitioning')).toBeDefined();
  });

  it('all four sort selections map correctly', async () => {
    const repos = setupTestRepositories();

    render(
      <ApplicationProvider customRepos={repos}>
        <LibraryView />
      </ApplicationProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Process Synchronization')).toBeDefined();
    });

    const sortSelect = screen.getByLabelText('Sort library') as HTMLSelectElement;

    // Helper to get titles in rendered order
    const getRenderedTitles = () => {
      const headings = screen.getAllByRole('heading', { level: 3 });
      return headings.map((h) => h.textContent);
    };

    // 1. Updated recently (default)
    // Item 1: 09-04, Item 2: 09-03, Item 4: 09-02
    expect(getRenderedTitles()).toEqual([
      'Process Synchronization',
      'Virtual Memory & Paging',
      'Quicksort Partitioning',
    ]);

    // 2. Created recently
    // Item 4: 09-04, Item 2: 09-02, Item 1: 09-01
    fireEvent.change(sortSelect, { target: { value: 'created_desc' } });
    expect(getRenderedTitles()).toEqual([
      'Quicksort Partitioning',
      'Virtual Memory & Paging',
      'Process Synchronization',
    ]);

    // 3. Title A–Z
    fireEvent.change(sortSelect, { target: { value: 'title_asc' } });
    expect(getRenderedTitles()).toEqual([
      'Process Synchronization',
      'Quicksort Partitioning',
      'Virtual Memory & Paging',
    ]);

    // 4. Title Z–A
    fireEvent.change(sortSelect, { target: { value: 'title_desc' } });
    expect(getRenderedTitles()).toEqual([
      'Virtual Memory & Paging',
      'Quicksort Partitioning',
      'Process Synchronization',
    ]);
  });

  it('no-match and true-empty-library states remain distinct', async () => {
    // 1. No match state with items in library
    const repos = setupTestRepositories();

    const { unmount } = render(
      <ApplicationProvider customRepos={repos}>
        <LibraryView />
      </ApplicationProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Process Synchronization')).toBeDefined();
    });

    const searchInput = screen.getByPlaceholderText('Search knowledge…') as HTMLInputElement;
    fireEvent.change(searchInput, { target: { value: 'nonexistentquery12345' } });

    await waitFor(() => {
      expect(screen.getByText('No knowledge items match these filters.')).toBeDefined();
    });
    // Does NOT show "Your library is empty. Seed the standard high-yield library..."
    expect(screen.queryByText(/Your library is empty/i)).toBeNull();

    unmount();

    // 2. True empty library state (0 items)
    const emptyRepos = createInMemoryRepositories();
    render(
      <ApplicationProvider customRepos={emptyRepos}>
        <LibraryView />
      </ApplicationProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('No knowledge found')).toBeDefined();
      expect(screen.getByText(/Your library is empty. Seed the standard high-yield library/i)).toBeDefined();
      expect(screen.getByRole('button', { name: /Seed Standard Library/i })).toBeDefined();
    });
  });

  it('existing item actions (open, toggle attention, archive) continue to work', async () => {
    const repos = setupTestRepositories();

    render(
      <ApplicationProvider customRepos={repos}>
        <LibraryView />
      </ApplicationProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Process Synchronization')).toBeDefined();
    });

    // Open detail modal
    fireEvent.click(screen.getByText('Process Synchronization'));

    // Modal is open
    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 4, name: 'Knowledge Summary' })).toBeDefined();
    });

    // Toggle attention
    const attentionBtn = screen.getByRole('button', { name: /Mark needs attention/i });
    fireEvent.click(attentionBtn);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Mark resolved/i })).toBeDefined();
    });

    // Archive
    const archiveBtn = screen.getByRole('button', { name: /^Archive$/i });
    fireEvent.click(archiveBtn);

    // Modal closed and item removed from Current tab
    await waitFor(() => {
      expect(screen.queryByText('Process Synchronization')).toBeNull();
    });
  });

  it('confirms no duplicate search or filtering implementation remains in LibraryView', () => {
    const filePath = path.resolve(__dirname, '../LibraryView.tsx');
    const source = fs.readFileSync(filePath, 'utf-8');

    // Must call queryLibraryItems
    expect(source).toContain('queryLibraryItems(');

    // Must NOT have ad-hoc .filter() calls matching titles/content/taxonomy/tags
    expect(source).not.toMatch(/item\.title\.toLowerCase\(\)\.includes/);
    expect(source).not.toMatch(/item\.content\.toLowerCase\(\)\.includes/);
    expect(source).not.toMatch(/item\.status !== 'archived'/);
    expect(source).not.toMatch(/c\.prompt\.toLowerCase\(\)\.includes/);
  });
});
