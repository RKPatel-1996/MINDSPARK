import {
  BackupExportService,
  webCryptoBackupHasher,
  type BackupContentHasher,
  type BackupExportResult,
  type BackupMediaGateway,
} from './backupExportService';
import {
  BackupSnapshotService,
  type BackupSourceRepositories,
} from './backupSnapshotService';

export interface BackupRecoveryPoint extends BackupExportResult {
  archiveSha256: string;
}

/**
 * Creates one portable, validated recovery point from a read-only backup source.
 *
 * This layer deliberately has no restore or repository mutation capability.
 */
export class BackupRecoveryPointService {
  constructor(
    private readonly source: BackupSourceRepositories,
    private readonly media: BackupMediaGateway,
    private readonly now: () => string = () => new Date().toISOString(),
    private readonly hasher: BackupContentHasher = webCryptoBackupHasher,
  ) {}

  async createRecoveryPoint(): Promise<BackupRecoveryPoint> {
    const exporter = new BackupExportService(
      new BackupSnapshotService(this.source, this.now),
      this.media,
      this.hasher,
    );

    const exported = await exporter.exportBackup();
    const archiveSha256 = await this.hasher.sha256(exported.bytes);

    return {
      ...exported,
      archiveSha256,
    };
  }
}
