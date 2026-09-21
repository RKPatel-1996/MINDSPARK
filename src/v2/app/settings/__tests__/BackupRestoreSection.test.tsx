import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ApplicationProvider } from '../../../application/ApplicationContext';
import { createInMemoryRepositories } from '../../../persistence/memory/inMemoryRepositories';
import type {
  BackupRestoreInspection,
  BackupUserWorkflowService,
} from '../../../application/backupUserWorkflowService';
import { BackupRestoreSection } from '../BackupRestoreSection';

function renderSection(workflow: Pick<
  BackupUserWorkflowService,
  'exportBackup' | 'inspectBackup' | 'executeRestore'
>) {
  return render(
    <ApplicationProvider customRepos={createInMemoryRepositories()} isDev={true}>
      <BackupRestoreSection workflow={workflow} />
    </ApplicationProvider>,
  );
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

describe('B7 Settings backup and restore workflow', () => {
  it('downloads a generated archive and restores only after a successful preview', async () => {
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    vi.stubGlobal('URL', {
      createObjectURL: vi.fn(() => 'blob:backup'),
      revokeObjectURL: vi.fn(),
    });
    const workflow = {
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
    };
    renderSection(workflow);

    fireEvent.click(screen.getByRole('button', { name: 'Download backup' }));
    await waitFor(() => expect(workflow.exportBackup).toHaveBeenCalledOnce());
    expect(click).toHaveBeenCalledOnce();

    const input = screen.getByLabelText('Choose backup file');
    fireEvent.change(input, {
      target: {
        files: [new File([new Uint8Array([4, 5])], 'library.mindspark-backup')],
      },
    });
    await screen.findByText('Knowledge items');
    expect(screen.getByText('5')).toBeDefined();
    expect(workflow.executeRestore).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Restore missing data' }));
    await screen.findByText(/Restore complete: 1 inserted, 1 already matched/);
    expect(workflow.executeRestore).toHaveBeenCalledWith(inspection);
  });
});
