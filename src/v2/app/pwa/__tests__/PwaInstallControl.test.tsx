import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import {
  usePwaInstall,
  _setDeferredPromptForTesting,
  _setInstalledStateOverrideForTesting,
  _resetPwaInstallForTesting,
  isStandaloneMode,
  BeforeInstallPromptEvent,
} from '../usePwaInstall';
import { PwaInstallControl } from '../PwaInstallControl';
import { SettingsView } from '../../settings/SettingsView';
import { ApplicationProvider } from '../../../application';
import { createInMemoryRepositories } from '../../../persistence/memory/inMemoryRepositories';

describe('PWA Installability & Settings Control', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    _resetPwaInstallForTesting();
    // Default matchMedia mock returning matches: false
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
    delete (window.navigator as any).standalone;
  });

  afterEach(() => {
    _resetPwaInstallForTesting();
  });

  function createMockPromptEvent(outcome: 'accepted' | 'dismissed' = 'accepted') {
    const promptFn = vi.fn().mockResolvedValue(undefined);
    const userChoicePromise = Promise.resolve({
      outcome,
      platform: 'web',
    });

    const event = new Event('beforeinstallprompt') as BeforeInstallPromptEvent;
    Object.defineProperty(event, 'platforms', { value: ['web'] });
    Object.defineProperty(event, 'userChoice', { value: userChoicePromise });
    Object.defineProperty(event, 'prompt', { value: promptFn });
    vi.spyOn(event, 'preventDefault');

    return { event, promptFn };
  }

  it('1. install event unavailable → no active install button (shows restrained fallback)', () => {
    render(<PwaInstallControl />);

    // No install button should be rendered or active
    expect(screen.queryByRole('button', { name: /install mindspark/i })).toBeNull();
    expect(screen.queryByText('Installed')).toBeNull();

    // Restrained explanatory text is shown
    expect(screen.getByText("Install from your browser's app/install menu.")).not.toBeNull();
  });

  it('2. install event received → install control appears (and prevents default browser nagging banner)', () => {
    const { event } = createMockPromptEvent();

    render(<PwaInstallControl />);

    // Initially no install button
    expect(screen.queryByRole('button', { name: /install mindspark/i })).toBeNull();

    // Dispatch beforeinstallprompt via testing-library fireEvent
    fireEvent(window, event);

    // Default was prevented to avoid unexpected immediate browser popup/banner
    expect(event.preventDefault).toHaveBeenCalled();

    // Now install control button appears
    const installBtn = screen.getByRole('button', { name: /install mindspark/i });
    expect(installBtn).not.toBeNull();
  });

  it('3. clicking Install invokes the deferred browser prompt', async () => {
    const { event, promptFn } = createMockPromptEvent('accepted');

    await act(async () => {
      window.dispatchEvent(event);
    });

    render(<PwaInstallControl />);

    const installBtn = screen.getByRole('button', { name: /install mindspark/i });
    expect(installBtn).not.toBeNull();

    await act(async () => {
      fireEvent.click(installBtn);
    });

    // The deferred prompt method was called on the captured event
    expect(promptFn).toHaveBeenCalledTimes(1);
  });

  it('4. prompt result clears the consumed event (for both accepted and dismissed choices)', async () => {
    // Sub-case A: user accepts prompt
    const { event: acceptedEvent, promptFn: acceptPrompt } = createMockPromptEvent('accepted');
    await act(async () => {
      window.dispatchEvent(acceptedEvent);
    });

    const { unmount } = render(<PwaInstallControl />);
    const installBtnA = screen.getByRole('button', { name: /install mindspark/i });

    await act(async () => {
      fireEvent.click(installBtnA);
    });

    expect(acceptPrompt).toHaveBeenCalledTimes(1);
    // Button disappeared because consumed event was cleared
    expect(screen.queryByRole('button', { name: /install mindspark/i })).toBeNull();
    expect(screen.getByText("Install from your browser's app/install menu.")).not.toBeNull();

    unmount();

    // Sub-case B: user dismisses prompt
    const { event: dismissedEvent, promptFn: dismissPrompt } = createMockPromptEvent('dismissed');
    await act(async () => {
      window.dispatchEvent(dismissedEvent);
    });

    render(<PwaInstallControl />);
    const installBtnB = screen.getByRole('button', { name: /install mindspark/i });

    await act(async () => {
      fireEvent.click(installBtnB);
    });

    expect(dismissPrompt).toHaveBeenCalledTimes(1);
    // Consumed event is cleared even when dismissed
    expect(screen.queryByRole('button', { name: /install mindspark/i })).toBeNull();
    expect(screen.getByText("Install from your browser's app/install menu.")).not.toBeNull();
  });

  it('5. standalone mode shows Installed instead of install action (via matchMedia)', async () => {
    // Mock matchMedia for standalone display-mode
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: query === '(display-mode: standalone)',
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    // Even if an install event exists
    const { event } = createMockPromptEvent();
    await act(async () => {
      window.dispatchEvent(event);
    });

    render(<PwaInstallControl />);

    // Shows "Installed"
    expect(screen.getByText('Installed')).not.toBeNull();
    expect(screen.getByText(/Running as standalone PWA/i)).not.toBeNull();

    // No install button is shown
    expect(screen.queryByRole('button', { name: /install mindspark/i })).toBeNull();
  });

  it('5b. standalone mode detection works via iOS navigator.standalone', () => {
    (window.navigator as any).standalone = true;
    expect(isStandaloneMode()).toBe(true);

    render(<PwaInstallControl />);

    expect(screen.getByText('Installed')).not.toBeNull();
    expect(screen.queryByRole('button', { name: /install mindspark/i })).toBeNull();
  });

  it('6. appinstalled event updates state and clears prompt', () => {
    const { event } = createMockPromptEvent();
    _setDeferredPromptForTesting(event);

    render(<PwaInstallControl />);
    expect(screen.getByRole('button', { name: /install mindspark/i })).not.toBeNull();

    // Dispatch native appinstalled event
    fireEvent(window, new Event('appinstalled'));

    // Switches to Installed status and clears install button
    expect(screen.getByText('Installed')).not.toBeNull();
    expect(screen.queryByRole('button', { name: /install mindspark/i })).toBeNull();
  });

  it('7. SettingsView renders the App section and install control', async () => {
    const repos = createInMemoryRepositories();

    // With install event available
    const { event } = createMockPromptEvent();
    await act(async () => {
      window.dispatchEvent(event);
    });

    await act(async () => {
      render(
        <ApplicationProvider customRepos={repos}>
          <SettingsView initialTab="app" />
        </ApplicationProvider>
      );
    });

    // Section "App" is rendered
    expect(screen.getByRole('heading', { level: 2, name: 'App' })).not.toBeNull();

    // Install MindSpark button is rendered in Settings
    const installBtn = screen.getByRole('button', { name: /install mindspark/i });
    expect(installBtn).not.toBeNull();

    await act(async () => {
      fireEvent.click(installBtn);
    });

    // After install, prompt is consumed
    expect(screen.queryByRole('button', { name: /install mindspark/i })).toBeNull();
  });
});
