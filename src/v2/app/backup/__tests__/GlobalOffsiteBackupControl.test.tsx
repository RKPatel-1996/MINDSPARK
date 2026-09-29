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
  OFFSITE_BACKUP_DUE_AFTER_MS,
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

function expectNoGlobalBackupButton(): void {
  expect(
    screen.queryByRole('button', {
      name: 'Backup due',
    }),
  ).toBeNull();

  expect(
    screen.queryByRole('button', {
      name: 'Backup now',
    }),
  ).toBeNull();
}

describe(
  'GlobalOffsiteBackupControl',
  () => {
    beforeEach(() => {
      localStorage.clear();
      sessionStorage.clear();
      clearGitHubBackupMemoryToken();
    });

    it(
      'WORK-020 RED: renders an immediate compact red icon-only control when no successful backup exists',
      async () => {
        const runner =
          vi.fn<OffsiteBackupRunner>();

        await renderControl(runner);

        const dueButton =
          screen.getByRole('button', {
            name: 'Backup due',
          });

        expect(dueButton).toBeDefined();

        // The accessible name remains available through aria-label,
        // but the persistent visible "Backup due" pill text is removed.
        expect(dueButton.textContent).toBe('');

        expect(dueButton.className).toContain(
          'text-[var(--color-error)]',
        );

        expect(dueButton.className).toContain(
          'p-2.5',
        );

        expect(dueButton.className).not.toContain(
          'px-4',
        );
      },
    );

    it(
      'WORK-020 RED: renders the due-only indicator when the last backup is at least 24 hours old',
      async () => {
        saveLastSuccessfulOffsiteBackupAt(
          new Date(
            Date.now() -
              OFFSITE_BACKUP_DUE_AFTER_MS -
              1000,
          ).toISOString(),
        );

        const runner =
          vi.fn<OffsiteBackupRunner>();

        await renderControl(runner);

        const dueButton =
          screen.getByRole('button', {
            name: 'Backup due',
          });

        expect(dueButton).toBeDefined();
        expect(dueButton.textContent).toBe('');
      },
    );

    it(
      'WORK-020 RED: renders no global backup control while the last successful backup is still current',
      async () => {
        saveLastSuccessfulOffsiteBackupAt(
          new Date().toISOString(),
        );

        const runner =
          vi.fn<OffsiteBackupRunner>();

        await renderControl(runner);

        expectNoGlobalBackupButton();
        expect(runner).not.toHaveBeenCalled();
      },
    );

    it(
      'WORK-020 RED: successful backup immediately removes the global due indicator',
      async () => {
        saveGitHubBackupMemoryToken(
          'github_pat_test_secret',
        );

        const runner =
          vi.fn<OffsiteBackupRunner>(
            async () => result(),
          );

        await renderControl(runner);

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
                'MINDSPARK_BACKUPS',
            },
            'github_pat_test_secret',
          ),
        );

        await waitFor(() => {
          expectNoGlobalBackupButton();
        });

        expect(
          loadLastSuccessfulOffsiteBackupAt(),
        ).not.toBeNull();
      },
    );

    it(
      'WORK-020 RED: successful upload with retention cleanup warning also removes the due indicator',
      async () => {
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

        await waitFor(() => {
          expectNoGlobalBackupButton();
        });

        expect(
          loadLastSuccessfulOffsiteBackupAt(),
        ).not.toBeNull();

        fireEvent.click(
          screen.getByRole('button', {
            name: 'Dismiss backup message',
          }),
        );

        expect(
          screen.queryByText(
            /cleanup of older recovery points failed/,
          ),
        ).toBeNull();
      },
    );

    it(
      'WORK-020 RED: failed backup keeps the due indicator visible',
      async () => {
        saveGitHubBackupMemoryToken(
          'github_pat_test_secret',
        );

        const runner =
          vi.fn<OffsiteBackupRunner>(
            async () => {
              throw new Error(
                'simulated backup failure',
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
            'simulated backup failure',
          ),
        ).toBeDefined();

        expect(
          screen.getByRole('button', {
            name: 'Backup due',
          }),
        ).toBeDefined();

        expect(
          loadLastSuccessfulOffsiteBackupAt(),
        ).toBeNull();
      },
    );

    it(
      'routes directly to Backup settings when no PAT is available',
      async () => {
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
      },
    );
  },
);
