import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  Check,
  CloudUpload,
  Loader2,
} from 'lucide-react';
import { useApplication } from '../../application';
import {
  DirectOffsiteBackupError,
} from '../../application/directOffsiteBackupService';
import {
  DEFAULT_GITHUB_BACKUP_CONNECTION_CONFIG,
  loadGitHubBackupConnectionConfig,
  loadGitHubBackupMemoryToken,
  saveGitHubBackupConnectionConfig,
  type GitHubBackupConnectionConfig,
} from '../../local/githubBackupConfig';
import {
  clearGitHubBackupCredential,
  loadGitHubBackupCredential,
  saveGitHubBackupCredential,
} from '../../local/githubBackupCredentialStore';
import {
  createGitHubOffsiteBackupRunner,
  runTrackedOffsiteBackup,
  type OffsiteBackupRunner,
} from '../backup/offsiteBackupRuntime';

export type {
  OffsiteBackupRunner,
} from '../backup/offsiteBackupRuntime';

export interface OffsiteBackupSectionProps {
  runner?: OffsiteBackupRunner;
}

type MessageKind = 'success' | 'warning' | 'error';

interface StatusMessage {
  kind: MessageKind;
  text: string;
}

function errorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : 'Off-site backup failed.';
}

export const OffsiteBackupSection: React.FC<OffsiteBackupSectionProps> = ({
  runner: suppliedRunner,
}) => {
  const {
    repos,
    user,
    isSignedOut,
    isUnconfigured,
    isEphemeralDev,
  } = useApplication();

  const initialConnection = useMemo(
    () =>
      loadGitHubBackupConnectionConfig() ??
      DEFAULT_GITHUB_BACKUP_CONNECTION_CONFIG,
    [],
  );

  const [owner, setOwner] = useState(initialConnection.owner);
  const [repository, setRepository] = useState(
    initialConnection.repository,
  );
  const [token, setToken] = useState(
    () => loadGitHubBackupMemoryToken() ?? '',
  );
  const [backingUp, setBackingUp] = useState(false);
  const [message, setMessage] = useState<StatusMessage | null>(null);

  React.useEffect(() => {
    let cancelled = false;

    void loadGitHubBackupCredential().then((storedToken) => {
      if (!cancelled && storedToken) {
        setToken((current) => current || storedToken);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const liveRunner = useMemo<OffsiteBackupRunner | null>(() => {
    if (suppliedRunner) {
      return suppliedRunner;
    }

    if (
      !user ||
      isSignedOut ||
      isUnconfigured ||
      isEphemeralDev
    ) {
      return null;
    }

    return createGitHubOffsiteBackupRunner(
      repos,
      user.uid,
    );
  }, [
    suppliedRunner,
    repos,
    user,
    isSignedOut,
    isUnconfigured,
    isEphemeralDev,
  ]);

  const connectionFromInputs = (): GitHubBackupConnectionConfig => ({
    owner,
    repository,
  });

  const handleSaveConnection = async () => {
    setMessage(null);

    try {
      const saved = saveGitHubBackupConnectionConfig(
        connectionFromInputs(),
      );

      setOwner(saved.owner);
      setRepository(saved.repository);

      let credentialState:
        'persistent' | 'memory-only' | null = null;

      if (token.trim()) {
        credentialState =
          await saveGitHubBackupCredential(token);

        setToken(token.trim());
      }

      setMessage({
        kind:
          credentialState === 'memory-only'
            ? 'warning'
            : 'success',
        text:
          credentialState === 'persistent'
            ? 'GitHub backup connection saved. The PAT is encrypted and stored only on this device.'
            : credentialState === 'memory-only'
              ? 'GitHub backup connection saved, but encrypted local credential storage is unavailable. The PAT will remain only until the app is reloaded.'
              : 'GitHub backup connection saved on this device. No PAT is currently stored.',
      });
    } catch (error) {
      setMessage({
        kind: 'error',
        text: errorMessage(error),
      });
    }
  };

  const handleClearToken = async () => {
    try {
      await clearGitHubBackupCredential();
      setToken('');
      setMessage({
        kind: 'success',
        text: 'GitHub PAT cleared from this device.',
      });
    } catch (error) {
      setMessage({
        kind: 'error',
        text: errorMessage(error),
      });
    }
  };

  const handleBackup = async () => {
    if (!liveRunner || backingUp) {
      return;
    }

    setBackingUp(true);
    setMessage(null);

    try {
      const config = saveGitHubBackupConnectionConfig(
        connectionFromInputs(),
      );

      await saveGitHubBackupCredential(token);

      const sessionToken =
        loadGitHubBackupMemoryToken();

      if (!sessionToken) {
        throw new Error('GitHub backup token is unavailable.');
      }

      setOwner(config.owner);
      setRepository(config.repository);
      setToken(sessionToken);

      const result = await runTrackedOffsiteBackup(
        liveRunner,
        config,
        sessionToken,
      );

      const deleted = result.deletedAssetIds.length;

      setMessage({
        kind: 'success',
        text:
          `Recovery point stored as ${result.asset.name}. ` +
          (deleted > 0
            ? `${deleted} older recovery point${deleted === 1 ? '' : 's'} removed.`
            : 'No older recovery points needed removal.'),
      });
    } catch (error) {
      if (
        error instanceof DirectOffsiteBackupError &&
        error.code === 'retention_failed' &&
        error.uploadedAsset
      ) {
        setMessage({
          kind: 'warning',
          text:
            `Recovery point stored as ${error.uploadedAsset.name}, ` +
            'but cleanup of older recovery points failed.',
        });
      } else {
        setMessage({
          kind: 'error',
          text: errorMessage(error),
        });
      }
    } finally {
      setBackingUp(false);
    }
  };

  const unavailableMessage = isSignedOut
    ? 'Sign in before creating an off-site recovery point.'
    : isUnconfigured
      ? 'Configure Firebase Firestore before creating an off-site recovery point.'
      : isEphemeralDev
        ? 'Off-site recovery points require the durable Firebase library.'
        : 'Off-site backup is unavailable until Firebase is ready.';

  return (
    <section className="bg-[var(--surface-color)] border border-[var(--border-color)] rounded-xl p-6 paper-shadow">
      <div className="flex items-start gap-3 mb-5">
        <CloudUpload className="w-5 h-5 mt-0.5 text-[var(--color-primary)]" />
        <div>
          <h2 className="font-semibold text-lg font-ui">
            Off-site backup to GitHub
          </h2>
          <p className="text-sm text-[var(--muted-color)] font-content mt-1">
            Create the same validated MindSpark recovery archive and commit it
            to the recovery-points folder of a private GitHub repository. The
            newest 30 recovery points are retained in the active folder.
          </p>
        </div>
      </div>

      {!liveRunner && (
        <div className="mb-5 p-4 bg-[var(--color-soft-warning)] text-[var(--color-warning)] rounded-xl border border-[var(--color-warning)] text-sm flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <span>{unavailableMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <label className="text-sm font-ui">
          <span className="block mb-1.5 font-medium">Backup repository</span>
          <input
            aria-label="Backup repository"
            type="text"
            value={repository}
            onChange={(event) => setRepository(event.target.value)}
            disabled={backingUp}
            className="w-full p-2.5 bg-[var(--bg-color)] border border-[var(--border-color)] rounded-lg text-sm font-mono"
          />
        </label>

        <label className="text-sm font-ui">
          <span className="block mb-1.5 font-medium">
            GitHub PAT
            <span className="ml-2 text-xs font-normal text-[var(--muted-color)]">
              encrypted on this device
            </span>
          </span>
          <input
            aria-label="GitHub PAT"
            type="password"
            autoComplete="off"
            value={token}
            onChange={(event) => setToken(event.target.value)}
            disabled={backingUp}
            className="w-full p-2.5 bg-[var(--bg-color)] border border-[var(--border-color)] rounded-lg text-sm font-mono"
          />
        </label>
      </div>

      <details className="mt-4 rounded-lg border border-[var(--border-color)] p-3">
        <summary className="cursor-pointer text-sm font-medium font-ui">
          Advanced GitHub backup settings
        </summary>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
          <label className="text-sm font-ui">
            <span className="block mb-1.5 font-medium">GitHub owner</span>
            <input
              aria-label="GitHub owner"
              type="text"
              value={owner}
              onChange={(event) => setOwner(event.target.value)}
              disabled={backingUp}
              className="w-full p-2.5 bg-[var(--bg-color)] border border-[var(--border-color)] rounded-lg text-sm font-mono"
            />
          </label>
        </div>
      </details>

      <p className="mt-3 text-xs text-[var(--muted-color)] font-content">
        Repository and owner stay on this device. The PAT is encrypted in this
        device&apos;s local browser database and is never
        stored in MindSpark cloud settings or backup archives.
      </p>

      <div className="mt-5 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={handleSaveConnection}
          disabled={backingUp}
          className="inline-flex items-center gap-2 px-4 py-2.5 border border-[var(--border-color)] rounded-xl font-medium font-ui hover:bg-[var(--bg-color)] disabled:opacity-50"
        >
          Save connection
        </button>

        <button
          type="button"
          onClick={handleBackup}
          disabled={!liveRunner || backingUp}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[var(--color-action-primary-bg)] text-[var(--color-action-primary-text)] rounded-xl font-medium font-ui hover:opacity-90 disabled:opacity-50"
        >
          {backingUp ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <CloudUpload className="w-4 h-4" />
          )}
          {backingUp ? 'Backing up...' : 'Back up to GitHub'}
        </button>

        {token && (
          <button
            type="button"
            onClick={handleClearToken}
            disabled={backingUp}
            className="px-4 py-2.5 text-sm text-[var(--muted-color)] underline font-ui disabled:opacity-50"
          >
            Clear PAT from device
          </button>
        )}
      </div>

      {message && (
        <div
          role="status"
          className={`mt-5 p-4 rounded-xl border text-sm flex items-start gap-3 ${
            message.kind === 'success'
              ? 'bg-[var(--color-soft-success)] text-[var(--color-success)] border-[var(--color-success)]'
              : message.kind === 'warning'
                ? 'bg-[var(--color-soft-warning)] text-[var(--color-warning)] border-[var(--color-warning)]'
                : 'bg-[var(--color-soft-attention)] text-[var(--color-error)] border-[var(--color-attention)]'
          }`}
        >
          {message.kind === 'success' ? (
            <Check className="w-5 h-5 shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}
    </section>
  );
};
