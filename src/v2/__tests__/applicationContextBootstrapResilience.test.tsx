import React from 'react';
import { act, cleanup, render, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApplicationProvider, useApplication, type ApplicationContextValue } from '../application/ApplicationContext';
import type { Repositories } from '../application/types';
import { createInMemoryRepositories } from '../persistence/memory/inMemoryRepositories';

const bootstrapMocks = vi.hoisted(() => ({
  bootstrapUserRepositories: vi.fn(),
}));

vi.mock('../application/bootstrapService', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../application/bootstrapService')>();
  return {
    ...actual,
    bootstrapUserRepositories: bootstrapMocks.bootstrapUserRepositories,
  };
});

vi.mock('../auth/firebaseAuth', () => ({
  getCurrentUser: () => null,
  isFirebaseConfigured: false,
  observeAuthState: () => vi.fn(),
}));

let contextValue: ApplicationContextValue | null = null;

const ContextProbe: React.FC = () => {
  contextValue = useApplication();
  return null;
};

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

function renderProvider(repos: Repositories) {
  return render(
    <ApplicationProvider customRepos={repos} isDev={true}>
      <ContextProbe />
    </ApplicationProvider>,
  );
}

beforeEach(() => {
  bootstrapMocks.bootstrapUserRepositories.mockReset();
});

afterEach(() => {
  contextValue = null;
  cleanup();
});

describe('ApplicationProvider bootstrap resilience', () => {
  it('represents successful bootstrap explicitly', async () => {
    bootstrapMocks.bootstrapUserRepositories.mockResolvedValue(undefined);
    renderProvider(createInMemoryRepositories());

    await waitFor(() => expect(contextValue?.isBootstrapped).toBe(true));
    expect(contextValue?.bootstrapError).toBeNull();
  });

  it('represents bootstrap rejection without an unhandled startup state', async () => {
    bootstrapMocks.bootstrapUserRepositories.mockRejectedValue(new Error('Firestore offline'));
    renderProvider(createInMemoryRepositories());

    await waitFor(() => {
      expect(contextValue?.bootstrapError).toBe('Repository bootstrap failed: Firestore offline');
    });
    expect(contextValue?.isBootstrapped).toBe(false);
  });

  it('retries bootstrap against the current repository authority and recovers', async () => {
    bootstrapMocks.bootstrapUserRepositories
      .mockRejectedValueOnce(new Error('Temporary failure'))
      .mockResolvedValueOnce(undefined);
    const repos = createInMemoryRepositories();
    renderProvider(repos);

    await waitFor(() => expect(contextValue?.bootstrapError).toContain('Temporary failure'));
    act(() => contextValue!.retryBootstrap());

    expect(contextValue?.bootstrapError).toBeNull();
    await waitFor(() => expect(contextValue?.isBootstrapped).toBe(true));
    expect(bootstrapMocks.bootstrapUserRepositories).toHaveBeenCalledTimes(2);
    expect(bootstrapMocks.bootstrapUserRepositories).toHaveBeenLastCalledWith(repos);
  });

  it('clears obsolete bootstrap failure state when repository authority changes', async () => {
    const reposA = createInMemoryRepositories();
    const reposB = createInMemoryRepositories();
    const current = deferred<void>();
    bootstrapMocks.bootstrapUserRepositories.mockImplementation((repos) =>
      repos === reposA ? Promise.reject(new Error('Owner A failure')) : current.promise,
    );
    const view = renderProvider(reposA);
    await waitFor(() => expect(contextValue?.bootstrapError).toContain('Owner A failure'));

    view.rerender(
      <ApplicationProvider customRepos={reposB} isDev={true}>
        <ContextProbe />
      </ApplicationProvider>,
    );
    expect(contextValue?.repos).toBe(reposB);
    expect(contextValue?.bootstrapError).toBeNull();
    expect(contextValue?.isBootstrapped).toBe(false);

    await act(async () => {
      current.resolve();
      await current.promise;
    });
    await waitFor(() => expect(contextValue?.isBootstrapped).toBe(true));
  });

  it('ignores stale bootstrap success after repository authority changes', async () => {
    const reposA = createInMemoryRepositories();
    const reposB = createInMemoryRepositories();
    const stale = deferred<void>();
    bootstrapMocks.bootstrapUserRepositories.mockImplementation((repos) =>
      repos === reposA ? stale.promise : Promise.resolve(undefined),
    );
    const view = renderProvider(reposA);
    await waitFor(() => expect(bootstrapMocks.bootstrapUserRepositories).toHaveBeenCalledWith(reposA));

    view.rerender(
      <ApplicationProvider customRepos={reposB} isDev={true}>
        <ContextProbe />
      </ApplicationProvider>,
    );
    await waitFor(() => expect(contextValue?.isBootstrapped).toBe(true));

    await act(async () => {
      stale.resolve();
      await stale.promise;
    });
    expect(contextValue?.repos).toBe(reposB);
    expect(contextValue?.isBootstrapped).toBe(true);
    expect(contextValue?.bootstrapError).toBeNull();
  });

  it('ignores stale bootstrap rejection after repository authority changes', async () => {
    const reposA = createInMemoryRepositories();
    const reposB = createInMemoryRepositories();
    const stale = deferred<void>();
    bootstrapMocks.bootstrapUserRepositories.mockImplementation((repos) =>
      repos === reposA ? stale.promise : Promise.resolve(undefined),
    );
    const view = renderProvider(reposA);
    await waitFor(() => expect(bootstrapMocks.bootstrapUserRepositories).toHaveBeenCalledWith(reposA));

    view.rerender(
      <ApplicationProvider customRepos={reposB} isDev={true}>
        <ContextProbe />
      </ApplicationProvider>,
    );
    await waitFor(() => expect(contextValue?.isBootstrapped).toBe(true));

    await act(async () => {
      stale.reject(new Error('Obsolete failure'));
      await stale.promise.catch(() => undefined);
    });
    expect(contextValue?.repos).toBe(reposB);
    expect(contextValue?.isBootstrapped).toBe(true);
    expect(contextValue?.bootstrapError).toBeNull();
  });
});
