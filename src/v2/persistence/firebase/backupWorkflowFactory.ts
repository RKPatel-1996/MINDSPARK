import type { Firestore } from 'firebase/firestore';
import type { FirebaseStorage } from 'firebase/storage';
import { BackupExportService, type BackupMediaGateway } from '../../application/backupExportService';
import { BackupFirebaseRestoreService, type RestoreMediaGateway } from '../../application/backupFirebaseRestoreService';
import { BackupSnapshotService } from '../../application/backupSnapshotService';
import { BackupUserWorkflowService } from '../../application/backupUserWorkflowService';
import type { Repositories } from '../../application/types';
import { buildKnowledgeImageStoragePath, FirebaseImageStorageService } from './imageStorageService';
import {
  FirebaseRestoreMediaGateway,
  FirebaseRestoreWriteGateway,
} from './backupRestoreGateway';

export function createFirebaseBackupWorkflow(
  repos: Repositories,
  db: Firestore,
  storage: FirebaseStorage | null,
  uid: string,
): BackupUserWorkflowService {
  const unavailable = (): never => {
    throw new Error('Legacy media requires configured Firebase Storage');
  };
  const exportMedia: BackupMediaGateway = storage
    ? new FirebaseImageStorageService(storage, uid)
    : { readImage: async () => unavailable() };
  const restoreMedia: RestoreMediaGateway = storage
    ? new FirebaseRestoreMediaGateway(storage, uid)
    : {
        canonicalPath: (knowledgeItemId, imageId) =>
          buildKnowledgeImageStoragePath(uid, knowledgeItemId, imageId),
        readImageIfExists: async () => unavailable(),
        uploadImage: async () => unavailable(),
      };
  const exporter = new BackupExportService(
    new BackupSnapshotService(repos),
    exportMedia,
  );
  const restoreExecutor = new BackupFirebaseRestoreService(
    repos,
    restoreMedia,
    new FirebaseRestoreWriteGateway(db, uid),
  );
  return new BackupUserWorkflowService(repos, exporter, restoreExecutor);
}
