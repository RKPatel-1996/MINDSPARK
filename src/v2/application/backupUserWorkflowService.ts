import {
  ZipBackupArchiveReader,
  type BackupArchiveReader,
  type ParsedBackupArchive,
} from '../backup/archive';
import { createRestorePlan, type RestorePlan } from '../backup/restore';
import { isAllowedImageMimeType, MAX_IMAGE_BYTES } from '../domain/imageMedia';
import type { Repositories } from './types';
import {
  webCryptoBackupHasher,
  type BackupContentHasher,
  type BackupExportResult,
} from './backupExportService';
import { collectRestoreTargetState } from './backupRestoreService';
import type {
  FirebaseRestoreResult,
  RestoreMediaPayload,
} from './backupFirebaseRestoreService';

export interface BackupExporter {
  exportBackup(): Promise<BackupExportResult>;
}

export interface PersistentRestoreExecutor {
  execute(plan: RestorePlan, payload: RestoreMediaPayload): Promise<FirebaseRestoreResult>;
}

export interface BackupRestoreSummary {
  exportedAt: string;
  knowledgeItems: number;
  reviewCards: number;
  reviewEvents: number;
  mediaFiles: number;
  inserts: number;
  noOps: number;
  conflicts: number;
}

export interface BackupRestoreInspection {
  readonly plan: RestorePlan;
  readonly payload: RestoreMediaPayload;
  readonly summary: BackupRestoreSummary;
}

export class BackupWorkflowError extends Error {
  constructor(
    readonly code: 'media_validation',
    message: string,
    readonly causeValue?: unknown,
  ) {
    super(message);
    this.name = 'BackupWorkflowError';
  }
}

/** Coordinates browser-independent export, archive preflight, and explicit B6 execution. */
export class BackupUserWorkflowService {
  constructor(
    private readonly repos: Repositories,
    private readonly exporter: BackupExporter,
    private readonly restoreExecutor: PersistentRestoreExecutor,
    private readonly archiveReader: BackupArchiveReader = new ZipBackupArchiveReader(),
    private readonly hasher: BackupContentHasher = webCryptoBackupHasher,
  ) {}

  exportBackup(): Promise<BackupExportResult> {
    return this.exporter.exportBackup();
  }

  async inspectBackup(bytes: Uint8Array): Promise<BackupRestoreInspection> {
    const parsed: ParsedBackupArchive = this.archiveReader.parse(bytes);
    for (const manifest of parsed.backup.media) {
      const file = parsed.media.get(manifest.assetId);
      try {
        if (
          !file ||
          !isAllowedImageMimeType(file.mimeType) ||
          file.mimeType !== manifest.mimeType ||
          file.bytes.byteLength !== manifest.byteLength ||
          file.bytes.byteLength === 0 ||
          file.bytes.byteLength > MAX_IMAGE_BYTES ||
          await this.hasher.sha256(file.bytes) !== manifest.sha256
        ) {
          throw new BackupWorkflowError(
            'media_validation',
            `Media integrity validation failed for ${manifest.assetId}`,
          );
        }
      } catch (error) {
        if (error instanceof BackupWorkflowError) throw error;
        throw new BackupWorkflowError(
          'media_validation',
          `Unable to validate media ${manifest.assetId}`,
          error,
        );
      }
    }

    const plan = createRestorePlan(
      parsed.backup,
      await collectRestoreTargetState(this.repos),
    );
    const inserts = plan.operations.filter((operation) => operation.disposition === 'INSERT').length;
    const noOps = plan.operations.filter((operation) => operation.disposition === 'NO_OP').length;
    return {
      plan,
      payload: { files: parsed.media },
      summary: {
        exportedAt: parsed.backup.exportedAt,
        knowledgeItems: parsed.backup.data.knowledgeItems.length,
        reviewCards: parsed.backup.data.reviewCards.length,
        reviewEvents: parsed.backup.data.reviewEvents.length,
        mediaFiles: parsed.backup.media.length,
        inserts,
        noOps,
        conflicts: plan.conflicts.length,
      },
    };
  }

  executeRestore(inspection: BackupRestoreInspection): Promise<FirebaseRestoreResult> {
    return this.restoreExecutor.execute(inspection.plan, inspection.payload);
  }
}
