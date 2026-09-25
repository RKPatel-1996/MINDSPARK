import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, Check, Download, FileArchive, Loader2, Upload } from 'lucide-react';
import { useApplication } from '../../application';
import type {
  BackupRestoreInspection,
  BackupUserWorkflowService,
} from '../../application/backupUserWorkflowService';
import type { FirebaseRestoreResult } from '../../application/backupFirebaseRestoreService';
import { getFirestoreDb } from '../../persistence/firebase/config';
import { getFirebaseStorage } from '../../persistence/firebase/storageConfig';
import { createFirebaseBackupWorkflow } from '../../persistence/firebase/backupWorkflowFactory';

type BackupWorkflow = Pick<
  BackupUserWorkflowService,
  'exportBackup' | 'inspectBackup' | 'executeRestore'
>;

interface PreparedRestore {
  workflow: BackupWorkflow;
  inspection: BackupRestoreInspection;
}

interface ActiveAction {
  token: symbol;
  generation: number;
}

export interface BackupRestoreSectionProps {
  workflow?: BackupWorkflow;
}

function errorMessage(error: unknown): string {
  if (!(error instanceof Error)) return 'The backup operation failed';
  const cause = (error as Error & { causeValue?: unknown }).causeValue;
  if (cause instanceof Error && cause.message && !error.message.includes(cause.message)) {
    return `${error.message}: ${cause.message}`;
  }
  return error.message;
}

