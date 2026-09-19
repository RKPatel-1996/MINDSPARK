import { useSyncExternalStore, useCallback } from 'react';

export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export function isStandaloneMode(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const isStandaloneMedia =
      typeof window.matchMedia === 'function' &&
      Boolean(window.matchMedia('(display-mode: standalone)').matches);
    const isIosStandalone = Boolean((window.navigator as any)?.standalone);
    return isStandaloneMedia || isIosStandalone;
  } catch {
    return false;
  }
}

// In-memory module state (never persisted to localStorage/sessionStorage)
let deferredPrompt: BeforeInstallPromptEvent | null = null;
let installedStateOverride: boolean | null = null;
const listeners = new Set<() => void>();

function notifyListeners() {
  listeners.forEach((listener) => {
    try {
      listener();
    } catch (err) {
      console.error('Error notifying PWA install listener:', err);
    }
  });
}

// Register global browser listeners once
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e: Event) => {
    // Prevent default browser infobar/banner so we do not nag the user immediately
    e.preventDefault();
    deferredPrompt = e as BeforeInstallPromptEvent;
    notifyListeners();
  });

  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    installedStateOverride = true;
    notifyListeners();
  });
}

function subscribe(callback: () => void) {
  listeners.add(callback);

  let mediaQuery: MediaQueryList | null = null;
  try {
    if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
      mediaQuery = window.matchMedia('(display-mode: standalone)');
      if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener('change', callback);
      } else if ((mediaQuery as any).addListener) {
        (mediaQuery as any).addListener(callback);
      }
    }
  } catch {
    // Ignore media query registration errors in non-standard environments
  }

  return () => {
    listeners.delete(callback);
    if (mediaQuery) {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', callback);
      } else if ((mediaQuery as any).removeListener) {
        (mediaQuery as any).removeListener(callback);
      }
    }
  };
}

export interface PwaInstallState {
  canInstall: boolean;
  isInstalled: boolean;
  install: () => Promise<'accepted' | 'dismissed' | null>;
}

export function usePwaInstall(): PwaInstallState {
  const isInstalled = useSyncExternalStore(
    subscribe,
    () => installedStateOverride ?? isStandaloneMode(),
    () => false
  );

  const canInstall = useSyncExternalStore(
    subscribe,
    () => Boolean(deferredPrompt && !(installedStateOverride ?? isStandaloneMode())),
    () => false
  );

  const install = useCallback(async (): Promise<'accepted' | 'dismissed' | null> => {
    if (!deferredPrompt) {
      return null;
    }

    const currentPrompt = deferredPrompt;
    try {
      await currentPrompt.prompt();
      const choice = await currentPrompt.userChoice;
      return choice.outcome;
    } catch (err) {
      console.error('PWA install prompt failed:', err);
      return null;
    } finally {
      // Clear the consumed event regardless of outcome
      deferredPrompt = null;
      notifyListeners();
    }
  }, []);

  return {
    canInstall,
    isInstalled,
    install,
  };
}

// Test / DI utilities
export function _setDeferredPromptForTesting(prompt: BeforeInstallPromptEvent | null) {
  deferredPrompt = prompt;
  notifyListeners();
}

export function _setInstalledStateOverrideForTesting(override: boolean | null) {
  installedStateOverride = override;
  notifyListeners();
}

export function _resetPwaInstallForTesting() {
  deferredPrompt = null;
  installedStateOverride = null;
  notifyListeners();
}
