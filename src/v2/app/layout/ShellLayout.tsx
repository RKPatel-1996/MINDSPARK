import React from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { BookOpen, Library, LineChart, Settings, AlertTriangle } from 'lucide-react';
import { useShortcut } from '../shortcuts/useShortcut';
import { useApplication } from '../../application';
import { PwaUpdatePrompt } from '../pwa/PwaUpdatePrompt';

const navItems = [
  { path: '/review', label: 'Review', icon: BookOpen, action: 'navigation.review' as const },
  { path: '/library', label: 'Library', icon: Library, action: 'navigation.library' as const },
  { path: '/insights', label: 'Insights', icon: LineChart, action: 'navigation.insights' as const },
  { path: '/settings', label: 'Settings', icon: Settings, action: 'navigation.settings' as const },
];

export const ShellLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isUnconfigured, isEphemeralDev, isDev, setDevModeOptIn } = useApplication();

  // Bind navigation shortcuts
  navItems.forEach(({ path, action }) => {
    useShortcut(action, () => navigate(path));
  });

  const isReview = location.pathname.startsWith('/review') || location.pathname === '/';

  return (
    <div className={`flex flex-col h-screen overflow-hidden bg-[var(--bg-color)] text-[var(--text-color)] ${!isReview ? 'bg-graph-paper' : ''}`}>
      {/* Persistent Conspicuous Warning for Ephemeral Development Mode */}
      {isEphemeralDev && (
        <aside
          role="alert"
          aria-label="Ephemeral development mode warning"
          className="w-full bg-amber-500/20 dark:bg-amber-950/60 border-b border-amber-500/40 px-4 py-2.5 text-xs text-amber-950 dark:text-amber-200 flex items-center justify-between z-50 flex-none font-ui"
        >
          <div className="flex items-center gap-2 max-w-4xl">
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <div>
              <strong className="uppercase tracking-wide text-[11px] mr-1.5 text-amber-800 dark:text-amber-300">
                Ephemeral development mode:
              </strong>
              <span>Data will be lost when this page is reloaded.</span>
            </div>
          </div>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-800 dark:text-amber-300 shrink-0 ml-2">
            Non-persistent session
          </span>
        </aside>
      )}

      {/* Persistent Conspicuous Warning for Unconfigured Firebase Mode (when Ephemeral Dev is OFF) */}
      {isUnconfigured && !isEphemeralDev && (
        <aside
          aria-label="Unconfigured Firebase warning"
          className="w-full bg-amber-500/15 dark:bg-amber-950/40 border-b border-amber-500/30 px-4 py-2 text-xs text-amber-900 dark:text-amber-200 flex items-center justify-between z-50 flex-none font-ui"
        >
          <div className="flex items-center gap-2 max-w-4xl">
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <span>
              <strong>UNCONFIGURED FIREBASE MODE:</strong> Cloud Firestore is not configured.{' '}
              {!isDev ? (
                <span>
                  Production build is running in read-only mode. Cloud persistence is unavailable. Mutations and ephemeral developer mode are disabled.
                </span>
              ) : (
                <span>
                  Durable cloud persistence is disabled. Data will not be saved. Do not mistake this for the real library.
                </span>
              )}
            </span>
          </div>
          {isDev && (
            <button
              onClick={() => setDevModeOptIn(true)}
              className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded font-medium text-xs transition-colors shrink-0 ml-3"
            >
              Opt In to Dev Mode
            </button>
          )}
          {!isDev && (
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-800 dark:text-amber-300 shrink-0 ml-2">
              Read-Only
            </span>
          )}
        </aside>
      )}

      <div className="flex flex-1 overflow-hidden flex-col md:flex-row">
        {/* Desktop Left Rail - Hidden on mobile */}
        <nav className="hidden md:flex flex-col w-16 border-r border-[var(--border-color)] bg-[var(--surface-color)] py-4 items-center gap-6 flex-none">
          <div className="w-8 h-8 bg-[var(--color-action-primary-bg)] rounded-md flex items-center justify-center text-[var(--color-action-primary-text)] font-bold mb-4">
            M
          </div>
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `p-3 rounded-xl transition-colors relative group focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] ${
                  isActive
                    ? 'bg-[var(--color-action-primary-bg)] text-[var(--color-action-primary-text)]'
                    : 'text-[var(--muted-color)] hover:bg-[var(--border-color)] hover:text-[var(--text-color)]'
                }`
              }
              aria-label={item.label}
            >
              <item.icon className="w-6 h-6" strokeWidth={1.5} />
              {/* Tooltip */}
              <div className="absolute left-full ml-4 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap">
                {item.label}
              </div>
            </NavLink>
          ))}
        </nav>

        {/* Main Content Area */}
        <main className="flex-1 overflow-hidden relative">
          {children}
        </main>

        {/* Mobile Bottom Nav - Hidden on desktop */}
        <nav className="md:hidden flex-none border-t border-[var(--border-color)] bg-[var(--surface-color)] pb-safe">
          <div className="flex justify-around items-center h-16">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex flex-col items-center justify-center w-full h-full p-2 transition-colors focus:outline-none ${
                    isActive
                      ? 'text-[var(--color-primary)]'
                      : 'text-[var(--muted-color)] hover:text-[var(--text-color)]'
                  }`
                }
                aria-label={item.label}
              >
                {({ isActive }) => (
                  <item.icon className="w-6 h-6 mb-1" strokeWidth={isActive ? 2 : 1.5} />
                )}
              </NavLink>
            ))}
          </div>
        </nav>
      </div>

      {/* PWA Update Lifecycle Prompt */}
      <PwaUpdatePrompt />
    </div>
  );
};