export const BackupRestoreSection: React.FC<BackupRestoreSectionProps> = ({
  workflow: suppliedWorkflow,
}) => {
  const {
    repos,
    user,
    isSignedOut,
    isUnconfigured,
    isEphemeralDev,
    triggerRefresh,
  } = useApplication();
  const liveWorkflow = useMemo<BackupWorkflow | null>(() => {
    if (suppliedWorkflow) return suppliedWorkflow;
    if (!user || isSignedOut || isUnconfigured || isEphemeralDev) return null;
    const db = getFirestoreDb();
    const storage = getFirebaseStorage();
    if (!db) return null;
    return createFirebaseBackupWorkflow(repos, db, storage, user.uid);
  }, [suppliedWorkflow, repos, user, isSignedOut, isUnconfigured, isEphemeralDev]);

  const [exporting, setExporting] = useState(false);
  const [inspecting, setInspecting] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [preparedRestore, setPreparedRestore] = useState<PreparedRestore | null>(null);
  const [result, setResult] = useState<FirebaseRestoreResult | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const authorityRef = useRef<BackupWorkflow | null>(liveWorkflow);
  const generationRef = useRef(0);
  const actionRef = useRef<ActiveAction | null>(null);
  authorityRef.current = liveWorkflow;

  const inspection = preparedRestore?.workflow === liveWorkflow
    ? preparedRestore.inspection
    : null;

  useEffect(() => {
    generationRef.current += 1;
    actionRef.current = null;
    setPreparedRestore(null);
    setSelectedFileName(null);
    setResult(null);
    setMessage(null);
    setExporting(false);
    setInspecting(false);
    setRestoring(false);
  }, [liveWorkflow]);

  const beginAction = (): ActiveAction | null => {
    if (actionRef.current) return null;
    const action = { token: Symbol(), generation: generationRef.current };
    actionRef.current = action;
    return action;
  };

  const isCurrentAction = (action: ActiveAction, workflow: BackupWorkflow): boolean =>
    actionRef.current?.token === action.token &&
    generationRef.current === action.generation &&
    authorityRef.current === workflow;

  const finishAction = (action: ActiveAction): void => {
    if (actionRef.current?.token === action.token) actionRef.current = null;
  };

  const unavailableMessage = isSignedOut
    ? 'Sign in to export or restore your cloud library.'
    : isUnconfigured
      ? 'Configure Firebase Firestore to use backup and restore.'
      : isEphemeralDev
        ? 'Backup and restore require the durable Firebase library.'
        : 'Backup and restore are unavailable until Firebase is ready.';

  const handleExport = async () => {
    const workflow = liveWorkflow;
    if (!workflow) return;
    const action = beginAction();
    if (!action) return;
    setExporting(true);
    setMessage(null);
    try {
      const exported = await workflow.exportBackup();
      if (!isCurrentAction(action, workflow)) return;
      const blob = new Blob([exported.bytes as BlobPart], { type: exported.mimeType });
      const url = URL.createObjectURL(blob);
      try {
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = exported.fileName;
        anchor.click();
      } finally {
        URL.revokeObjectURL(url);
      }
      if (!isCurrentAction(action, workflow)) return;
      setMessage(
        `Backup downloaded: ${exported.backup.data.knowledgeItems.length} items, ` +
        `${exported.backup.data.reviewEvents.length} review events, ${exported.backup.media.length} media files.`,
      );
    } catch (error) {
      if (isCurrentAction(action, workflow)) setMessage(errorMessage(error));
    } finally {
      if (isCurrentAction(action, workflow)) setExporting(false);
      finishAction(action);
    }
  };

  const handleFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = '';

    // Every selection invalidates the prior file/plan/payload generation.
    const generation = generationRef.current + 1;
    generationRef.current = generation;
    actionRef.current = null;
    setPreparedRestore(null);
    setSelectedFileName(file?.name ?? null);
    setResult(null);
    setMessage(null);
    setInspecting(false);

    const workflow = liveWorkflow;
    if (!file || !workflow) return;
    if (!file.name.toLowerCase().endsWith('.mindspark-backup')) {
      setMessage('Choose a .mindspark-backup file created by MindSpark.');
      return;
    }

    const action = { token: Symbol(), generation };
    actionRef.current = action;
    setInspecting(true);
    try {
      const bytes = new Uint8Array(await file.arrayBuffer());
      if (!isCurrentAction(action, workflow)) return;
      const inspected = await workflow.inspectBackup(bytes);
      if (!isCurrentAction(action, workflow)) return;
      setPreparedRestore({ workflow, inspection: inspected });
    } catch (error) {
      if (isCurrentAction(action, workflow)) setMessage(errorMessage(error));
    } finally {
      if (isCurrentAction(action, workflow)) setInspecting(false);
      finishAction(action);
    }
  };

  const handleRestore = async () => {
    const workflow = liveWorkflow;
    const prepared = preparedRestore;
    if (
      !workflow ||
      !prepared ||
      prepared.workflow !== workflow ||
      prepared.inspection.summary.conflicts > 0
    ) return;
    if (actionRef.current) return;

    const generation = generationRef.current + 1;
    generationRef.current = generation;
    const action = { token: Symbol(), generation };
    actionRef.current = action;

    // Execution consumes the preview. Every outcome requires a fresh preflight.
    setPreparedRestore(null);
    setResult(null);
    setRestoring(true);
    setMessage(null);
    try {
      const restoreResult = await workflow.executeRestore(prepared.inspection);
      if (!isCurrentAction(action, workflow)) return;
      setResult(restoreResult);
      if (restoreResult.status === 'complete') {
        setMessage(
          `Restore complete: ${restoreResult.completedOperationIds.length} inserted, ` +
          `${restoreResult.noOpOperationIds.length} already matched.`,
        );
        triggerRefresh();
      } else {
        const detail = restoreResult.error
          ? `: ${errorMessage(restoreResult.error)}`
          : '';
        setMessage(
          `Restore stopped at ${restoreResult.failedOperationId ?? 'post-restore verification'} ` +
          `(${restoreResult.category ?? 'unknown error'})${detail}. ` +
          'Select the file again for a fresh preflight before retrying.',
        );
      }
    } catch (error) {
      if (isCurrentAction(action, workflow)) {
        setResult(null);
        setMessage(
          `${errorMessage(error)} Select the file again for a fresh preflight before retrying.`,
        );
      }
    } finally {
      if (isCurrentAction(action, workflow)) setRestoring(false);
      finishAction(action);
    }
  };

  return (
    <div className="space-y-8 max-w-2xl">
      {!liveWorkflow && (
        <div className="p-4 bg-[var(--color-soft-warning)] text-[var(--color-warning)] rounded-xl border border-[var(--color-warning)] text-sm flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <span>{unavailableMessage}</span>
        </div>
      )}

      <section className="bg-[var(--surface-color)] border border-[var(--border-color)] rounded-xl p-6 paper-shadow">
        <div className="flex items-start gap-3 mb-5">
          <Download className="w-5 h-5 mt-0.5 text-[var(--color-primary)]" />
          <div>
            <h2 className="font-semibold text-lg font-ui">Download complete backup</h2>
            <p className="text-sm text-[var(--muted-color)] font-content mt-1">
              Saves taxonomy, settings, scheduler parameters, knowledge, cards, review history, and image bytes in one portable file.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleExport}
          disabled={!liveWorkflow || exporting || restoring || inspecting}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[var(--color-action-primary-bg)] text-[var(--color-action-primary-text)] rounded-xl font-medium font-ui hover:opacity-90 disabled:opacity-50"
        >
          {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          {exporting ? 'Creating backup...' : 'Download backup'}
        </button>
      </section>

      <section className="bg-[var(--surface-color)] border border-[var(--border-color)] rounded-xl p-6 paper-shadow">
        <div className="flex items-start gap-3 mb-5">
          <Upload className="w-5 h-5 mt-0.5 text-[var(--color-primary)]" />
          <div>
            <h2 className="font-semibold text-lg font-ui">Restore from backup</h2>
            <p className="text-sm text-[var(--muted-color)] font-content mt-1">
              MindSpark validates the complete archive and previews inserts, matches, and conflicts before writing. Restore never deletes existing data.
            </p>
          </div>
        </div>

        <label className={`inline-flex items-center gap-2 px-5 py-2.5 border border-[var(--border-color)] rounded-xl font-medium font-ui ${liveWorkflow ? 'cursor-pointer hover:bg-[var(--bg-color)]' : 'opacity-50'}`}>
          {inspecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileArchive className="w-4 h-4" />}
          {inspecting ? 'Inspecting backup...' : 'Choose backup file'}
          <input
            type="file"
            accept=".mindspark-backup,application/zip"
            onChange={handleFile}
            disabled={!liveWorkflow || inspecting || restoring || exporting}
            className="sr-only"
          />
        </label>
        {selectedFileName && (
          <p className="mt-3 text-xs font-mono text-[var(--muted-color)]">{selectedFileName}</p>
        )}

        {inspection && (
          <div className="mt-5 space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
              <div className="p-3 rounded-lg bg-[var(--elevated-color)]"><strong>{inspection.summary.knowledgeItems}</strong><span className="block text-xs text-[var(--muted-color)]">Knowledge items</span></div>
              <div className="p-3 rounded-lg bg-[var(--elevated-color)]"><strong>{inspection.summary.reviewCards}</strong><span className="block text-xs text-[var(--muted-color)]">Review cards</span></div>
              <div className="p-3 rounded-lg bg-[var(--elevated-color)]"><strong>{inspection.summary.reviewEvents}</strong><span className="block text-xs text-[var(--muted-color)]">Review events</span></div>
              <div className="p-3 rounded-lg bg-[var(--elevated-color)]"><strong>{inspection.summary.mediaFiles}</strong><span className="block text-xs text-[var(--muted-color)]">Media files</span></div>
              <div className="p-3 rounded-lg bg-[var(--elevated-color)]"><strong>{inspection.summary.inserts}</strong><span className="block text-xs text-[var(--muted-color)]">Records to insert</span></div>
              <div className="p-3 rounded-lg bg-[var(--elevated-color)]"><strong>{inspection.summary.noOps}</strong><span className="block text-xs text-[var(--muted-color)]">Already matching</span></div>
            </div>
            <p className="text-xs text-[var(--muted-color)]">
              Exported {new Date(inspection.summary.exportedAt).toLocaleString()}
            </p>

            {inspection.summary.conflicts > 0 ? (
              <div className="p-4 bg-[var(--color-soft-attention)] text-[var(--color-error)] rounded-lg text-sm flex gap-3">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <div>
                  <strong>Restore blocked by {inspection.summary.conflicts} conflict(s).</strong>
                  <ul className="mt-2 list-disc pl-4 text-xs">
                    {inspection.plan.conflicts.slice(0, 5).map((conflict) => (
                      <li key={conflict.operationId}>{conflict.entityType}: {conflict.entityId}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleRestore}
                disabled={restoring}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[var(--color-action-primary-bg)] text-[var(--color-action-primary-text)] rounded-xl font-medium font-ui hover:opacity-90 disabled:opacity-50"
              >
                {restoring ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                {restoring ? 'Restoring...' : 'Restore missing data'}
              </button>
            )}
          </div>
        )}
      </section>

      {message && (
        <div
          role="status"
          className={`p-4 rounded-xl border text-sm flex items-start gap-3 ${result?.status === 'complete' || message.startsWith('Backup downloaded')
            ? 'bg-[var(--color-soft-success)] text-[var(--color-success)] border-[var(--color-success)]'
            : 'bg-[var(--color-soft-attention)] text-[var(--color-error)] border-[var(--color-attention)]'}`}
        >
          {result?.status === 'complete' || message.startsWith('Backup downloaded')
            ? <Check className="w-5 h-5 shrink-0" />
            : <AlertTriangle className="w-5 h-5 shrink-0" />}
          <span>{message}</span>
        </div>
      )}
    </div>
  );
};
