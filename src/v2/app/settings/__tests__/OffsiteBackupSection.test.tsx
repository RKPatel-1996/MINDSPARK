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
import { ApplicationProvider } from '../../../application/ApplicationContext';
import {
  DirectOffsiteBackupError,
  type DirectOffsiteBackupResult,
} from '../../../application/directOffsiteBackupService';
import {
  loadGitHubBackupConnectionConfig,
  loadGitHubBackupSessionToken,
  saveGitHubBackupConnectionConfig,
} from '../../../local/githubBackupConfig';
import { createInMemoryRepositories } from '../../../persistence/memory/inMemoryRepositories';
import {
  OffsiteBackupSection,
  type OffsiteBackupRunner,
} from '../OffsiteBackupSection';

async function renderSection(runner: OffsiteBackupRunner) {
  let view!: ReturnType<typeof render>;

  await act(async () => {
    view = render(
      <ApplicationProvider
        customRepos={createInMemoryRepositories()}
        isDev={true}
      >
        <OffsiteBackupSection runner={runner} />
      </ApplicationProvider>,
    );

    await Promise.resolve();
  });

  return view;
}

function fillConnection(token = 'github_pat_test_secret') {
  fireEvent.change(
    screen.getByLabelText('GitHub owner'),
    { target: { value: 'RKPatel-1996' } },
  );

  fireEvent.change(
    screen.getByLabelText('Backup repository'),
    { target: { value: 'mindspark-backups' } },
  );

  fireEvent.change(
    screen.getByLabelText('Release ID'),
    { target: { value: '123' } },
  );

  fireEvent.change(
    screen.getByLabelText('GitHub PAT'),
    { target: { value: token } },
  );
}

function result(): DirectOffsiteBackupResult {
  return {
    recoveryPoint: {} as DirectOffsiteBackupResult['recoveryPoint'],
    asset: {
      id: 99,
      name: 'mindspark-2026-09-27T09-30-00-000Z.mindspark-backup',
      size: 42,
      digest: `sha256:${'a'.repeat(64)}`,
      createdAt: '2026-09-27T09:30:00.000Z',
    },
    deletedAssetIds: [1, 2],
  };
}

describe('OffsiteBackupSection', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it('saves non-secret connection values locally while keeping the PAT session-only', async () => {
    const runner = vi.fn<OffsiteBackupRunner>();

    await renderSection(runner);
    fillConnection();

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Save connection',
      }),
    );

    expect(loadGitHubBackupConnectionConfig()).toEqual({
      owner: 'RKPatel-1996',
      repository: 'mindspark-backups',
      releaseId: 123,
    });

    expect(loadGitHubBackupSessionToken())
      .toBe('github_pat_test_secret');

    expect(
      Array.from(
        { length: localStorage.length },
        (_, index) =>
          localStorage.getItem(
            localStorage.key(index) ?? '',
          ),
      ).join('\n'),
    ).not.toContain('github_pat_test_secret');

    expect(
      screen.getByText(/PAT is retained only for this browser session/),
    ).toBeTruthy();
  });

  it('runs the composed off-site backup with normalized configuration and session PAT', async () => {
    const runner = vi.fn<OffsiteBackupRunner>(
      async () => result(),
    );

    await renderSection(runner);
    fillConnection();

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Back up to GitHub',
      }),
    );

    await waitFor(() =>
      expect(runner).toHaveBeenCalledWith(
        {
          owner: 'RKPatel-1996',
          repository: 'mindspark-backups',
          releaseId: 123,
        },
        'github_pat_test_secret',
      ),
    );

    expect(
      await screen.findByText(
        /Recovery point stored as mindspark-2026-09-27T09-30-00-000Z\.mindspark-backup/,
      ),
    ).toBeTruthy();

    expect(
      screen.getByText(/2 older recovery points removed/),
    ).toBeTruthy();
  });

  it('reports upload success separately when retention cleanup fails', async () => {
    const uploadedAsset = result().asset;

    const runner = vi.fn<OffsiteBackupRunner>(
      async () => {
        throw new DirectOffsiteBackupError(
          'retention_failed',
          'cleanup failed',
          uploadedAsset,
        );
      },
    );

    await renderSection(runner);
    fillConnection();

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Back up to GitHub',
      }),
    );

    expect(
      await screen.findByText(
        /Recovery point stored as mindspark-2026-09-27T09-30-00-000Z\.mindspark-backup, but cleanup of older recovery points failed/,
      ),
    ).toBeTruthy();
  });

  it('loads persistent connection configuration without persisting a PAT', async () => {
    saveGitHubBackupConnectionConfig({
      owner: 'saved-owner',
      repository: 'saved-repository',
      releaseId: 456,
    });

    await renderSection(vi.fn<OffsiteBackupRunner>());

    expect(
      (screen.getByLabelText('GitHub owner') as HTMLInputElement).value,
    ).toBe('saved-owner');

    expect(
      (screen.getByLabelText('Backup repository') as HTMLInputElement).value,
    ).toBe('saved-repository');

    expect(
      (screen.getByLabelText('Release ID') as HTMLInputElement).value,
    ).toBe('456');

    expect(
      (screen.getByLabelText('GitHub PAT') as HTMLInputElement).value,
    ).toBe('');
  });
});
