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

  // Active item 1
  const item1: KnowledgeItem = {
    id: 'item-1',
    schemaVersion: 1,
    title: 'Mutex Synchronization',
    content: 'Locks and concurrency primitives',
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
    back: 'Binary vs counting',
    suspended: false,
    createdAt: '2026-09-01T10:00:00.000Z',
    updatedAt: '2026-09-04T10:00:00.000Z',
  };
  repos.knowledge.create(item1);
  repos.reviewCards.create(card1);

  // Needs review item 2
  const item2: KnowledgeItem = {
    id: 'item-2',
    schemaVersion: 1,
    title: 'Virtual Memory Paging',
    content: 'Page replacement algorithms',
    taxonomy: { domainId: 'comp-sci', topicId: 'operating-systems', subtopicId: 'memory' },
    tags: ['kernel'],
    status: 'needs_review',
    createdAt: '2026-09-02T10:00:00.000Z',
    updatedAt: '2026-09-05T10:00:00.000Z',
  };
  const card2: ReviewCard = {
    id: 'card-2',
    knowledgeItemId: 'item-2',
    schemaVersion: 1,
    type: 'mcq',
    question: 'What is LRU?',
    options: ['Least Recently Used', 'Last Run Utility'],
    correctOptionIndex: 0,
    suspended: false,
    createdAt: '2026-09-02T10:00:00.000Z',
    updatedAt: '2026-09-05T10:00:00.000Z',
  };
  repos.knowledge.create(item2);
  repos.reviewCards.create(card2);

  // Archived item 3
  const item3: KnowledgeItem = {
    id: 'item-3',
    schemaVersion: 1,
    title: 'Old Matrix Inversion',
    content: 'Gaussian elimination step-by-step',
    taxonomy: { domainId: 'math', topicId: 'linear-algebra' },
    tags: ['performance'],
    status: 'archived',
    createdAt: '2026-09-03T10:00:00.000Z',
    updatedAt: '2026-09-06T10:00:00.000Z',
  };
  const card3: ReviewCard = {
    id: 'card-3',
    knowledgeItemId: 'item-3',
    schemaVersion: 1,
    type: 'flashcard',
    front: 'Determinant non-zero',
    back: 'Invertible matrix',
    suspended: false,
    createdAt: '2026-09-03T10:00:00.000Z',
    updatedAt: '2026-09-06T10:00:00.000Z',
  };
  repos.knowledge.create(item3);
  repos.reviewCards.create(card3);

  return repos;
}

