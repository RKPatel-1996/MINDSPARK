import type { Firestore } from 'firebase/firestore';
import type { FirebaseStorage } from 'firebase/storage';
import { BackupExportService, type BackupMediaGateway } from '../../application/backupExportService';
import { BackupFirebaseRestoreService, type RestoreMediaGateway } from '../../application/backupFirebaseRestoreService';
import { BackupRecoveryPointService } from '../../application/backupRecoveryPointService';
import { BackupSnapshotService } from '../../application/backupSnapshotService';
import { BackupUserWorkflowService } from '../../application/backupUserWorkflowService';
import type { Repositories } from '../../application/types';
import { buildKnowledgeImageStoragePath, FirebaseImageStorageService } from './imageStorageService';
import {
  FirebaseRestoreMediaGateway,
  FirebaseRestoreWriteGateway,
} from './backupRestoreGateway';

function unavailableStorage(): never {
  throw new Error('Legacy media requires configured Firebase Storage');
}

function createExportMediaGateway(
  storage: FirebaseStorage | null,
  uid: string,
): BackupMediaGateway {
  return storage
    ? new FirebaseImageStorageService(storage, uid)
    : { readImage: async () => unavailableStorage() };
}

export function createFirebaseBackupRecoveryPointService(
  repos: Repositories,
  storage: FirebaseStorage | null,
  uid: string,
): BackupRecoveryPointService {
  return new BackupRecoveryPointService(
    repos,
    createExportMediaGateway(storage, uid),
  );
}

export function createFirebaseBackupWorkflow(
  repos: Repositories,
  db: Firestore,
  storage: FirebaseStorage | null,
  uid: string,
): BackupUserWorkflowService {
  const exportMedia = createExportMediaGateway(storage, uid);
  const restoreMedia: RestoreMediaGateway = storage
    ? new FirebaseRestoreMediaGateway(storage, uid)
    : {
        canonicalPath: (knowledgeItemId, imageId) =>
          buildKnowledgeImageStoragePath(uid, knowledgeItemId, imageId),
        readImageIfExists: async () => unavailableStorage(),
        uploadImage: async () => unavailableStorage(),
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
