import React, { useState } from 'react';
import { Download, Check, MonitorSmartphone } from 'lucide-react';
import { usePwaInstall } from './usePwaInstall';

export interface PwaInstallControlProps {
  /** Optional overrides for testing or storybooking */
  isInstalled?: boolean;
  canInstall?: boolean;
  onInstall?: () => Promise<'accepted' | 'dismissed' | null>;
}

export const PwaInstallControl: React.FC<PwaInstallControlProps> = ({
  isInstalled: controlledIsInstalled,
  canInstall: controlledCanInstall,
  onInstall: controlledOnInstall,
}) => {
  const hookState = usePwaInstall();
  const [isPrompting, setIsPrompting] = useState(false);

  const isInstalled = controlledIsInstalled !== undefined ? controlledIsInstalled : hookState.isInstalled;
  const canInstall = controlledCanInstall !== undefined ? controlledCanInstall : hookState.canInstall;
  const installFn = controlledOnInstall || hookState.install;

  const handleInstallClick = async () => {
    if (isPrompting) return;
    setIsPrompting(true);
    try {
      await installFn();
    } finally {
      setIsPrompting(false);
    }
  };

  return (
    <section
      id="settings-app-section"
      className="bg-[var(--surface-color)] border border-[var(--border-color)] rounded-xl p-6 paper-shadow"
      aria-labelledby="settings-app-heading"
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 id="settings-app-heading" className="text-xl font-semibold font-ui mb-1">
            App
          </h2>
          <p className="text-sm text-[var(--muted-color)] font-content">
            MindSpark application installability and status.
          </p>
        </div>
        <div className="p-3 rounded-full bg-[var(--bg-color)] text-[var(--color-primary)]" aria-hidden="true">
          <MonitorSmartphone className="w-6 h-6" />
        </div>
      </div>

      <div className="pt-2">
        {isInstalled ? (
          <div
            id="pwa-installed-status"
            className="flex items-center gap-2.5 p-3 rounded-xl bg-[var(--color-soft-success)] text-[var(--color-success)] text-sm font-ui"
          >
            <Check className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span className="font-semibold">Installed</span>
            <span className="text-xs text-[var(--muted-color)] ml-auto">
              Running as standalone PWA
            </span>
          </div>
        ) : canInstall ? (
          <div className="space-y-3">
            <button
              id="pwa-install-btn"
              type="button"
              onClick={handleInstallClick}
              disabled={isPrompting}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[var(--color-action-primary-bg)] text-[var(--color-action-primary-text)] rounded-xl font-medium font-ui hover:opacity-90 active:scale-95 transition-all disabled:opacity-50"
            >
              <Download className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>Install MindSpark</span>
            </button>
            <p className="text-xs text-[var(--muted-color)] font-ui">
              Installs MindSpark as an offline-ready standalone application on your device.
            </p>
          </div>
        ) : (
          <div id="pwa-unsupported-note" className="p-3 bg-[var(--bg-color)] border border-[var(--border-color)] rounded-xl">
            <p className="text-xs text-[var(--muted-color)] font-ui leading-relaxed">
              Install from your browser's app/install menu.
            </p>
          </div>
        )}
      </div>
    </section>
  );
};
