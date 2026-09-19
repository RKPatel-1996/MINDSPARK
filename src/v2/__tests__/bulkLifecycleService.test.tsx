import React from 'react';
import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApplicationProvider, useApplication } from '../application/ApplicationContext';
import { LibraryService } from '../application/libraryService';
import type { Repositories } from '../application/types';
import type { ReviewCard } from '../domain/card';
import type { KnowledgeItem, KnowledgeStatus } from '../domain/knowledge';
import {
  ALLOWED_LIFECYCLE_TRANSITIONS,
  MAX_BULK_LIFECYCLE_ITEMS,
  normalizeBulkLifecycleItemIds,
} from '../domain/lifecycle';
import { createInMemoryRepositories } from '../persistence/memory/inMemoryRepositories';
import { createSignedOutRepositories } from '../persistence/signedOut/signedOutRepositories';
import { createUnconfiguredRepositories } from '../persistence/unconfigured/unconfiguredRepositories';

const ID_A = '00000000-0000-4000-8000-000000000001';
const ID_B = '00000000-0000-4000-8000-000000000002';
const ID_MISSING = '00000000-0000-4000-8000-000000000099';
const CARD_ID = '00000000-0000-4000-8000-000000000101';
const CREATED_AT = '2026-01-01T00:00:00.000Z';

function makeItem(id: string, status: KnowledgeStatus = 'active'): KnowledgeItem {
  return {
    id,
    schemaVersion: 1,
    title: `Title ${id}`,
    content: `Content ${id}`,
    explanationMarkdown: `Explanation ${id}`,
    taxonomy: { domainId: 'computing', topicId: 'algorithms', subtopicId: 'sorting' },
    tags: ['shell'],
    status,
    createdAt: CREATED_AT,
    updatedAt: CREATED_AT,
    sources: [{ title: 'Source', url: 'https://example.com/source' }],
  };
}

async function createItems(repos: Repositories, ...items: KnowledgeItem[]): Promise<void> {
  for (const item of items) {
    await repos.knowledge.create(item);
  }
}

