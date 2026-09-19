import { describe, it, expect, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, act, renderHook, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ApplicationProvider, useApplication } from '../application/ApplicationContext';
import { ShellLayout } from '../app/layout/ShellLayout';
import { SettingsView } from '../app/settings/SettingsView';

describe('Ephemeral Developer Mode Lifecycle Hardening', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it('dev + opt-in → ephemeral mode active', async () => {
    const { result } = renderHook(() => useApplication(), {
      wrapper: ({ children }) => <ApplicationProvider isDev={true}>{children}</ApplicationProvider>,
    });

    expect(result.current.isDev).toBe(true);
    expect(result.current.devModeOptIn).toBe(false);
    expect(result.current.isEphemeralDev).toBe(false);

    // Opt in to dev mode
    await act(async () => {
      result.current.setDevModeOptIn(true);
    });

    expect(result.current.devModeOptIn).toBe(true);
    expect(result.current.isEphemeralDev).toBe(true);

    // In-memory repositories are now functional and permit writes
    const item = {
      id: 'ephemeral_item_1',
      title: 'Ephemeral Title',
      content: 'Ephemeral Content',
      taxonomy: { domainId: 'computing' as const, topicId: 'algorithms', subtopicId: 'sorting' },
      status: 'active' as const,
      schemaVersion: 1 as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await expect(result.current.repos.knowledge.create(item)).resolves.toBeUndefined();
    const fetched = await result.current.repos.knowledge.get('ephemeral_item_1');
    expect(fetched?.title).toBe('Ephemeral Title');
  });

  it('reconstructing the application context without carrying process/session state → ephemeral mode is OFF', async () => {
    // Session 1: User enables ephemeral mode and writes an item
    const { result: session1, unmount } = renderHook(() => useApplication(), {
      wrapper: ({ children }) => <ApplicationProvider isDev={true}>{children}</ApplicationProvider>,
    });

    act(() => {
      session1.current.setDevModeOptIn(true);
    });
    expect(session1.current.isEphemeralDev).toBe(true);

    // Ensure NO durable storage was written
    expect(localStorage.getItem('mindspark_ephemeral_dev_opt_in')).toBeNull();
    expect(sessionStorage.getItem('mindspark_ephemeral_dev_opt_in')).toBeNull();

    // User reloads the page / unmounts session 1
    unmount();

    // Session 2: A fresh application context is reconstructed
    const { result: session2 } = renderHook(() => useApplication(), {
      wrapper: ({ children }) => <ApplicationProvider isDev={true}>{children}</ApplicationProvider>,
    });

    // Must return to unconfigured, ephemeral mode OFF
    expect(session2.current.isDev).toBe(true);
    expect(session2.current.devModeOptIn).toBe(false);
    expect(session2.current.isEphemeralDev).toBe(false);
    expect(session2.current.isUnconfigured).toBe(true);

    // Repositories are mutation-rejecting unconfigured repositories
    await expect(
      session2.current.repos.knowledge.create({
        id: 'item_fresh',
        title: 'Title',
        content: 'Content',
        taxonomy: { domainId: 'computing', topicId: 'algorithms', subtopicId: 'sorting' },
        status: 'active',
        schemaVersion: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
    ).rejects.toThrow(/Configuration required/);
  });

  it('exiting ephemeral mode returns to mutation-rejecting unconfigured repositories and discards in-memory data', async () => {
    const { result } = renderHook(() => useApplication(), {
      wrapper: ({ children }) => <ApplicationProvider isDev={true}>{children}</ApplicationProvider>,
    });

    // Opt in
    act(() => {
      result.current.setDevModeOptIn(true);
    });
    expect(result.current.isEphemeralDev).toBe(true);

    // Write ephemeral item
    await result.current.repos.knowledge.create({
      id: 'transient_note',
      title: 'Transient Note',
      content: 'Will be lost',
      taxonomy: { domainId: 'computing', topicId: 'algorithms', subtopicId: 'sorting' },
      status: 'active',
      schemaVersion: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    const itemBeforeExit = await result.current.repos.knowledge.get('transient_note');
    expect(itemBeforeExit).toBeDefined();

    // Exit Ephemeral Mode via explicit action
    act(() => {
      result.current.exitEphemeralMode();
    });

    expect(result.current.devModeOptIn).toBe(false);
    expect(result.current.isEphemeralDev).toBe(false);
    expect(result.current.isUnconfigured).toBe(true);

    // Discarded: new repository is unconfigured read-only
    const items = await result.current.repos.knowledge.list();
    expect(items).toEqual([]);

    // Mutations are rejected
    await expect(
      result.current.repos.knowledge.create({
        id: 'forbidden_write',
        title: 'Forbidden',
        content: 'Forbidden',
        taxonomy: { domainId: 'computing', topicId: 'algorithms', subtopicId: 'sorting' },
        status: 'active',
        schemaVersion: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
    ).rejects.toThrow(/Configuration required/);
  });

  it('warning is shown while ephemeral mode is active and not dismissible across main destinations', async () => {
    const TestApp: React.FC = () => {
      return (
        <ApplicationProvider isDev={true}>
          <MemoryRouter initialEntries={['/review']}>
            <ShellLayout>
              <Routes>
                <Route path="/review" element={<div data-testid="review-view">Review Content</div>} />
                <Route path="/library" element={<div data-testid="library-view">Library Content</div>} />
                <Route path="/settings" element={<SettingsView />} />
              </Routes>
            </ShellLayout>
          </MemoryRouter>
        </ApplicationProvider>
      );
    };

    render(<TestApp />);

    // Initially unconfigured mode warning is displayed (ephemeral is OFF)
    expect(screen.getByText(/UNCONFIGURED FIREBASE MODE/i)).toBeDefined();
    expect(screen.queryByRole('alert', { name: /Ephemeral development mode warning/i })).toBeNull();

    // Click "Opt In to Dev Mode" button in the unconfigured banner
    await act(async () => {
      const optInButton = screen.getByRole('button', { name: /Opt In to Dev Mode/i });
      fireEvent.click(optInButton);
    });

    // Now ephemeral warning is prominently displayed
    const warning = screen.getByRole('alert', { name: /Ephemeral development mode warning/i });
    expect(warning).toBeDefined();
    expect(screen.getByText(/Ephemeral development mode:/i)).toBeDefined();
    expect(screen.getByText(/Data will be lost when this page is reloaded./i)).toBeDefined();

    // Verify warning is NOT dismissible (no close / dismiss button inside the alert)
    const alertButtons = warning.querySelectorAll('button');
    expect(alertButtons).toHaveLength(0);

    // Navigate to Settings destination via link or nav button
    await act(async () => {
      const settingsNav = screen.getAllByRole('link', { name: /Settings/i })[0];
      fireEvent.click(settingsNav);
    });

    // Warning is still shown on Settings destination
    expect(screen.getByRole('alert', { name: /Ephemeral development mode warning/i })).toBeDefined();

    // In Settings, verify the explicit "Exit Ephemeral Mode" action is present
    await act(async () => {
      const syncTab = screen.getByRole('button', { name: /sync/i });
      fireEvent.click(syncTab);
    });

    const exitButton = screen.getByRole('button', { name: /Exit Ephemeral Mode/i });
    expect(exitButton).toBeDefined();

    // Click Exit Ephemeral Mode
    await act(async () => {
      fireEvent.click(exitButton);
    });

    // Warning is now removed and unconfigured mode returns
    await waitFor(() => {
      expect(screen.queryByRole('alert', { name: /Ephemeral development mode warning/i })).toBeNull();
      expect(screen.getByText(/UNCONFIGURED FIREBASE MODE/i)).toBeDefined();
      expect(screen.getByRole('button', { name: /Opt In \(Enable\)/i })).toBeDefined();
    });
  });
});
