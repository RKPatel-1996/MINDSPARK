import React, { useState, useRef, useEffect } from 'react';
import { useThemeStore, ThemeMode, Density, TextSize, ContentFont } from '../store/themeStore';
import { useShortcutStore, ShortcutAction } from '../store/shortcutStore';
import { AlertTriangle, Cloud, CloudOff, Sparkles, Check, Loader2, BookOpen } from 'lucide-react';
import { isFirebaseConfigured, auth, signInWithGooglePopup, signOut } from '../../auth/firebaseAuth';
import { useApplication } from '../../application';
import type { Settings } from '../../persistence/repository/interfaces';
import { PwaInstallControl } from '../pwa/PwaInstallControl';
import { ImportKnowledgeSection } from './ImportKnowledgeSection';
import { TaxonomyManagementSection } from './TaxonomyManagementSection';
import { BackupRestoreSection } from './BackupRestoreSection';

export interface SettingsViewProps {
  initialTab?: 'app' | 'appearance' | 'shortcuts' | 'scheduler' | 'sync' | 'backup' | 'library';
}

export const SettingsView: React.FC<SettingsViewProps> = ({ initialTab = 'app' }) => {
  const theme = useThemeStore();
  const shortcuts = useShortcutStore();
  const {
    settingsService,
    seedLibrary,
    triggerRefresh,
    syncState,
    pendingWritesCount,
    syncError,
    isSignedOut,
    isEphemeralDev,
    isUnconfigured,
    isDev,
    devModeOptIn,
    setDevModeOptIn,
    exitEphemeralMode,
    user,
  } = useApplication();

  const [activeTab, setActiveTab] = useState<'app' | 'appearance' | 'shortcuts' | 'scheduler' | 'sync' | 'backup' | 'library'>(initialTab);
  const [editingAction, setEditingAction] = useState<ShortcutAction | null>(null);
  const [recordingBuffer, setRecordingBuffer] = useState<string>('');
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);

  // Settings State
  const [userSettings, setUserSettings] = useState<Settings | null>(null);
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsSavedMessage, setSettingsSavedMessage] = useState(false);
  const [settingsError, setSettingsError] = useState<string | null>(null);

  // Seed State
  const [seeding, setSeeding] = useState(false);
  const [seedSuccess, setSeedSuccess] = useState<string | null>(null);

  const recordingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    settingsService.getSettings().then(setUserSettings);
  }, [settingsService]);

  const handleSaveSchedulerSettings = async (updates: Partial<Settings>) => {
    if (!userSettings) return;
    setSavingSettings(true);
    setSettingsError(null);
    try {
      const updated = await settingsService.updateSettings(updates);
      setUserSettings(updated);
      setSettingsSavedMessage(true);
      setTimeout(() => setSettingsSavedMessage(false), 2500);
      triggerRefresh();
    } catch (err: any) {
      setSettingsError(err.message || 'Failed to save settings');
    } finally {
      setSavingSettings(false);
    }
  };

  const startEditing = (action: ShortcutAction) => {
    setEditingAction(action);
    setRecordingBuffer('');
    setDuplicateWarning(null);
  };

  const handleShortcutKeydown = (e: React.KeyboardEvent, action: ShortcutAction) => {
    e.preventDefault();
    if (e.key === 'Escape') {
      setEditingAction(null);
      setRecordingBuffer('');
      return;
    }

    const key = e.key === ' ' ? ' ' : e.key;
    if (key === 'Enter' || key.length === 1) {
      const newBuffer = recordingBuffer ? `${recordingBuffer} ${key}` : key;
      setRecordingBuffer(newBuffer);

      if (recordingTimeoutRef.current) clearTimeout(recordingTimeoutRef.current);

      recordingTimeoutRef.current = setTimeout(() => {
        const existingEntry = Object.entries(shortcuts.shortcuts).find(
          ([act, seq]) => act !== action && seq.toLowerCase() === newBuffer.toLowerCase()
        );
        if (existingEntry) {
          setDuplicateWarning(`Shortcut "${newBuffer}" is already assigned to "${existingEntry[0]}"`);
          setRecordingBuffer('');
        } else {
          shortcuts.setShortcut(action, newBuffer);
          setEditingAction(null);
        }
      }, 500);
    }
  };

  const handleAuth = async () => {
    if (!auth) return;
    if (auth.currentUser && !auth.currentUser.isAnonymous) {
      await signOut();
    } else {
      await signInWithGooglePopup();
    }
  };

  const handleSeedLibrary = async () => {
    setSeeding(true);
    setSeedSuccess(null);
    try {
      const result = await seedLibrary();
      setSeedSuccess(`Successfully seeded ${result.itemsSeeded} items with ${result.cardsSeeded} cards.`);
    } catch (err: any) {
      alert(`Seeding failed: ${err.message}`);
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="flex flex-col h-full content-container pt-safe">
      <div className="px-6 py-6 border-b border-[var(--border-color)]">
        <h1 className="text-3xl font-semibold font-ui">Settings</h1>
      </div>

      <div className="flex border-b border-[var(--border-color)] overflow-x-auto">
        {(['app', 'appearance', 'shortcuts', 'scheduler', 'sync', 'backup', 'library'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-4 font-medium text-sm whitespace-nowrap transition-colors border-b-2 font-ui uppercase tracking-wider ${
              activeTab === tab
                ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
                : 'border-transparent text-[var(--muted-color)] hover:text-[var(--text-color)]'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-6 pb-safe">
        <div className="animate-in fade-in slide-in-from-top-2 duration-300 max-w-3xl">
          {/* App Tab */}
          {activeTab === 'app' && (
            <div className="space-y-8 max-w-2xl">
              <PwaInstallControl />
            </div>
          )}

          {/* Appearance Tab */}
          {activeTab === 'appearance' && (
            <div className="space-y-12 max-w-2xl">
              <section>
                <h2 className="text-xl font-semibold mb-6 font-ui">Theme</h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {(['system', 'light', 'dark', 'oled'] as const).map((mode: ThemeMode) => (
                    <button
                      key={mode}
                      onClick={() => theme.setMode(mode)}
                      className={`p-4 rounded-xl border-2 text-center transition-all ${
                        theme.mode === mode
                          ? 'border-[var(--color-primary)] bg-[var(--color-soft-primary)]'
                          : 'border-[var(--border-color)] bg-[var(--surface-color)] hover:border-[var(--muted-color)]'
                      }`}
                    >
                      <span className="block font-medium capitalize font-ui">{mode}</span>
                    </button>
                  ))}
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-6 font-ui">Layout Density</h2>
                <div className="grid grid-cols-2 gap-4">
                  {(['compact', 'comfortable'] as const).map((d: Density) => (
                    <button
                      key={d}
                      onClick={() => theme.setDensity(d)}
                      className={`p-4 rounded-xl border-2 text-center transition-all ${
                        theme.density === d
                          ? 'border-[var(--color-primary)] bg-[var(--color-soft-primary)]'
                          : 'border-[var(--border-color)] bg-[var(--surface-color)] hover:border-[var(--muted-color)]'
                      }`}
                    >
                      <span className="block font-medium capitalize font-ui">{d}</span>
                    </button>
                  ))}
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-6 font-ui">Text Size</h2>
                <div className="grid grid-cols-3 gap-4">
                  {(['small', 'default', 'large'] as const).map((size: TextSize) => (
                    <button
                      key={size}
                      onClick={() => theme.setTextSize(size)}
                      className={`p-4 rounded-xl border-2 text-center transition-all ${
                        theme.textSize === size
                          ? 'border-[var(--color-primary)] bg-[var(--color-soft-primary)]'
                          : 'border-[var(--border-color)] bg-[var(--surface-color)] hover:border-[var(--muted-color)]'
                      }`}
                    >
                      <span className="block font-medium capitalize font-ui">{size}</span>
                    </button>
                  ))}
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-6 font-ui">Content Font</h2>
                <div className="grid grid-cols-2 gap-4">
                  {(['sans', 'serif'] as const).map((font: ContentFont) => (
                    <button
                      key={font}
                      onClick={() => theme.setContentFont(font)}
                      className={`p-4 rounded-xl border-2 text-center transition-all ${
                        theme.contentFont === font
                          ? 'border-[var(--color-primary)] bg-[var(--color-soft-primary)]'
                          : 'border-[var(--border-color)] bg-[var(--surface-color)] hover:border-[var(--muted-color)]'
                      }`}
                    >
                      <span className={`block font-medium capitalize ${font === 'serif' ? 'font-serif' : 'font-sans'}`}>
                        {font}
                      </span>
                    </button>
                  ))}
                </div>
              </section>
            </div>
          )}

          {/* Shortcuts Tab */}
          {activeTab === 'shortcuts' && (
            <div className="space-y-6 max-w-2xl">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold font-ui">Keyboard Shortcuts</h2>
                <button
                  onClick={() => shortcuts.restoreDefaults()}
                  className="text-xs text-[var(--muted-color)] hover:text-[var(--text-color)] font-ui underline"
                >
                  Reset to defaults
                </button>
              </div>

              {duplicateWarning && (
                <div className="p-3 bg-[var(--color-soft-error)] text-[var(--color-error)] rounded-lg text-sm mb-4 font-ui">
                  {duplicateWarning}
                </div>
              )}

              <div className="divide-y divide-[var(--border-color)] border border-[var(--border-color)] rounded-xl bg-[var(--surface-color)] overflow-hidden">
                {Object.entries(shortcuts.shortcuts).map(([actionKey, sequence]) => {
                  const action = actionKey as ShortcutAction;
                  const isEditingThis = editingAction === action;

                  return (
                    <div key={action} className="flex items-center justify-between p-4 font-ui">
                      <span className="text-sm font-medium capitalize text-[var(--text-color)]">
                        {action.replace('.', ' › ').replace('_', ' ')}
                      </span>

                      <div>
                        {isEditingThis ? (
                          <input
                            autoFocus
                            type="text"
                            value={recordingBuffer || 'Press keys...'}
                            readOnly
                            onKeyDown={(e) => handleShortcutKeydown(e, action)}
                            className="px-3 py-1 bg-[var(--bg-color)] border border-[var(--color-primary)] rounded-lg text-xs font-mono ring-2 ring-[var(--color-primary)] text-center focus:outline-none"
                          />
                        ) : (
                          <button
                            onClick={() => startEditing(action)}
                            className="px-3 py-1 bg-[var(--elevated-color)] border border-[var(--border-color)] hover:border-[var(--color-primary)] rounded-lg text-xs font-mono transition-colors"
                          >
                            {sequence}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Scheduler Tab */}
          {activeTab === 'scheduler' && (
            <div className="space-y-8 max-w-2xl">
              <div className="bg-[var(--surface-color)] border border-[var(--border-color)] rounded-xl p-6 paper-shadow space-y-6">
                <div>
                  <h3 className="font-semibold text-lg font-ui mb-1">FSRS-6 Engine Parameters</h3>
                  <p className="text-sm text-[var(--muted-color)] font-content">
                    Configure the authoritative Free Spaced Repetition Scheduler algorithm parameters.
                  </p>
                </div>

                {userSettings && (
                  <div className="space-y-6">
                    <div>
                      <div className="flex justify-between text-sm mb-2 font-ui">
                        <label className="font-medium text-[var(--text-color)]">
                          Target Retention: {Math.round(userSettings.desiredRetention * 100)}%
                        </label>
                        <span className="text-xs text-[var(--muted-color)]">Recommended: 85% - 92%</span>
                      </div>
                      <input
                        type="range"
                        min="0.75"
                        max="0.97"
                        step="0.01"
                        value={userSettings.desiredRetention}
                        onChange={(e) =>
                          handleSaveSchedulerSettings({ desiredRetention: parseFloat(e.target.value) })
                        }
                        className="w-full accent-[var(--color-primary)] cursor-pointer"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-[var(--muted-color)] uppercase tracking-wider mb-2 font-ui">
                          Daily New Card Limit
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="50"
                          value={userSettings.newCardDailyLimit}
                          onChange={(e) =>
                            handleSaveSchedulerSettings({ newCardDailyLimit: parseInt(e.target.value, 10) || 5 })
                          }
                          className="w-full p-2.5 bg-[var(--bg-color)] border border-[var(--border-color)] rounded-lg text-sm font-mono font-ui"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-[var(--muted-color)] uppercase tracking-wider mb-2 font-ui">
                          Reserve Horizon Lookahead (Hours)
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="72"
                          value={userSettings.reserveHorizonHours}
                          onChange={(e) =>
                            handleSaveSchedulerSettings({ reserveHorizonHours: parseInt(e.target.value, 10) || 24 })
                          }
                          className="w-full p-2.5 bg-[var(--bg-color)] border border-[var(--border-color)] rounded-lg text-sm font-mono font-ui"
                        />
                      </div>
                    </div>

                    <div className="p-4 bg-[var(--elevated-color)] border border-[var(--border-color)] rounded-xl text-xs font-ui space-y-1">
                      <div className="flex justify-between">
                        <span className="text-[var(--muted-color)]">Active Parameter Set:</span>
                        <span className="font-mono font-semibold">{userSettings.activeParameterSetId}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[var(--muted-color)]">Weights:</span>
                        <span className="font-mono">21 parameters (FSRS-6 Spec)</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[var(--muted-color)]">Algorithm:</span>
                        <span className="font-mono">ts-fsrs 5.4.2</span>
                      </div>
                    </div>

                    {settingsSavedMessage && (
                      <div className="p-3 bg-[var(--color-soft-success)] text-[var(--color-success)] rounded-lg text-sm flex items-center gap-2 font-ui">
                        <Check className="w-4 h-4" />
                        <span>Settings saved to repository</span>
                      </div>
                    )}

                    {settingsError && (
                      <div className="p-3 bg-[var(--color-soft-attention)] text-[var(--color-error)] rounded-lg text-sm flex items-center gap-2 font-ui">
                        <AlertTriangle className="w-4 h-4 shrink-0" />
                        <span>{settingsError}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Sync Tab */}
          {activeTab === 'sync' && (
            <div className="space-y-8 max-w-2xl">
              {/* Genuine Synchronization Engine Status */}
              <div className="bg-[var(--surface-color)] border border-[var(--border-color)] rounded-xl p-6 paper-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-lg font-ui mb-1">Synchronization Engine</h3>
                    <p className="text-sm text-[var(--muted-color)] font-content">
                      Real-time status of local review write-ahead logs and Firestore persistence.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-[var(--border-color)] bg-[var(--bg-color)]">
                    {syncState === 'pending_writes' && (
                      <>
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
                        <span className="text-xs font-semibold font-ui text-amber-600">Pending Writes ({pendingWritesCount})</span>
                      </>
                    )}
                    {syncState === 'synced' && (
                      <>
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                        <span className="text-xs font-semibold font-ui text-emerald-600">Fully Synced</span>
                      </>
                    )}
                    {syncState === 'offline_or_cache' && (
                      <>
                        <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
                        <span className="text-xs font-semibold font-ui text-sky-600">Offline Cache</span>
                      </>
                    )}
                    {syncState === 'error' && (
                      <>
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                        <span className="text-xs font-semibold font-ui text-rose-600">Sync Error</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="space-y-2 text-xs font-ui p-4 bg-[var(--elevated-color)] rounded-xl border border-[var(--border-color)]">
                  <div className="flex justify-between">
                    <span className="text-[var(--muted-color)]">Write-Ahead Queue:</span>
                    <span className="font-mono font-semibold">
                      {pendingWritesCount === 0 ? '0 pending writes' : `${pendingWritesCount} write(s) in local cache`}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--muted-color)]">Remote Acknowledgement:</span>
                    <span className="font-mono">
                      {syncState === 'pending_writes' ? 'Awaiting cloud flush...' : 'Confirmed'}
                    </span>
                  </div>
                  {syncError && (
                    <div className="pt-2 mt-2 border-t border-[var(--border-color)] text-[var(--color-error)]">
                      <span className="font-semibold block mb-0.5">Sync Error Detail:</span>
                      <span className="font-mono">{syncError}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Account Identity */}
              <div className="bg-[var(--surface-color)] border border-[var(--border-color)] rounded-xl p-6 paper-shadow">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="font-semibold text-lg font-ui mb-1">Cloud Account</h3>
                    <p className="text-sm text-[var(--muted-color)] font-content">
                      Authenticate to store your personal review cards and history in Cloud Firestore.
                    </p>
                  </div>
                  <div
                    className={`p-3 rounded-full ${
                      !user || user.isAnonymous
                        ? 'bg-[var(--bg-color)] text-[var(--muted-color)]'
                        : 'bg-[var(--color-soft-success)] text-[var(--color-success)]'
                    }`}
                  >
                    {!user || user.isAnonymous ? (
                      <CloudOff className="w-6 h-6" />
                    ) : (
                      <Cloud className="w-6 h-6" />
                    )}
                  </div>
                </div>

                {!isFirebaseConfigured ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-[var(--color-soft-warning)] text-[var(--color-warning)] rounded-xl border border-[var(--color-warning)] text-sm space-y-2 font-content">
                      <div className="flex items-center gap-2 font-semibold">
                        <AlertTriangle className="w-5 h-5 shrink-0 text-amber-600" />
                        <span>Cloud Firestore is Unconfigured</span>
                      </div>
                      <p className="text-xs leading-relaxed text-[var(--text-color)]">
                        MindSpark is a personal single-owner application requiring Firebase Firestore credentials for durable cloud persistence.
                        No cloud database is currently connected. Durable cloud commits are disabled.
                      </p>
                    </div>

                    {!isDev ? (
                      <div className="p-4 bg-[var(--surface-color)] border border-[var(--border-color)] rounded-xl space-y-2 font-ui">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold block">Production Status</span>
                          <span className="px-2 py-0.5 rounded bg-[var(--color-soft-warning)] text-[var(--color-warning)] text-xs font-mono">
                            Read-Only / Configuration Required
                          </span>
                        </div>
                        <p className="text-xs text-[var(--muted-color)] leading-relaxed">
                          Ephemeral developer mode is not available in production builds because data disappears on reload. Configure Firebase Firestore credentials to enable cloud persistence and library mutations.
                        </p>
                      </div>
                    ) : (
                      <div className="p-4 bg-[var(--surface-color)] border border-[var(--border-color)] rounded-xl space-y-3 font-ui">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-sm font-semibold block">Ephemeral Developer Mode</span>
                            <span className="text-xs text-[var(--muted-color)]">
                              Explicit opt-in to run with transient, memory-only repositories. Data disappears on reload.
                            </span>
                          </div>
                          {devModeOptIn ? (
                            <button
                              onClick={exitEphemeralMode}
                              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors bg-[var(--color-attention)] text-white hover:opacity-90"
                            >
                              Exit Ephemeral Mode
                            </button>
                          ) : (
                            <button
                              onClick={() => setDevModeOptIn(true)}
                              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors bg-[var(--elevated-color)] border border-[var(--border-color)] text-[var(--text-color)] hover:bg-[var(--surface-color)]"
                            >
                              Opt In (Enable)
                            </button>
                          )}
                        </div>
                        {devModeOptIn && (
                          <div className="text-xs text-amber-600 font-mono bg-amber-500/10 p-2.5 rounded-lg border border-amber-500/20">
                            Active: Running in transient memory-only simulation. Data disappears on reload. Do not mistake this for the real library; changes will not be saved.
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : isSignedOut ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-[var(--color-soft-attention)] text-[var(--color-attention)] rounded-lg text-sm flex gap-3 font-content">
                      <AlertTriangle className="w-5 h-5 shrink-0" />
                      <div>
                        <span className="font-semibold block mb-1">Signed Out</span>
                        Sign in to persist your review progress in your personal Cloud Firestore database. Throwaway guest reviews are disabled.
                      </div>
                    </div>
                    <button
                      onClick={handleAuth}
                      className="px-5 py-2.5 bg-[var(--color-action-primary-bg)] text-[var(--color-action-primary-text)] rounded-xl font-medium text-sm hover:opacity-90 transition-opacity font-ui"
                    >
                      Sign in with Google
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between py-4 border-t border-[var(--border-color)]">
                    <div>
                      <div className="font-medium font-ui">{user?.email || 'Authenticated User'}</div>
                      <div className="text-xs text-[var(--muted-color)] mt-1 font-mono">{user?.uid}</div>
                    </div>
                    <button
                      onClick={handleAuth}
                      className="px-4 py-2 border border-[var(--border-color)] rounded-lg font-medium text-sm hover:bg-[var(--bg-color)] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] font-ui"
                    >
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Backup & Restore Tab */}
          {activeTab === 'backup' && <BackupRestoreSection />}

          {/* Library & Import Tab */}
          {activeTab === 'library' && (
            <div className="space-y-8 max-w-2xl">
              {isUnconfigured && !isEphemeralDev && (
                <div className="p-4 bg-[var(--color-soft-warning)] text-[var(--color-warning)] rounded-xl border border-[var(--color-warning)] text-xs flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 shrink-0 text-amber-600" />
                  <span>
                    {!isDev ? (
                      <>
                        <strong>Configuration required:</strong> Firebase Firestore is not configured. Cloud persistence is unavailable and library mutations are disabled in production builds.
                      </>
                    ) : (
                      <>
                        <strong>Cloud persistence unavailable:</strong> Firebase is unconfigured. Opt in to Ephemeral Developer Mode in the Sync tab to enable in-memory testing and temporary library loading.
                      </>
                    )}
                  </span>
                </div>
              )}

              {/* Seed Standard Library */}
              <div className="bg-[var(--surface-color)] border border-[var(--border-color)] rounded-xl p-6 paper-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-lg font-ui mb-1">Seed Standard Library</h3>
                    <p className="text-sm text-[var(--muted-color)] font-content">
                      Populate your library with the curated 32-packet knowledge base across Computing, Bioinformatics, Structural Biology, and Microbiology.
                    </p>
                  </div>
                </div>

                {seedSuccess && (
                  <div className="p-3 mb-4 bg-[var(--color-soft-success)] text-[var(--color-success)] rounded-lg text-sm flex items-center gap-2 font-ui">
                    <Check className="w-4 h-4" />
                    <span>{seedSuccess}</span>
                  </div>
                )}

                <button
                  onClick={handleSeedLibrary}
                  disabled={seeding || (isUnconfigured && !isEphemeralDev)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-[var(--color-action-primary-bg)] text-[var(--color-action-primary-text)] rounded-xl font-medium font-ui hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {seeding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  {seeding ? 'Seeding Packets...' : 'Load Standard Seed Library (32 items)'}
                </button>
              </div>

              {/* Import Custom Packet */}
              <ImportKnowledgeSection />

              {/* Knowledge Organization & Taxonomy Management */}
              <TaxonomyManagementSection />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