describe('C5-2 atomic bulk KnowledgeItem lifecycle', () => {
  let repos: Repositories;
  let service: LibraryService;

  beforeEach(() => {
    repos = createInMemoryRepositories();
    service = new LibraryService(repos);
  });

  it('sets the governed maximum bulk size to 100', () => {
    expect(MAX_BULK_LIFECYCLE_ITEMS).toBe(100);
  });

  it('trims and deterministically de-duplicates IDs in first-occurrence order', () => {
    expect(normalizeBulkLifecycleItemIds([` ${ID_B} `, ID_A, ID_B])).toEqual([ID_B, ID_A]);
  });

  it('rejects an empty selection with a typed code', async () => {
    const result = await service.bulkTransitionKnowledgeItemStatus([], 'archived');
    expect(result.success).toBe(false);
    if ('error' in result) expect(result.error.code).toBe('empty_selection');
  });

  it('rejects malformed, empty, and non-string IDs with a typed code', () => {
    for (const ids of [['not-a-uuid'], ['  '], [42] as unknown[]]) {
      expect(() => normalizeBulkLifecycleItemIds(ids)).toThrowError(
        expect.objectContaining({ code: 'invalid_item_id' })
      );
    }
  });

  it('rejects more than 100 unique IDs with a typed code', () => {
    const ids = Array.from(
      { length: MAX_BULK_LIFECYCLE_ITEMS + 1 },
      (_, index) => `00000000-0000-4000-8000-${String(index + 1).padStart(12, '0')}`
    );
    expect(() => normalizeBulkLifecycleItemIds(ids)).toThrowError(
      expect.objectContaining({ code: 'too_many_items' })
    );
  });

  it('archives multiple active items atomically through one repository call and one timestamp', async () => {
    await createItems(repos, makeItem(ID_A), makeItem(ID_B));
    const repositoryCall = vi.spyOn(repos.knowledge, 'bulkUpdateStatusAtomic');

    const result = await service.bulkTransitionKnowledgeItemStatus([` ${ID_A} `, ID_B, ID_A], 'archived');

    expect(repositoryCall).toHaveBeenCalledTimes(1);
    expect(repositoryCall.mock.calls[0][0]).toEqual([ID_A, ID_B]);
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.items.map((item) => item.status)).toEqual(['archived', 'archived']);
    expect(new Set(result.items.map((item) => item.updatedAt)).size).toBe(1);
    expect((await repos.knowledge.get(ID_A))?.status).toBe('archived');
    expect((await repos.knowledge.get(ID_B))?.updatedAt).toBe(result.items[0].updatedAt);
  });

  it('makes no writes when valid and invalid transitions are mixed', async () => {
    await createItems(repos, makeItem(ID_A), makeItem(ID_B, 'archived'));

    const result = await service.bulkTransitionKnowledgeItemStatus([ID_A, ID_B], 'needs_review');

    expect(result.success).toBe(false);
    if ('error' in result) expect(result.error.code).toBe('invalid_transition');
    expect(await repos.knowledge.get(ID_A)).toEqual(makeItem(ID_A));
    expect(await repos.knowledge.get(ID_B)).toEqual(makeItem(ID_B, 'archived'));
  });

  it('makes no writes when any selected item is missing', async () => {
    const original = makeItem(ID_A);
    await repos.knowledge.create(original);

    const result = await service.bulkTransitionKnowledgeItemStatus([ID_A, ID_MISSING], 'archived');

    expect(result.success).toBe(false);
    if ('error' in result) expect(result.error.code).toBe('item_not_found');
    expect(await repos.knowledge.get(ID_A)).toEqual(original);
  });

  it('leaves the exact five-transition lifecycle authority unchanged', () => {
    expect(ALLOWED_LIFECYCLE_TRANSITIONS.map(({ from, to }) => `${from}->${to}`)).toEqual([
      'active->needs_review',
      'active->archived',
      'needs_review->active',
      'needs_review->archived',
      'archived->active',
    ]);
  });

  it('changes only status and updatedAt while leaving cards untouched', async () => {
    const original = makeItem(ID_A);
    const card: ReviewCard = {
      id: CARD_ID,
      knowledgeItemId: ID_A,
      schemaVersion: 1,
      type: 'flashcard',
      front: 'Front',
      back: 'Back',
      suspended: false,
      createdAt: CREATED_AT,
      updatedAt: CREATED_AT,
    };
    await repos.knowledge.create(original);
    await repos.reviewCards.create(card);

    const result = await service.bulkTransitionKnowledgeItemStatus([ID_A], 'archived');
    expect(result.success).toBe(true);

    const persisted = await repos.knowledge.get(ID_A);
    const { status: originalStatus, updatedAt: originalUpdatedAt, ...originalStable } = original;
    const { status, updatedAt, ...persistedStable } = persisted!;
    expect(originalStatus).toBe('active');
    expect(originalUpdatedAt).toBe(CREATED_AT);
    expect(status).toBe('archived');
    expect(updatedAt).not.toBe(CREATED_AT);
    expect(persistedStable).toEqual(originalStable);
    expect(await repos.reviewCards.get(CARD_ID)).toEqual(card);
  });

  it('preserves the signed-out repository typed authentication failure', async () => {
    const result = await new LibraryService(createSignedOutRepositories())
      .bulkTransitionKnowledgeItemStatus([ID_A], 'archived');
    expect(result.success).toBe(false);
    if ('error' in result) expect(result.error.code).toBe('authentication_required');
  });

  it('preserves the unconfigured repository typed configuration failure', async () => {
    const result = await new LibraryService(createUnconfiguredRepositories())
      .bulkTransitionKnowledgeItemStatus([ID_A], 'archived');
    expect(result.success).toBe(false);
    if ('error' in result) expect(result.error.code).toBe('configuration_required');
  });

  it('converts an unexpected repository exception to persistence_failure', async () => {
    repos.knowledge.bulkUpdateStatusAtomic = vi.fn(async () => {
      throw new Error('storage unavailable');
    });

    const result = await service.bulkTransitionKnowledgeItemStatus([ID_A], 'archived');
    expect(result.success).toBe(false);
    if ('error' in result) {
      expect(result.error.code).toBe('persistence_failure');
      expect(result.error.message).toContain('storage unavailable');
    }
  });

  it('refreshes ApplicationContext exactly once on success and not at all on failure', async () => {
    await createItems(repos, makeItem(ID_A), makeItem(ID_B, 'archived'));
    const { result } = renderHook(() => useApplication(), {
      wrapper: ({ children }) => (
        <ApplicationProvider isDev={true} customRepos={repos}>{children}</ApplicationProvider>
      ),
    });
    await waitFor(() => expect(result.current.isBootstrapped).toBe(true));

    const beforeSuccess = result.current.refreshCount;
    let successResult: Awaited<ReturnType<typeof result.current.bulkTransitionKnowledgeItemStatus>>;
    await act(async () => {
      successResult = await result.current.bulkTransitionKnowledgeItemStatus([ID_A], 'archived');
    });
    expect(successResult!.success).toBe(true);
    expect(result.current.refreshCount).toBe(beforeSuccess + 1);

    const beforeFailure = result.current.refreshCount;
    let failureResult: Awaited<ReturnType<typeof result.current.bulkTransitionKnowledgeItemStatus>>;
    await act(async () => {
      failureResult = await result.current.bulkTransitionKnowledgeItemStatus([ID_B], 'needs_review');
    });
    expect(failureResult!.success).toBe(false);
    expect(result.current.refreshCount).toBe(beforeFailure);
  });
});
