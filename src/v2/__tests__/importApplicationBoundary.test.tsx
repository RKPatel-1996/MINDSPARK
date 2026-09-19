import { describe, it, expect, beforeEach } from 'vitest';
import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import { ApplicationProvider, useApplication } from '../application/ApplicationContext';
import { DuplicateImportError, isDuplicateImportError } from '../application/importService';
import { SEED_PACKETS } from '../application/seedData';
import { createInMemoryRepositories } from '../persistence/memory/inMemoryRepositories';
import type { Repositories } from '../application/types';

describe('Import Application Boundary', () => {
  let customRepos: Repositories;

  beforeEach(() => {
    customRepos = createInMemoryRepositories();
  });

  it('successful application-level import exposes knowledgeItem and cards and triggers refresh', async () => {
    const { result } = renderHook(() => useApplication(), {
      wrapper: ({ children }) => (
        <ApplicationProvider isDev={true} customRepos={customRepos}>
          {children}
        </ApplicationProvider>
      ),
    });

    // Wait for bootstrap
    await waitFor(() => {
      expect(result.current.isBootstrapped).toBe(true);
    });

    const initialRefreshCount = result.current.refreshCount;

    let importRes: any;
    await act(async () => {
      importRes = await result.current.importPacket(SEED_PACKETS[0]);
    });

    // Validates the contract
    expect(importRes).toBeDefined();
    expect(importRes.knowledgeItem).toBeDefined();
    expect(importRes.knowledgeItem.title).toBe(SEED_PACKETS[0].item.title);
    expect(importRes.cards).toBeDefined();
    expect(importRes.cards.length).toBeGreaterThan(0);
    expect(importRes.initialStates).toBeDefined();

    expect(result.current.refreshCount).toBeGreaterThan(initialRefreshCount);
    
    // verify persistence
    const items = await customRepos.knowledge.list();
    expect(items.length).toBe(1);
  });

  it('duplicate import throws the duplicate error and skips refresh and persistence writes', async () => {
    const { result } = renderHook(() => useApplication(), {
      wrapper: ({ children }) => (
        <ApplicationProvider isDev={true} customRepos={customRepos}>
          {children}
        </ApplicationProvider>
      ),
    });

    await waitFor(() => {
      expect(result.current.isBootstrapped).toBe(true);
    });

    // First import (success)
    await act(async () => {
      await result.current.importPacket(SEED_PACKETS[0]);
    });

    const refreshCountAfterFirst = result.current.refreshCount;

    // Second import (duplicate)
    let errorCaught: Error | null = null;
    await act(async () => {
      try {
        await result.current.importPacket(SEED_PACKETS[0]);
      } catch (err: any) {
        errorCaught = err;
      }
    });

    expect(errorCaught).not.toBeNull();
    expect(errorCaught).toBeInstanceOf(DuplicateImportError);
    expect(isDuplicateImportError(errorCaught)).toBe(true);
    expect((errorCaught as DuplicateImportError).code).toBe('duplicate');
    expect((errorCaught as DuplicateImportError).fingerprint).toBeDefined();
    expect((errorCaught as DuplicateImportError).existingKnowledgeItemId).toBeDefined();
    expect(errorCaught?.message).toMatch(/Duplicate import detected/i);

    // Refresh count should not increase on failure
    expect(result.current.refreshCount).toBe(refreshCountAfterFirst);

    // Should only have 1 item persisted (no second write)
    const items = await customRepos.knowledge.list();
    expect(items.length).toBe(1);
  });

  it('inspectImportPacket returns inspection preview without persistence writes or refresh count increments', async () => {
    const { result } = renderHook(() => useApplication(), {
      wrapper: ({ children }) => (
        <ApplicationProvider isDev={true} customRepos={customRepos}>
          {children}
        </ApplicationProvider>
      ),
    });

    await waitFor(() => {
      expect(result.current.isBootstrapped).toBe(true);
    });

    const initialRefreshCount = result.current.refreshCount;

    // Inspect unique packet
    let inspection: any;
    await act(async () => {
      inspection = await result.current.inspectImportPacket(SEED_PACKETS[0]);
    });

    expect(inspection).toBeDefined();
    expect(inspection.ok).toBe(true);
    expect(inspection.status).toBe('ready');
    expect(inspection.preview.title).toBe(SEED_PACKETS[0].item.title);
    expect(result.current.refreshCount).toBe(initialRefreshCount);

    // Verify 0 persistence writes
    const itemsAfterInspect = await customRepos.knowledge.list();
    expect(itemsAfterInspect.length).toBe(0);

    // Import packet
    await act(async () => {
      await result.current.importPacket(SEED_PACKETS[0]);
    });
    const refreshCountAfterImport = result.current.refreshCount;
    expect(refreshCountAfterImport).toBeGreaterThan(initialRefreshCount);

    // Inspect again -> duplicate detected
    let duplicateInspection: any;
    await act(async () => {
      duplicateInspection = await result.current.inspectImportPacket(SEED_PACKETS[0]);
    });

    expect(duplicateInspection.ok).toBe(false);
    expect(duplicateInspection.status).toBe('duplicate');
    expect(duplicateInspection.existingKnowledgeItemId).toBeDefined();
    expect(duplicateInspection.existingKnowledgeItemId).toBe(itemsAfterInspect[0]?.id ?? (await customRepos.knowledge.list())[0].id);

    // Refresh count should still remain unchanged
    expect(result.current.refreshCount).toBe(refreshCountAfterImport);
  });
});
