import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ShellLayout } from './v2/app/layout/ShellLayout';
import { ThemeProvider } from './v2/app/theme/ThemeProvider';
import { ApplicationProvider } from './v2/application';
import { ReviewView } from './v2/app/review/ReviewView';
import { LibraryView } from './v2/app/library/LibraryView';
import { InsightsView } from './v2/app/insights/InsightsView';
import { SettingsView } from './v2/app/settings/SettingsView';

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <ApplicationProvider>
        <Router>
          <ShellLayout>
            <Routes>
              <Route path="/review" element={<ReviewView />} />
              <Route path="/library" element={<LibraryView />} />
              <Route path="/insights" element={<InsightsView />} />
              <Route path="/settings" element={<SettingsView />} />
              <Route path="*" element={<Navigate to="/review" replace />} />
            </Routes>
          </ShellLayout>
        </Router>
      </ApplicationProvider>
    </ThemeProvider>
  );
};

export default App;
