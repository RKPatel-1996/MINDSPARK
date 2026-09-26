import { beforeEach, describe, expect, it } from 'vitest';
import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { ApplicationProvider } from '../../../application/ApplicationContext';
import { bootstrapUserRepositories } from '../../../application/bootstrapService';
import { createInMemoryRepositories } from '../../../persistence/memory/inMemoryRepositories';
import type { Repositories } from '../../../application/types';
import { SettingsView } from '../SettingsView';

describe('Settings responsive desktop layout contract', () => {
  let repos: Repositories;

  beforeEach(async () => {
    repos = createInMemoryRepositories();
    await bootstrapUserRepositories(repos);
  });

  async function renderSettings(initialTab: 'app' | 'appearance' | 'shortcuts' | 'scheduler' | 'sync' | 'backup' | 'library' = 'app') {
    render(
      <ApplicationProvider isDev={true} customRepos={repos}>
        <SettingsView initialTab={initialTab} />
      </ApplicationProvider>
    );

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
  }

  it('uses a Settings-specific wide shell instead of the shared narrow content-container', async () => {
    await renderSettings();

    const shell = screen.getByTestId('settings-shell');
    const content = screen.getByTestId('settings-content');

    expect(shell.className).toContain('w-full');
    expect(shell.className).toContain('max-w-[1440px]');
    expect(shell.className).not.toContain('content-container');

    expect(content.className).toContain('w-full');
    expect(content.className).toContain('max-w-6xl');
  });

  it('uses responsive grid tabs at every width without horizontal scrolling', async () => {
    await renderSettings();

    const tabs = screen.getByTestId('settings-tabs');

    expect(tabs.className).toContain('grid');
    expect(tabs.className).toContain('grid-cols-2');
    expect(tabs.className).toContain('sm:grid-cols-4');
    expect(tabs.className).toContain('lg:grid-cols-7');
    expect(tabs.className).not.toContain('overflow-x-auto');

    for (const tab of [
      'app',
      'appearance',
      'shortcuts',
      'scheduler',
      'sync',
      'backup',
      'library',
    ]) {
      expect(screen.getByRole('button', { name: tab })).toBeDefined();
    }
  });

  it('uses a responsive multi-column layout for Appearance', async () => {
    await renderSettings('appearance');

    const themeHeading = screen.getByRole('heading', { name: 'Theme' });
    const appearanceLayout = themeHeading.parentElement?.parentElement;

    expect(appearanceLayout).toBeDefined();
    expect(appearanceLayout?.className).toContain('grid');
    expect(appearanceLayout?.className).toContain('grid-cols-1');
    expect(appearanceLayout?.className).toContain('xl:grid-cols-2');
  });

  it('allows the Library settings surface to use the wider content canvas', async () => {
    await renderSettings('library');

    const seedHeading = screen.getByRole('heading', { name: 'Seed Standard Library' });
    const libraryLayout = seedHeading.closest('.space-y-8');

    expect(libraryLayout).toBeDefined();
    expect(libraryLayout?.className).toContain('w-full');
    expect(libraryLayout?.className).not.toContain('max-w-2xl');
  });

  it('preserves tab switching behavior after the responsive navigation change', async () => {
    await renderSettings();

    fireEvent.click(screen.getByRole('button', { name: 'scheduler' }));

    expect(
      screen.getByRole('heading', { name: 'FSRS-6 Engine Parameters' })
    ).toBeDefined();
  });
});
