import type { Firestore } from 'firebase/firestore';
import type { FirebaseStorage } from 'firebase/storage';
import { BackupExportService } from '../../application/backupExportService';
import { BackupFirebaseRestoreService } from '../../application/backupFirebaseRestoreService';
import { BackupSnapshotService } from '../../application/backupSnapshotService';
import { BackupUserWorkflowService } from '../../application/backupUserWorkflowService';
import type { Repositories } from '../../application/types';
import { FirebaseImageStorageService } from './imageStorageService';
import {
  FirebaseRestoreMediaGateway,
  FirebaseRestoreWriteGateway,
} from './backupRestoreGateway';

export function createFirebaseBackupWorkflow(
  repos: Repositories,
  db: Firestore,
  storage: FirebaseStorage,
  uid: string,
): BackupUserWorkflowService {
  const imageStorage = new FirebaseImageStorageService(storage, uid);
  const exporter = new BackupExportService(
    new BackupSnapshotService(repos),
    imageStorage,
  );
  const restoreExecutor = new BackupFirebaseRestoreService(
    repos,
    new FirebaseRestoreMediaGateway(storage, uid),
    new FirebaseRestoreWriteGateway(db, uid),
  );
  return new BackupUserWorkflowService(repos, exporter, restoreExecutor);
}
