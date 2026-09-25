import React from 'react';
import type { Firestore } from 'firebase/firestore';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApplicationProvider } from '../../../application/ApplicationContext';
import { bootstrapUserRepositories } from '../../../application/bootstrapService';
import { createInMemoryRepositories } from '../../../persistence/memory/inMemoryRepositories';
import { createFirebaseBackupWorkflow } from '../../../persistence/firebase/backupWorkflowFactory';
import type {
  BackupRestoreInspection,
  BackupUserWorkflowService,
} from '../../../application/backupUserWorkflowService';
import { BackupRestoreSection } from '../BackupRestoreSection';

type BackupWorkflow = Pick<
  BackupUserWorkflowService,
  'exportBackup' | 'inspectBackup' | 'executeRestore'
>;

function renderSection(workflow: BackupWorkflow) {
  const repos = createInMemoryRepositories();
  const view = render(
    <ApplicationProvider customRepos={repos} isDev={true}>
      <BackupRestoreSection workflow={workflow} />
    </ApplicationProvider>,
  );
  return {
    ...view,
    rerenderWorkflow(nextWorkflow: BackupWorkflow) {
      view.rerender(
        <ApplicationProvider customRepos={repos} isDev={true}>
          <BackupRestoreSection workflow={nextWorkflow} />
        </ApplicationProvider>,
      );
    },
  };
}

const inspection = {
  plan: {
    backup: {
      format: 'mindspark-backup',
      backupVersion: 1,
      exportedAt: '2025-01-01T00:00:00.000Z',
      data: {
        taxonomy: { domains: [], topics: [], subtopics: [], allowedTags: [] },
        settings: {
          schemaVersion: 1,
          desiredRetention: 0.9,
          activeParameterSetId: 'default',
          newCardDailyLimit: 5,
          reserveHorizonHours: 24,
        },
        schedulerParameterSets: [],
        knowledgeItems: [],
        reviewCards: [],
        reviewEvents: [],
      },
      media: [],
    },
    stageOrder: [],
    mediaPrerequisites: [],
    operations: [],
    conflicts: [],
    canExecute: true,
    requiresMediaExecutionInB6: false,
  },
  payload: { files: new Map() },
  summary: {
    exportedAt: '2025-01-01T00:00:00.000Z',
    knowledgeItems: 2,
    reviewCards: 3,
    reviewEvents: 4,
    mediaFiles: 1,
    inserts: 5,
    noOps: 6,
    conflicts: 0,
  },
} as unknown as BackupRestoreInspection;

function makeWorkflow(overrides: Partial<BackupWorkflow> = {}): BackupWorkflow {
  return {
    exportBackup: vi.fn(async () => ({
      fileName: 'mindspark-v1.mindspark-backup' as const,
      mimeType: 'application/zip' as const,
      bytes: new Uint8Array([1, 2, 3]),
      backup: inspection.plan.backup,
    })),
    inspectBackup: vi.fn(async () => inspection),
    executeRestore: vi.fn(async () => ({
      status: 'complete' as const,
      completedOperationIds: ['one'],
      noOpOperationIds: ['two'],
    })),
    ...overrides,
  };
}