describe('TaxonomyBrowser UI Integration in LibraryView', () => {
  let repos: ReturnType<typeof setupTestRepositories>;

  beforeEach(() => {
    repos = setupTestRepositories();
  });

  function renderLibrary() {
    return render(
      <ApplicationProvider customRepos={repos} isDev={true}>
        <LibraryView />
      </ApplicationProvider>
    );
  }

  it('renders human-readable taxonomy names and does not expose internal IDs as display labels', async () => {
    renderLibrary();

    // Wait for items to load
    await waitFor(() => {
      expect(screen.getByText('Mutex Synchronization')).toBeDefined();
    });

    // Open filter panel
    const filterToggle = screen.getByRole('button', { name: /filters/i });
    fireEvent.click(filterToggle);

    // Browser navigation container should be visible
    const nav = await screen.findByRole('navigation', { name: /taxonomy hierarchy/i });
    expect(nav).toBeDefined();

    // Human readable names are present
    expect(screen.getByRole('button', { name: /^Computer Science/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /^Mathematics/i })).toBeDefined();

    // Internal ID strings should NOT be present as text nodes in the browser
    expect(screen.queryByText('comp-sci')).toBeNull();
    expect(screen.queryByText('operating-systems')).toBeNull();
  });

  it('supports semantic expand and collapse with aria-expanded attribute', async () => {
    renderLibrary();

    await waitFor(() => {
      expect(screen.getByText('Mutex Synchronization')).toBeDefined();
    });

    const filterToggle = screen.getByRole('button', { name: /filters/i });
    fireEvent.click(filterToggle);

    // Initially, Computer Science domain has an expand button
    const csExpandBtn = screen.getByRole('button', { name: /expand computer science/i });
    expect(csExpandBtn.getAttribute('aria-expanded')).toBe('false');

    // Click to expand
    fireEvent.click(csExpandBtn);
    expect(csExpandBtn.getAttribute('aria-expanded')).toBe('true');

    // Operating Systems topic is now rendered
    const osTopicBtn = screen.getByRole('button', { name: /^Operating Systems/i });
    expect(osTopicBtn).toBeDefined();

    // Topic expand button for Concurrency/Memory
    const osExpandBtn = screen.getByRole('button', { name: /expand operating systems/i });
    expect(osExpandBtn.getAttribute('aria-expanded')).toBe('false');

    fireEvent.click(osExpandBtn);
    expect(osExpandBtn.getAttribute('aria-expanded')).toBe('true');

    // Subtopics rendered
    expect(screen.getByRole('button', { name: /^Concurrency/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /^Memory Management/i })).toBeDefined();

    // Collapse again
    fireEvent.click(csExpandBtn);
    expect(csExpandBtn.getAttribute('aria-expanded')).toBe('false');
    expect(screen.queryByRole('button', { name: /^Concurrency/i })).toBeNull();
  });

  it('selecting a Domain sets Domain filter and updates query and dropdown', async () => {
    renderLibrary();

    await waitFor(() => {
      expect(screen.getByText('Mutex Synchronization')).toBeDefined();
    });

    const filterToggle = screen.getByRole('button', { name: /filters/i });
    fireEvent.click(filterToggle);

    const csDomainBtn = screen.getByRole('button', { name: /^Computer Science/i });
    fireEvent.click(csDomainBtn);

    // Filter dropdown for domain is updated to comp-sci
    const domainSelect = screen.getByLabelText(/^Domain$/i) as HTMLSelectElement;
    expect(domainSelect.value).toBe('comp-sci');

    // Node is marked selected with aria-current
    expect(csDomainBtn.getAttribute('aria-current')).toBe('true');

    // Both item 1 and item 2 match comp-sci; item 3 is in math
    expect(screen.getByText('Mutex Synchronization')).toBeDefined();
    expect(screen.getByText('Virtual Memory Paging')).toBeDefined();
  });

  it('selecting a Topic sets parent Domain + Topic and clears Subtopic', async () => {
    renderLibrary();

    await waitFor(() => {
      expect(screen.getByText('Mutex Synchronization')).toBeDefined();
    });

    const filterToggle = screen.getByRole('button', { name: /filters/i });
    fireEvent.click(filterToggle);

    // Expand Computer Science
    const csExpandBtn = screen.getByRole('button', { name: /expand computer science/i });
    fireEvent.click(csExpandBtn);

    // Select Operating Systems
    const osTopicBtn = screen.getByRole('button', { name: /^Operating Systems/i });
    fireEvent.click(osTopicBtn);

    const domainSelect = screen.getByLabelText(/^Domain$/i) as HTMLSelectElement;
    const topicSelect = screen.getByLabelText(/^Topic$/i) as HTMLSelectElement;
    const subtopicSelect = screen.getByLabelText(/^Subtopic$/i) as HTMLSelectElement;

    expect(domainSelect.value).toBe('comp-sci');
    expect(topicSelect.value).toBe('operating-systems');
    expect(subtopicSelect.value).toBe('');
    expect(osTopicBtn.getAttribute('aria-current')).toBe('true');
  });

  it('selecting a Subtopic sets its complete parent path (parent Domain, parent Topic, Subtopic)', async () => {
    renderLibrary();

    await waitFor(() => {
      expect(screen.getByText('Mutex Synchronization')).toBeDefined();
    });

    const filterToggle = screen.getByRole('button', { name: /filters/i });
    fireEvent.click(filterToggle);

    // Expand Computer Science and Operating Systems
    fireEvent.click(screen.getByRole('button', { name: /expand computer science/i }));
    fireEvent.click(screen.getByRole('button', { name: /expand operating systems/i }));

    // Click Concurrency
    const concurrencyBtn = screen.getByRole('button', { name: /^Concurrency/i });
    fireEvent.click(concurrencyBtn);

    const domainSelect = screen.getByLabelText(/^Domain$/i) as HTMLSelectElement;
    const topicSelect = screen.getByLabelText(/^Topic$/i) as HTMLSelectElement;
    const subtopicSelect = screen.getByLabelText(/^Subtopic$/i) as HTMLSelectElement;

    expect(domainSelect.value).toBe('comp-sci');
    expect(topicSelect.value).toBe('operating-systems');
    expect(subtopicSelect.value).toBe('concurrency');
    expect(concurrencyBtn.getAttribute('aria-current')).toBe('true');

    // Only Mutex Synchronization matches concurrency
    expect(screen.getByText('Mutex Synchronization')).toBeDefined();
    expect(screen.queryByText('Virtual Memory Paging')).toBeNull();
  });

  it('changes from existing dropdowns are reflected in the browse selection', async () => {
    renderLibrary();

    await waitFor(() => {
      expect(screen.getByText('Mutex Synchronization')).toBeDefined();
    });

    const filterToggle = screen.getByRole('button', { name: /filters/i });
    fireEvent.click(filterToggle);

    const domainSelect = screen.getByLabelText(/^Domain$/i);
    fireEvent.change(domainSelect, { target: { value: 'math' } });

    // Math domain in taxonomy browser is marked as selected
    const mathBtn = screen.getByRole('button', { name: /^Mathematics/i });
    expect(mathBtn.getAttribute('aria-current')).toBe('true');
  });

  it('clearing filters clears the browse selection in both representations', async () => {
    renderLibrary();

    await waitFor(() => {
      expect(screen.getByText('Mutex Synchronization')).toBeDefined();
    });

    const filterToggle = screen.getByRole('button', { name: /filters/i });
    fireEvent.click(filterToggle);

    // Select domain via tree
    const csDomainBtn = screen.getByRole('button', { name: /^Computer Science/i });
    fireEvent.click(csDomainBtn);
    expect(csDomainBtn.getAttribute('aria-current')).toBe('true');

    // Clear filters
    const clearBtn = screen.getByRole('button', { name: /clear filters/i });
    fireEvent.click(clearBtn);

    expect(csDomainBtn.getAttribute('aria-current')).toBeNull();
    const domainSelect = screen.getByLabelText(/^Domain$/i) as HTMLSelectElement;
    expect(domainSelect.value).toBe('');
  });

  it('contextual counts respect status tab and search text', async () => {
    renderLibrary();

    await waitFor(() => {
      expect(screen.getByText('Mutex Synchronization')).toBeDefined();
    });

    // In 'Current' tab: Mathematics has 0 active items (only 1 archived)
    const filterToggle = screen.getByRole('button', { name: /filters/i });
    fireEvent.click(filterToggle);

    // CS domain button shows 2 items (item 1 active + item 2 needs_review)
    expect(screen.getByRole('button', { name: /Computer Science, 2 items/i })).toBeDefined();
    // Mathematics shows 0 in current tab
    expect(screen.getByRole('button', { name: /Mathematics, 0 items/i })).toBeDefined();

    // Switch to Archived tab
    const archivedTabBtn = screen.getByRole('button', { name: /^Archived$/i });
    fireEvent.click(archivedTabBtn);

    // Mathematics now has 1 archived item, CS has 0
    expect(screen.getByRole('button', { name: /Mathematics, 1 items/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /Computer Science, 0 items/i })).toBeDefined();

    // Switch back to Current tab and apply a search query
    fireEvent.click(screen.getByRole('button', { name: /^Current$/i }));
    const searchInput = screen.getByPlaceholderText(/search knowledge/i);
    fireEvent.change(searchInput, { target: { value: 'Paging' } });

    // Only item 2 (Virtual Memory Paging) matches; CS count drops to 1
    expect(screen.getByRole('button', { name: /Computer Science, 1 items/i })).toBeDefined();
  });
});
