import { describe, it, expect, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LibraryView } from '../LibraryView';
import { ApplicationProvider } from '../../../application/ApplicationContext';
import { createInMemoryRepositories } from '../../../persistence/memory/inMemoryRepositories';
import type { TaxonomyRegistry } from '../../../domain/taxonomy';

const testRegistry: TaxonomyRegistry = {
  domains: [{ id: 'comp-sci', name: 'Computer Science' }],
  topics: [{ id: 'operating-systems', domainId: 'comp-sci', name: 'Operating Systems' }],
  subtopics: [{ id: 'concurrency', topicId: 'operating-systems', name: 'Concurrency' }],
  allowedTags: ['kernel'],
};

function setupTestRepositories() {
  const repos = createInMemoryRepositories();
  repos.taxonomy.save(testRegistry);
  return repos;
}

describe('Library Daily Import Accessibility', () => {
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

  it('renders the "+" action with accessible name "Import knowledge" in Library header', async () => {
    renderLibrary();

    await waitFor(() => {
      const importBtn = screen.getByTestId('library-import-btn');
      expect(importBtn).toBeDefined();
      expect(importBtn.getAttribute('aria-label')).toBe('Import knowledge');
    });
  });

  it('opens the import dialog when clicking the "+" button and closes via Close button', async () => {
    renderLibrary();

    await waitFor(() => {
      expect(screen.getByTestId('library-import-btn')).toBeDefined();
    });

    // Dialog is initially closed
    expect(screen.queryByTestId('import-modal-dialog')).toBeNull();

    // Click "+"
    fireEvent.click(screen.getByTestId('library-import-btn'));

    // Dialog opens showing ImportKnowledgeSection title and textarea
    await waitFor(() => {
      expect(screen.getByTestId('import-modal-dialog')).toBeDefined();
      expect(screen.getByRole('dialog')).toBeDefined();
      expect(screen.getByRole('dialog').getAttribute('aria-modal')).toBe('true');
      expect(screen.getByRole('textbox', { name: /MindSpark JSON packet/i })).toBeDefined();
    });

    // Click explicit Close button
    const closeBtn = screen.getByTestId('import-modal-close-btn');
    fireEvent.click(closeBtn);

    await waitFor(() => {
      expect(screen.queryByTestId('import-modal-dialog')).toBeNull();
    });
  });

  it('opens the import dialog using Ctrl+I shortcut', async () => {
    renderLibrary();

    await waitFor(() => {
      expect(screen.getByTestId('library-import-btn')).toBeDefined();
    });

    expect(screen.queryByTestId('import-modal-dialog')).toBeNull();

    // Press Ctrl+I
    fireEvent.keyDown(window, { key: 'i', ctrlKey: true });

    await waitFor(() => {
      expect(screen.getByTestId('import-modal-dialog')).toBeDefined();
    });
  });

  it('ignores Ctrl+I shortcut while user is typing in an input, textarea, or select', async () => {
    renderLibrary();

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Search knowledge…')).toBeDefined();
    });

    const searchInput = screen.getByPlaceholderText('Search knowledge…');
    searchInput.focus();

    // Press Ctrl+I while focused on search input
    fireEvent.keyDown(searchInput, { key: 'i', ctrlKey: true });

    // Dialog remains closed
    expect(screen.queryByTestId('import-modal-dialog')).toBeNull();
  });

  it('closes the import dialog with Escape key even when focus is inside the import textarea', async () => {
    renderLibrary();

    await waitFor(() => {
      expect(screen.getByTestId('library-import-btn')).toBeDefined();
    });

    // Open import dialog
    fireEvent.click(screen.getByTestId('library-import-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('import-modal-dialog')).toBeDefined();
    });

    // Focus the import textarea inside the dialog
    const importTextarea = screen.getByRole('textbox', { name: /MindSpark JSON packet/i });
    importTextarea.focus();

    // Press Escape inside the textarea
    fireEvent.keyDown(importTextarea, { key: 'Escape' });

    // Dialog closes
    await waitFor(() => {
      expect(screen.queryByTestId('import-modal-dialog')).toBeNull();
    });
  });

  it('closes on backdrop click, but does not close when clicking inside the dialog content', async () => {
    renderLibrary();

    await waitFor(() => {
      expect(screen.getByTestId('library-import-btn')).toBeDefined();
    });

    // Open import dialog
    fireEvent.click(screen.getByTestId('library-import-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('import-modal-dialog')).toBeDefined();
    });

    // Click inside the dialog
    fireEvent.click(screen.getByTestId('import-modal-dialog'));

    // Dialog stays open
    expect(screen.getByTestId('import-modal-dialog')).toBeDefined();

    // Click backdrop
    fireEvent.click(screen.getByTestId('import-modal-backdrop'));

    // Dialog closes
    await waitFor(() => {
      expect(screen.queryByTestId('import-modal-dialog')).toBeNull();
    });
  });
});
