import React from 'react';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import {
  MemoryRouter,
  Route,
  Routes,
} from 'react-router-dom';
import {
  ApplicationProvider,
} from '../../../application/ApplicationContext';
import {
  DirectOffsiteBackupError,
  type DirectOffsiteBackupResult,
} from '../../../application/directOffsiteBackupService';
import {
  clearGitHubBackupMemoryToken,
  saveGitHubBackupMemoryToken,
} from '../../../local/githubBackupConfig';
import {
  loadLastSuccessfulOffsiteBackupAt,
  saveLastSuccessfulOffsiteBackupAt,
} from '../../../local/offsiteBackupStatus';
import {
  createInMemoryRepositories,
} from '../../../persistence/memory/inMemoryRepositories';
import {
  GlobalOffsiteBackupControl,
} from '../GlobalOffsiteBackupControl';
import type {
  OffsiteBackupRunner,
} from '../offsiteBackupRuntime';

function result(): DirectOffsiteBackupResult {
  return {
    recoveryPoint:
      {} as DirectOffsiteBackupResult['recoveryPoint'],
    asset: {
      id: 99,
      name:
        'mindspark-2026-09-27T12-00-00-000Z.mindspark-backup',
      size: 42,
      digest: null,
      createdAt:
        '2026-09-27T12:00:00.000Z',
    },
    deletedAssetIds: [],
  };
}

async function renderControl(
  runner: OffsiteBackupRunner,
) {
  await act(async () => {
    render(
      <ApplicationProvider
        isDev={true}
        customRepos={
          createInMemoryRepositories()
        }
      >
        <MemoryRouter
          initialEntries={['/review']}
        >
          <Routes>
            <Route
              path="/review"
              element={
                <GlobalOffsiteBackupControl
                  runner={runner}
                />
              }
            />
            <Route
              path="/settings/backup"
              element={
                <div data-testid="settings-target">
                  Settings
                </div>
              }
            />
          </Routes>
        </MemoryRouter>
      </ApplicationProvider>,
    );

    await Promise.resolve();
  });
}

describe(
  'GlobalOffsiteBackupControl',
  () => {
    beforeEach(() => {
      localStorage.clear();
      sessionStorage.clear();
      clearGitHubBackupMemoryToken();
    });

    it('starts due and records a successful manual backup', async () => {
      saveGitHubBackupMemoryToken(
        'github_pat_test_secret',
      );

      const runner =
        vi.fn<OffsiteBackupRunner>(
          async () => result(),
        );

      await renderControl(runner);

      expect(
        screen.getByRole('button', {
          name: 'Backup due',
        }),
      ).toBeDefined();

      fireEvent.click(
        screen.getByRole('button', {
          name: 'Backup due',
        }),
      );

      await waitFor(() =>
        expect(runner).toHaveBeenCalledWith(
          {
            owner: 'RKPatel-1996',
            repository:
              'MINDSPARK_android_sync',
            releaseTag:
              'mindspark-recovery-points',
          },
          'github_pat_test_secret',
        ),
      );

      expect(
        await screen.findByRole(
          'button',
          {
            name: 'Backup now',
          },
        ),
      ).toBeDefined();

      expect(
        loadLastSuccessfulOffsiteBackupAt(),
      ).not.toBeNull();
    });

    it('still records a successful recovery point when retention cleanup warns', async () => {
      saveGitHubBackupMemoryToken(
        'github_pat_test_secret',
      );

      const uploadedAsset =
        result().asset;

      const runner =
        vi.fn<OffsiteBackupRunner>(
          async () => {
            throw new DirectOffsiteBackupError(
              'retention_failed',
              'cleanup failed',
              uploadedAsset,
            );
          },
        );

      await renderControl(runner);

      fireEvent.click(
        screen.getByRole('button', {
          name: 'Backup due',
        }),
      );

      expect(
        await screen.findByText(
          /Recovery point stored as .*but cleanup of older recovery points failed/,
        ),
      ).toBeDefined();

      expect(
        screen.getByRole('button', {
          name: 'Backup now',
        }),
      ).toBeDefined();

      expect(
        loadLastSuccessfulOffsiteBackupAt(),
      ).not.toBeNull();
    });

    it('allows a manual backup even when the previous backup is still recent', async () => {
      saveLastSuccessfulOffsiteBackupAt(
        new Date().toISOString(),
      );

      saveGitHubBackupMemoryToken(
        'github_pat_test_secret',
      );

      const runner =
        vi.fn<OffsiteBackupRunner>(
          async () => result(),
        );

      await renderControl(runner);

      const button =
        screen.getByRole('button', {
          name: 'Backup now',
        });

      fireEvent.click(button);

      await waitFor(() =>
        expect(runner).toHaveBeenCalledTimes(1),
      );
    });

    it('routes directly to Backup settings when no PAT is available', async () => {
      const runner =
        vi.fn<OffsiteBackupRunner>();

      await renderControl(runner);

      fireEvent.click(
        screen.getByRole('button', {
          name: 'Backup due',
        }),
      );

      expect(
        await screen.findByTestId(
          'settings-target',
        ),
      ).toBeDefined();

      expect(runner).not.toHaveBeenCalled();
    });
  },
);
