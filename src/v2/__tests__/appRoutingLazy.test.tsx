import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../application', () => ({
  ApplicationProvider: ({ children }: React.PropsWithChildren) => <>{children}</>,
}));

vi.mock('../app/layout/ShellLayout', () => ({
  ShellLayout: ({ children }: React.PropsWithChildren) => <main>{children}</main>,
}));

vi.mock('../app/theme/ThemeProvider', () => ({
  ThemeProvider: ({ children }: React.PropsWithChildren) => <>{children}</>,
}));

vi.mock('../app/review/ReviewView', () => ({
  ReviewView: () => <div data-testid="route-review">Review route</div>,
}));

vi.mock('../app/library/LibraryView', () => ({
  LibraryView: () => <div data-testid="route-library">Library route</div>,
}));

vi.mock('../app/insights/InsightsView', () => ({
  InsightsView: () => <div data-testid="route-insights">Insights route</div>,
}));

vi.mock('../app/settings/SettingsView', () => ({
  SettingsView: () => <div data-testid="route-settings">Settings route</div>,
}));

import App from '../../App';

afterEach(() => {
  cleanup();
  window.location.hash = '';
});

describe('App lazy HashRouter composition', () => {
  it.each([
    ['#/review', 'route-review'],
    ['#/library', 'route-library'],
    ['#/insights', 'route-insights'],
    ['#/settings', 'route-settings'],
  ])('loads direct route %s through its lazy surface', async (hash, testId) => {
    window.location.hash = hash;

    render(<App />);

    expect(await screen.findByTestId(testId)).toBeDefined();
  });

  it('redirects an unknown hash route to review', async () => {
    window.location.hash = '#/not-a-route';

    render(<App />);

    expect(await screen.findByTestId('route-review')).toBeDefined();
    expect(window.location.hash).toBe('#/review');
  });
});
