import { describe, expect, it, vi } from 'vitest';
import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { LibraryView } from '../LibraryView';
import { ApplicationProvider } from '../../../application/ApplicationContext';
import { BulkLifecycleError, MAX_BULK_LIFECYCLE_ITEMS } from '../../../domain/lifecycle';
import type { KnowledgeItem, KnowledgeStatus } from '../../../domain/knowledge';
import { createInMemoryRepositories } from '../../../persistence/memory/inMemoryRepositories';

function itemId(index: number): string {
  return `10000000-0000-4000-8000-${String(index).padStart(12, '0')}`;
}

function makeItem(index: number, status: KnowledgeStatus = 'active'): KnowledgeItem {
  return {
    id: itemId(index),
    schemaVersion: 1,
    title: `Knowledge item ${index}`,
    content: `Content ${index}`,
    taxonomy: { domainId: 'computing', topicId: 'algorithms', subtopicId: 'sorting' },
    status,
    createdAt: '2026-09-01T10:00:00.000Z',
    updatedAt: '2026-09-01T10:00:00.000Z',
  };
}

async function setupRepositories(items: KnowledgeItem[]) {
  const repos = createInMemoryRepositories();
  await Promise.all(items.map((item) => repos.knowledge.create(item)));
  return repos;
}

function renderLibrary(repos: Awaited<ReturnType<typeof setupRepositories>>) {
  render(
    <ApplicationProvider customRepos={repos} isDev={true}>
      <LibraryView />
    </ApplicationProvider>
  );
}

async function waitForItem(index: number): Promise<void> {
  await waitFor(() => expect(screen.getByText(`Knowledge item ${index}`)).toBeDefined());
}

function enterSelectMode(): void {
  fireEvent.click(screen.getByTestId('library-select-mode-btn'));
}

function checkbox(index: number): HTMLInputElement {
  return screen.getByTestId(`select-item-checkbox-${itemId(index)}`) as HTMLInputElement;
}

