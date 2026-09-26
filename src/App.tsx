import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ShellLayout } from './v2/app/layout/ShellLayout';
import { ThemeProvider } from './v2/app/theme/ThemeProvider';
import { ApplicationProvider } from './v2/application';
const ReviewView = React.lazy(() =>
  import('./v2/app/review/ReviewView').then((module) => ({ default: module.ReviewView })),
);

const LibraryView = React.lazy(() =>
  import('./v2/app/library/LibraryView').then((module) => ({ default: module.LibraryView })),
);

const InsightsView = React.lazy(() =>
  import('./v2/app/insights/InsightsView').then((module) => ({ default: module.InsightsView })),
);

const SettingsView = React.lazy(() =>
  import('./v2/app/settings/SettingsView').then((module) => ({ default: module.SettingsView })),
);

const RouteLoadingFallback: React.FC = () => (
  <div
    role="status"
    aria-live="polite"
    className="flex min-h-40 items-center justify-center text-sm text-[var(--muted-color)]"
  >
    Loading...
  </div>
);

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <ApplicationProvider>
        <Router>
          <ShellLayout>
            <React.Suspense fallback={<RouteLoadingFallback />}>
              <Routes>
              <Route path="/review" element={<ReviewView />} />
              <Route path="/library" element={<LibraryView />} />
              <Route path="/insights" element={<InsightsView />} />
              <Route path="/settings" element={<SettingsView />} />
              <Route path="*" element={<Navigate to="/review" replace />} />
              </Routes>
            </React.Suspense>
          </ShellLayout>
        </Router>
      </ApplicationProvider>
    </ThemeProvider>
  );
};

export default App;
