import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { PwaUpdatePrompt } from '../PwaUpdatePrompt';

// Mock virtual:pwa-register/react
const mockSetNeedRefresh = vi.fn();
const mockUpdateServiceWorker = vi.fn();
let mockNeedRefreshValue = false;

vi.mock('virtual:pwa-register/react', () => ({
  useRegisterSW: vi.fn((_options) => ({
    needRefresh: [mockNeedRefreshValue, mockSetNeedRefresh],
    offlineReady: [false, vi.fn()],
    updateServiceWorker: mockUpdateServiceWorker,
  })),
}));

describe('PwaUpdatePrompt Lifecycle UI', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNeedRefreshValue = false;
  });

  it('no update available → prompt absent', () => {
    render(<PwaUpdatePrompt needRefresh={false} />);
    expect(screen.queryByText('MindSpark update available')).toBeNull();
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('update available → prompt appears with non-blocking status role and required actions', () => {
    render(<PwaUpdatePrompt needRefresh={true} />);

    const alert = screen.getByRole('status');
    expect(alert).not.toBeNull();
    expect(alert.getAttribute('aria-live')).toBe('polite');
    expect(screen.getByText('MindSpark update available')).not.toBeNull();

    const updateBtn = screen.getByRole('button', { name: 'Update now' });
    const laterBtn = screen.getByRole('button', { name: 'Later' });

    expect(updateBtn).not.toBeNull();
    expect(laterBtn).not.toBeNull();
  });

  it('Later → prompt disappears without requesting activation', () => {
    const onNeedRefreshChange = vi.fn();
    const onUpdateServiceWorker = vi.fn();

    render(
      <PwaUpdatePrompt
        needRefresh={true}
        onNeedRefreshChange={onNeedRefreshChange}
        onUpdateServiceWorker={onUpdateServiceWorker}
      />
    );

    const laterBtn = screen.getByRole('button', { name: 'Later' });
    act(() => {
      fireEvent.click(laterBtn);
    });

    // Prompt disappears from DOM
    expect(screen.queryByText('MindSpark update available')).toBeNull();

    // Dismissed for current session
    expect(onNeedRefreshChange).toHaveBeenCalledWith(false);

    // Activation was NOT requested - waiting service worker remains intact
    expect(onUpdateServiceWorker).not.toHaveBeenCalled();
  });

  it('Update now → invokes the service-worker update function', () => {
    const onUpdateServiceWorker = vi.fn();

    render(
      <PwaUpdatePrompt
        needRefresh={true}
        onUpdateServiceWorker={onUpdateServiceWorker}
      />
    );

    const updateBtn = screen.getByRole('button', { name: 'Update now' });
    act(() => {
      fireEvent.click(updateBtn);
    });

    expect(onUpdateServiceWorker).toHaveBeenCalledTimes(1);
    expect(onUpdateServiceWorker).toHaveBeenCalledWith(true);
  });

  it('prompt does not automatically reload or steal focus when appearing during active interactions', () => {
    // Set up a mock text input simulating active review typing/shortcut focus
    const container = document.createElement('div');
    document.body.appendChild(container);

    const input = document.createElement('input');
    input.id = 'active-review-input';
    document.body.appendChild(input);
    input.focus();

    expect(document.activeElement).toBe(input);

    const reloadSpy = vi.fn();
    Object.defineProperty(window, 'location', {
      writable: true,
      value: { ...window.location, reload: reloadSpy },
    });

    // Render prompt while user has focus on input
    render(<PwaUpdatePrompt needRefresh={true} />);

    // Critical requirement: focus must NOT be stolen from active control
    expect(document.activeElement).toBe(input);

    // Prompt buttons must NOT have autofocus attribute
    const updateBtn = screen.getByRole('button', { name: 'Update now' });
    const laterBtn = screen.getByRole('button', { name: 'Later' });
    expect(updateBtn.getAttribute('autofocus')).toBeNull();
    expect(laterBtn.getAttribute('autofocus')).toBeNull();

    // No automatic reload was triggered
    expect(reloadSpy).not.toHaveBeenCalled();

    // Cleanup
    document.body.removeChild(input);
    document.body.removeChild(container);
  });

  it('seamlessly integrates with virtual:pwa-register/react hook in production mode without explicit props', () => {
    mockNeedRefreshValue = true;

    render(<PwaUpdatePrompt />);

    expect(screen.getByText('MindSpark update available')).not.toBeNull();

    const updateBtn = screen.getByRole('button', { name: 'Update now' });
    act(() => {
      fireEvent.click(updateBtn);
    });

    expect(mockUpdateServiceWorker).toHaveBeenCalledWith(true);
  });

  it('dismissing via hook mode sets swNeedRefresh to false without calling updateServiceWorker', () => {
    mockNeedRefreshValue = true;

    render(<PwaUpdatePrompt />);

    const laterBtn = screen.getByRole('button', { name: 'Later' });
    act(() => {
      fireEvent.click(laterBtn);
    });

    expect(mockSetNeedRefresh).toHaveBeenCalledWith(false);
    expect(mockUpdateServiceWorker).not.toHaveBeenCalled();
    expect(screen.queryByText('MindSpark update available')).toBeNull();
  });
});