describe('Library bulk Archive / Restore UI (C5-3)', () => {
  it('exposes Archive selected in Current and Needs Attention, and Restore selected in Archived', async () => {
    const repos = await setupRepositories([makeItem(1), makeItem(2, 'needs_review'), makeItem(3, 'archived')]);
    renderLibrary(repos);
    await waitForItem(1);

    enterSelectMode();
    expect(screen.getByRole('button', { name: /^Archive selected$/i })).toBeDefined();
    expect(screen.queryByRole('button', { name: /^Restore selected$/i })).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: /^Needs Attention$/i }));
    await waitForItem(2);
    expect(screen.getByRole('button', { name: /^Archive selected$/i })).toBeDefined();

    fireEvent.click(screen.getByRole('button', { name: /^Archived$/i }));
    await waitForItem(3);
    expect(screen.getByRole('button', { name: /^Restore selected$/i })).toBeDefined();
    expect(screen.queryByRole('button', { name: /^Archive selected$/i })).toBeNull();
  });

  it('cannot submit with zero selected IDs and makes no repository bulk call', async () => {
    const repos = await setupRepositories([makeItem(1)]);
    const bulkCall = vi.spyOn(repos.knowledge, 'bulkUpdateStatusAtomic');
    renderLibrary(repos);
    await waitForItem(1);

    enterSelectMode();
    const action = screen.getByRole('button', { name: /^Archive selected$/i });
    expect(action.hasAttribute('disabled')).toBe(true);
    fireEvent.click(action);
    expect(bulkCall).not.toHaveBeenCalled();
  });

  it('archives selected Current items through exactly one bulk operation, then exits Select mode', async () => {
    const repos = await setupRepositories([makeItem(1), makeItem(2)]);
    const bulkCall = vi.spyOn(repos.knowledge, 'bulkUpdateStatusAtomic');
    renderLibrary(repos);
    await waitForItem(1);

    enterSelectMode();
    fireEvent.click(checkbox(1));
    fireEvent.click(checkbox(2));
    fireEvent.click(screen.getByRole('button', { name: /^Archive selected$/i }));

    await waitFor(() => expect(screen.getByTestId('library-select-mode-btn')).toBeDefined());
    expect(bulkCall).toHaveBeenCalledTimes(1);
    expect(bulkCall.mock.calls[0][0]).toEqual([itemId(1), itemId(2)]);
    expect((await repos.knowledge.get(itemId(1)))?.status).toBe('archived');
    expect((await repos.knowledge.get(itemId(2)))?.status).toBe('archived');

    fireEvent.click(screen.getByRole('button', { name: /^Archived$/i }));
    await waitForItem(1);
    expect(screen.getByText('Knowledge item 2')).toBeDefined();
  });

  it('restores selected Archived items to Current and exits Select mode', async () => {
    const repos = await setupRepositories([makeItem(1, 'archived')]);
    renderLibrary(repos);
    await waitFor(() => expect(screen.getByRole('button', { name: /^Archived$/i })).toBeDefined());

    fireEvent.click(screen.getByRole('button', { name: /^Archived$/i }));
    await waitForItem(1);
    enterSelectMode();
    fireEvent.click(checkbox(1));
    fireEvent.click(screen.getByRole('button', { name: /^Restore selected$/i }));

    await waitFor(() => expect(screen.getByTestId('library-select-mode-btn')).toBeDefined());
    expect((await repos.knowledge.get(itemId(1)))?.status).toBe('active');
    fireEvent.click(screen.getByRole('button', { name: /^Current$/i }));
    await waitForItem(1);
  });

  it('shows the typed failure mapping while preserving selection, Select mode, and statuses', async () => {
    const repos = await setupRepositories([makeItem(1)]);
    repos.knowledge.bulkUpdateStatusAtomic = vi.fn(async () => {
      throw new BulkLifecycleError('authentication_required', 'ignored by the UI mapping');
    });
    renderLibrary(repos);
    await waitForItem(1);

    enterSelectMode();
    fireEvent.click(checkbox(1));
    fireEvent.click(screen.getByRole('button', { name: /^Archive selected$/i }));

    await waitFor(() => {
      expect(screen.getByTestId('bulk-lifecycle-error').textContent).toContain('Sign in to perform bulk lifecycle actions.');
    });
    expect(screen.getByTestId('selection-toolbar')).toBeDefined();
    expect(screen.getByTestId('selected-count').textContent).toContain('1 selected');
    expect((await repos.knowledge.get(itemId(1)))?.status).toBe('active');
  });

  it('prevents duplicate submission and disables selection-mutating controls while pending', async () => {
    const repos = await setupRepositories([makeItem(1)]);
    let resolveBulk: (items: KnowledgeItem[]) => void = () => {};
    const pendingBulk = new Promise<KnowledgeItem[]>((resolve) => {
      resolveBulk = resolve;
    });
    const bulkCall = vi.fn(() => pendingBulk);
    repos.knowledge.bulkUpdateStatusAtomic = bulkCall;
    renderLibrary(repos);
    await waitForItem(1);

    enterSelectMode();
    fireEvent.click(checkbox(1));
    const action = screen.getByRole('button', { name: /^Archive selected$/i });
    fireEvent.click(action);
    fireEvent.click(action);

    expect(bulkCall).toHaveBeenCalledTimes(1);
    expect(action.hasAttribute('disabled')).toBe(true);
    expect(screen.getByTestId('select-visible-btn').hasAttribute('disabled')).toBe(true);
    expect(screen.getByTestId('cancel-select-btn').hasAttribute('disabled')).toBe(true);
    expect(checkbox(1).disabled).toBe(true);

    resolveBulk([makeItem(1, 'archived')]);
    await waitFor(() => expect(screen.getByTestId('library-select-mode-btn')).toBeDefined());
  });

  it('Select visible selects all visible results when the result count is within the cap', async () => {
    const repos = await setupRepositories([makeItem(1), makeItem(2)]);
    renderLibrary(repos);
    await waitForItem(1);

    enterSelectMode();
    fireEvent.click(screen.getByTestId('select-visible-btn'));
    expect(screen.getByTestId('selected-count').textContent).toContain('2 selected');
    expect(checkbox(1).checked).toBe(true);
    expect(checkbox(2).checked).toBe(true);
  });

  it('Select visible rejects more than the cap without partially changing the prior selection', async () => {
    const repos = await setupRepositories(
      Array.from({ length: MAX_BULK_LIFECYCLE_ITEMS + 1 }, (_, index) => makeItem(index + 1))
    );
    const bulkCall = vi.spyOn(repos.knowledge, 'bulkUpdateStatusAtomic');
    renderLibrary(repos);
    await waitForItem(1);

    enterSelectMode();
    fireEvent.click(checkbox(1));
    fireEvent.click(screen.getByTestId('select-visible-btn'));

    expect(screen.getByTestId('selected-count').textContent).toContain('1 selected');
    expect(checkbox(1).checked).toBe(true);
    expect(screen.getByTestId('bulk-lifecycle-error').textContent).toContain(String(MAX_BULK_LIFECYCLE_ITEMS));
    expect(bulkCall).not.toHaveBeenCalled();
  });

});
