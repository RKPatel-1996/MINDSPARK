import React from 'react';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  ApplicationProvider,
  useApplication,
  type ApplicationContextValue,
} from '../application/ApplicationContext';
import { createInMemoryRepositories } from '../persistence/memory/inMemoryRepositories';

const storageMocks = vi.hoisted(() => ({
  getFirebaseStorage: vi.fn(() => {
    throw new Error('Normal application composition must not request Storage');
  }),
}));

vi.mock('../persistence/firebase/storageConfig', () => ({
  getFirebaseStorage: storageMocks.getFirebaseStorage,
}));

let contextValue: ApplicationContextValue | null = null;

const ContextProbe: React.FC = () => {
  contextValue = useApplication();
  return <div>{contextValue.isBootstrapped ? 'bootstrapped' : 'starting'}</div>;
};

afterEach(() => {
  contextValue = null;
  cleanup();
  vi.clearAllMocks();
});

describe('ApplicationContext Storage boundary', () => {
  it('composes normal repositories and services without requesting Storage', async () => {
    const repos = createInMemoryRepositories();
    render(
      <ApplicationProvider customRepos={repos} isDev={true}>
        <ContextProbe />
      </ApplicationProvider>,
    );

    await waitFor(() => expect(screen.getByText('bootstrapped')).toBeDefined());
    expect(contextValue?.repos).toBe(repos);
    expect(typeof contextValue?.reviewService.getNextReview).toBe('function');
    expect(typeof contextValue?.libraryService.listKnowledgeItems).toBe('function');
    expect(typeof contextValue?.inspectImportPacket).toBe('function');
    expect(storageMocks.getFirebaseStorage).not.toHaveBeenCalled();
  });

  it('destroys provider-owned review services when repositories change and on unmount', async () => {
    const reposA = createInMemoryRepositories();
    const reposB = createInMemoryRepositories();
    const unsubscribeA = vi.fn();
    const unsubscribeB = vi.fn();

    vi.spyOn(reposA.reviewEvents, 'observeSyncState').mockImplementation(() => {
      return unsubscribeA;
    });
    vi.spyOn(reposB.reviewEvents, 'observeSyncState').mockImplementation(() => {
      return unsubscribeB;
    });

    const rendered = render(
      <ApplicationProvider customRepos={reposA} isDev={true}>
        <ContextProbe />
      </ApplicationProvider>,
    );

    await waitFor(() => expect(contextValue?.repos).toBe(reposA));
    const serviceA = contextValue!.reviewService;
    const destroyA = vi.spyOn(serviceA, 'destroy');

    rendered.rerender(
      <ApplicationProvider customRepos={reposB} isDev={true}>
        <ContextProbe />
      </ApplicationProvider>,
    );

    await waitFor(() => expect(contextValue?.repos).toBe(reposB));
    expect(destroyA).toHaveBeenCalledTimes(1);
    expect(unsubscribeA).toHaveBeenCalledTimes(1);
    const serviceB = contextValue!.reviewService;
    const destroyB = vi.spyOn(serviceB, 'destroy');

    rendered.unmount();
    expect(destroyB).toHaveBeenCalledTimes(1);
    expect(unsubscribeB).toHaveBeenCalledTimes(1);
  });
});
