import React, { useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { Sparkles } from 'lucide-react';

export interface PwaUpdatePromptProps {
  /** Optional override for testing or custom hook injection */
  needRefresh?: boolean;
  onNeedRefreshChange?: (need: boolean) => void;
  onUpdateServiceWorker?: (reloadPage?: boolean) => Promise<void> | void;
}

export const PwaUpdatePrompt: React.FC<PwaUpdatePromptProps> = ({
  needRefresh: controlledNeedRefresh,
  onNeedRefreshChange,
  onUpdateServiceWorker,
}) => {
  const {
    needRefresh: [swNeedRefresh, setSwNeedRefresh],
    updateServiceWorker: swUpdateServiceWorker,
  } = useRegisterSW({
    onRegistered(registration) {
      if (registration) {
        // Registered successfully without aggressive polling
      }
    },
    onRegisterError(error) {
      console.error('Service worker registration error:', error);
    },
  });

  const [dismissed, setDismissed] = useState(false);

  // If a controlled value is provided (e.g. during test assertions), prioritize it
  const isUpdateWaiting = controlledNeedRefresh !== undefined ? controlledNeedRefresh : swNeedRefresh;
  const isVisible = isUpdateWaiting && !dismissed;

  if (!isVisible) {
    return null;
  }

  const handleUpdate = () => {
    if (onUpdateServiceWorker) {
      onUpdateServiceWorker(true);
    } else {
      swUpdateServiceWorker(true);
    }
  };

  const handleLater = () => {
    setDismissed(true);
    if (onNeedRefreshChange) {
      onNeedRefreshChange(false);
    } else {
      setSwNeedRefresh(false);
    }
  };

  return (
    <aside
      id="pwa-update-prompt"
      role="status"
      aria-live="polite"
      aria-label="MindSpark update available"
      className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-50 max-w-sm w-[calc(100vw-2rem)] sm:w-auto bg-[var(--elevated-color)] text-[var(--text-color)] border border-[var(--border-color)] rounded-xl shadow-lg p-3.5 flex flex-col sm:flex-row items-start sm:items-center gap-3 font-ui pointer-events-auto"
    >
      <div className="flex items-center gap-2.5 flex-1 min-w-0">
        <Sparkles className="w-4 h-4 text-[var(--color-primary)] shrink-0" aria-hidden="true" />
        <span className="text-xs sm:text-sm font-medium leading-tight select-none">
          MindSpark update available
        </span>
      </div>
      <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
        <button
          id="pwa-update-later-btn"
          type="button"
          onClick={handleLater}
          className="px-2.5 py-1 text-xs font-medium rounded-lg text-[var(--muted-color)] hover:text-[var(--text-color)] hover:bg-[var(--border-color)] active:scale-95 transition-all"
        >
          Later
        </button>
        <button
          id="pwa-update-now-btn"
          type="button"
          onClick={handleUpdate}
          className="px-3 py-1 text-xs font-medium rounded-lg bg-[var(--color-action-primary-bg)] text-[var(--color-action-primary-text)] hover:opacity-90 active:scale-95 transition-all"
        >
          Update now
        </button>
      </div>
    </aside>
  );
};
