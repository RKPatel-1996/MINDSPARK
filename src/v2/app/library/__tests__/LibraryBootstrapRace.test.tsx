import React from 'react';
import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { KnowledgeItemWithCards } from '../../../application/types';

const applicationHarness = vi.hoisted(() => ({
  current: null as any,
}));

vi.mock('../../../application', async () => {
  const actual = await vi.importActual<Record<string, unknown>>('../../../application');
  return {
    ...actual,
    useApplication: () => applicationHarness.current,
  };
});

import { LibraryView } from '../LibraryView';

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

const cloudItem: KnowledgeItemWithCards = {
  item: {
    id: '11111111-1111-4111-8111-111111111111',
    schemaVersion: 1,
    title: 'Fresh cloud item',
    content: 'Persisted Firestore content.',
    taxonomy: {
      domainId: 'computing',
      topicId: 'linux',
      subtopicId: 'shell',
    },
    tags: ['concept'],
    status: 'active',
    createdAt: '2026-09-26T00:00:00.000Z',
    updatedAt: '2026-09-26T00:00:00.000Z',
  },
  cards: [],
  cardStates: {},
};

function contextFor(
  libraryService: { listKnowledgeItems: () => Promise<KnowledgeItemWithCards[]> },
  isBootstrapped: boolean,
) {
  return {
    repos: {
      taxonomy: {
        get: vi.fn().mockResolvedValue(null),
      },
    },
    libraryService,
    seedLibrary: vi.fn(),
    refreshCount: 0,
    triggerRefresh: vi.fn(),
    transitionKnowledgeItemLifecycle: vi.fn(),
    bulkTransitionKnowledgeItemStatus: vi.fn(),
    isSignedOut: false,
    isUnconfigured: false,
    isEphemeralDev: false,
    isDev: true,
    isBootstrapped,
  };
}

afterEach(() => {
  applicationHarness.current = null;
  cleanup();
  vi.clearAllMocks();
});

describe('Library bootstrap authority', () => {
  it('waits for bootstrap and ignores a stale repository load after authority changes', async () => {
    const stale = deferred<KnowledgeItemWithCards[]>();
    const staleList = vi.fn(() => stale.promise);
    const freshList = vi.fn().mockResolvedValue([cloudItem]);

    applicationHarness.current = contextFor(
      { listKnowledgeItems: staleList },
      false,
    );

    const view = render(<LibraryView />);

    expect(staleList).not.toHaveBeenCalled();

    applicationHarness.current = contextFor(
      { listKnowledgeItems: staleList },
      true,
    );
    view.rerender(<LibraryView />);

    await waitFor(() => expect(staleList).toHaveBeenCalledTimes(1));

    applicationHarness.current = contextFor(
      { listKnowledgeItems: freshList },
      true,
    );
    view.rerender(<LibraryView />);

    await waitFor(() => {
      expect(screen.getByText('Fresh cloud item')).toBeDefined();
    });

    await act(async () => {
      stale.resolve([]);
      await stale.promise;
    });

    expect(screen.getByText('Fresh cloud item')).toBeDefined();
    expect(freshList).toHaveBeenCalledTimes(1);
  });
});