function chooseBackup(name = 'library.mindspark-backup') {
  fireEvent.change(screen.getByLabelText('Choose backup file'), {
    target: {
      files: [new File([new Uint8Array([4, 5])], name)],
    },
  });
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('B7 Settings backup and restore workflow', () => {
  it('keeps text-only export and inspection available and enables restore with no Storage instance', async () => {
    const repos = createInMemoryRepositories();
    await bootstrapUserRepositories(repos);
    const workflow = createFirebaseBackupWorkflow(repos, {} as Firestore, null, 'owner');
    const exported = await workflow.exportBackup();
    expect(exported.backup.media).toEqual([]);

    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    vi.stubGlobal('URL', {
      createObjectURL: vi.fn(() => 'blob:text-only-backup'),
      revokeObjectURL: vi.fn(),
    });
    renderSection(workflow);

    const download = screen.getByRole('button', { name: 'Download backup' }) as HTMLButtonElement;
    expect(download.disabled).toBe(false);
    fireEvent.click(download);
    await screen.findByText(/0 media files/);

    fireEvent.change(screen.getByLabelText('Choose backup file'), {
      target: {
        files: [new File([exported.bytes as BlobPart], 'text-only.mindspark-backup')],
      },
    });
    await screen.findByText('Knowledge items');
    expect(
      (screen.getByRole('button', { name: 'Restore missing data' }) as HTMLButtonElement).disabled,
    ).toBe(false);
  });
  it('downloads a generated archive and restores only after a successful preview', async () => {
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    vi.stubGlobal('URL', {
      createObjectURL: vi.fn(() => 'blob:backup'),
      revokeObjectURL: vi.fn(),
    });
    const workflow = makeWorkflow();
    renderSection(workflow);

    fireEvent.click(screen.getByRole('button', { name: 'Download backup' }));
    await waitFor(() => expect(workflow.exportBackup).toHaveBeenCalledOnce());
    expect(click).toHaveBeenCalledOnce();

    chooseBackup();
    await screen.findByText('Knowledge items');
    expect(screen.getByText('5')).toBeDefined();
    expect(workflow.executeRestore).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Restore missing data' }));
    await screen.findByText(/Restore complete: 1 inserted, 1 already matched/);
    expect(workflow.executeRestore).toHaveBeenCalledWith(inspection);
  });

  it('invalidates a completed preview when workflow authority changes', async () => {
    const ownerA = makeWorkflow();
    const ownerB = makeWorkflow();
    const view = renderSection(ownerA);

    chooseBackup('owner-a.mindspark-backup');
    await screen.findByText('Knowledge items');
    expect(screen.getByRole('button', { name: 'Restore missing data' })).toBeDefined();

    view.rerenderWorkflow(ownerB);
    expect(screen.queryByRole('button', { name: 'Restore missing data' })).toBeNull();
    await waitFor(() => expect(screen.queryByText('owner-a.mindspark-backup')).toBeNull());

    chooseBackup('owner-b.mindspark-backup');
    await screen.findByText('Knowledge items');
    expect(ownerB.inspectBackup).toHaveBeenCalledOnce();
    expect(screen.getByRole('button', { name: 'Restore missing data' })).toBeDefined();
  });

  it('ignores a stale pending inspection after workflow authority changes', async () => {
    let resolveOwnerA!: (value: BackupRestoreInspection) => void;
    const pendingOwnerA = new Promise<BackupRestoreInspection>((resolve) => {
      resolveOwnerA = resolve;
    });
    const ownerA = makeWorkflow({
      inspectBackup: vi.fn(async () => pendingOwnerA),
    });
    const ownerB = makeWorkflow();
    const view = renderSection(ownerA);

    chooseBackup('owner-a.mindspark-backup');
    await screen.findByText('Inspecting backup...');
    view.rerenderWorkflow(ownerB);

    await act(async () => {
      resolveOwnerA(inspection);
      await pendingOwnerA;
    });
    expect(screen.queryByText('Knowledge items')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Restore missing data' })).toBeNull();

    chooseBackup('owner-b.mindspark-backup');
    await screen.findByText('Knowledge items');
    expect(ownerB.inspectBackup).toHaveBeenCalledOnce();
    expect(screen.getByRole('button', { name: 'Restore missing data' })).toBeDefined();
  });

  it('consumes a rejected plan and requires a fresh inspection before retry', async () => {
    const workflow = makeWorkflow({
      executeRestore: vi.fn(async () => {
        throw new Error('Firestore unavailable.');
      }),
    });
    renderSection(workflow);

    chooseBackup();
    await screen.findByText('Knowledge items');
    const restoreButton = screen.getByRole('button', { name: 'Restore missing data' });
    fireEvent.click(restoreButton);
    fireEvent.click(restoreButton);

    await screen.findByText(/Firestore unavailable.*fresh preflight/i);
    expect(workflow.executeRestore).toHaveBeenCalledOnce();
    expect(screen.queryByRole('button', { name: 'Restore missing data' })).toBeNull();

    chooseBackup('retry.mindspark-backup');
    await screen.findByText('Knowledge items');
    expect(workflow.inspectBackup).toHaveBeenCalledTimes(2);
    expect(screen.getByRole('button', { name: 'Restore missing data' })).toBeDefined();
  });
  it('reports the configured Storage requirement behind a legacy media export failure', async () => {
    const failure = Object.assign(new Error('Unable to read legacy image'), {
      causeValue: new Error('Legacy media requires configured Firebase Storage'),
    });
    const workflow = makeWorkflow({
      exportBackup: vi.fn(async () => { throw failure; }),
    });
    renderSection(workflow);

    fireEvent.click(screen.getByRole('button', { name: 'Download backup' }));
    await screen.findByText(/Legacy media requires configured Firebase Storage/);
  });

  it('reports the configured Storage requirement behind a legacy media restore failure', async () => {
    const workflow = makeWorkflow({
      executeRestore: vi.fn(async () => ({
        status: 'incomplete' as const,
        category: 'storage_failure' as const,
        completedOperationIds: [],
        noOpOperationIds: [],
        failedOperationId: 'media_prerequisites:media:legacy-image',
        error: new Error('Legacy media requires configured Firebase Storage'),
      })),
    });
    renderSection(workflow);

    chooseBackup('legacy-media.mindspark-backup');
    await screen.findByText('Knowledge items');
    fireEvent.click(screen.getByRole('button', { name: 'Restore missing data' }));
    await screen.findByText(/Legacy media requires configured Firebase Storage/);
  });
});
