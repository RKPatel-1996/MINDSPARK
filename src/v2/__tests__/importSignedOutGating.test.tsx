import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ApplicationProvider, useApplication } from '../application/ApplicationContext';
import { ImportKnowledgeSection } from '../app/settings/ImportKnowledgeSection';
import { SEED_PACKETS } from '../application/seedData';

// Mock firebaseAuth and getFirestoreDb to simulate configured Firebase with signed-out user
vi.mock('../auth/firebaseAuth', async (importOriginal) => {
  const actual = await importOriginal<Record<string, any>>();
  return {
    ...actual,
    isFirebaseConfigured: true,
    app: { name: '[DEFAULT]' },
    auth: null,
    getCurrentUser: () => null,
    observeAuthState: (cb: (user: any) => void) => {
      cb(null);
      return () => {};
    },
    signInWithGooglePopup: vi.fn(),
    signOut: vi.fn(),
  };
});

vi.mock('../persistence/firebase/config', () => ({
  getFirestoreDb: () => ({} as any),
  getFirestoreInitializationError: () => null,
}));

describe('Signed-Out & Unconfigured Import Gating (Audit Repair)', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('signed-out user sees authentication notice, preview remains inspectable, but Import button is disabled and non-actionable', async () => {
    render(
      <ApplicationProvider isDev={true}>
        <ImportKnowledgeSection debounceMs={20} />
      </ApplicationProvider>
    );

    // 1. Clear authentication banner is displayed
    await waitFor(() => {
      expect(screen.getByText(/Authentication required:/i)).toBeDefined();
      expect(
        screen.getByText(/Sign in to import and persist knowledge packets in your personal library/i)
      ).toBeDefined();
    });

    // 2. Textarea allows pasting packet for inspection
    const textarea = screen.getByLabelText(/MindSpark JSON packet/i) as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: JSON.stringify(SEED_PACKETS[0]) } });

    // 3. Inspection preview appears as "Ready to Import"
    await waitFor(() => {
      expect(screen.getByText(SEED_PACKETS[0].item.title)).toBeDefined();
      expect(screen.getByText(/Ready to Import/i)).toBeDefined();
    });

    // 4. Import button is strictly disabled and indicates auth requirement
    const importBtn = screen.getByRole('button', { name: /Import Packet/i }) as HTMLButtonElement;
    expect(importBtn.disabled).toBe(true);
    expect(importBtn.getAttribute('title')).toContain('Authentication required');

    // 5. Clicking disabled button does not trigger import persistence or throw unhandled errors
    fireEvent.click(importBtn);
    expect(screen.queryByText(/Successfully imported/i)).toBeNull();
    expect(importBtn.disabled).toBe(true);
  });

  it('explicit ephemeral developer mode retains full functional import and persistence without weakening', async () => {
    // Custom repos simulate explicit dev in-memory mode
    const { createInMemoryRepositories } = await import('../persistence/memory/inMemoryRepositories');
    const customRepos = createInMemoryRepositories();

    render(
      <ApplicationProvider isDev={true} customRepos={customRepos}>
        <ImportKnowledgeSection debounceMs={20} />
      </ApplicationProvider>
    );

    // No authentication or configuration warning banner is rendered
    expect(screen.queryByText(/Authentication required:/i)).toBeNull();
    expect(screen.queryByText(/Configuration required:/i)).toBeNull();

    // Paste valid packet
    const textarea = screen.getByLabelText(/MindSpark JSON packet/i) as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: JSON.stringify(SEED_PACKETS[0]) } });

    await waitFor(() => {
      expect(screen.getByText(SEED_PACKETS[0].item.title)).toBeDefined();
    });

    const importBtn = screen.getByRole('button', { name: /Import Packet/i }) as HTMLButtonElement;
    expect(importBtn.disabled).toBe(false);

    // Import succeeds in ephemeral dev mode
    fireEvent.click(importBtn);

    await waitFor(() => {
      expect(screen.getByRole('status')).toBeDefined();
      expect(screen.getByText(/Successfully imported/i)).toBeDefined();
    });

    const items = await customRepos.knowledge.list();
    expect(items.length).toBe(1);
    expect(items[0].title).toBe(SEED_PACKETS[0].item.title);
  });
});
