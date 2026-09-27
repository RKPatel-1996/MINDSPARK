import React, {
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  AlertTriangle,
  Check,
  CloudUpload,
  Loader2,
} from 'lucide-react';
import {
  useNavigate,
} from 'react-router-dom';
import { useApplication } from '../../application';
import {
  DirectOffsiteBackupError,
} from '../../application/directOffsiteBackupService';
import {
  DEFAULT_GITHUB_BACKUP_CONNECTION_CONFIG,
  loadGitHubBackupConnectionConfig,
} from '../../local/githubBackupConfig';
import {
  loadGitHubBackupCredential,
} from '../../local/githubBackupCredentialStore';
import {
  OFFSITE_BACKUP_DUE_AFTER_MS,
  OFFSITE_BACKUP_STATUS_EVENT,
  isOffsiteBackupDue,
  loadLastSuccessfulOffsiteBackupAt,
} from '../../local/offsiteBackupStatus';
import {
  createGitHubOffsiteBackupRunner,
  runTrackedOffsiteBackup,
  type OffsiteBackupRunner,
} from './offsiteBackupRuntime';

interface GlobalOffsiteBackupControlProps {
  runner?: OffsiteBackupRunner;
}

type MessageKind =
  | 'success'
  | 'warning'
  | 'error';

interface StatusMessage {
  kind: MessageKind;
  text: string;
}

function errorMessage(
  error: unknown,
): string {
  return error instanceof Error
    ? error.message
    : 'Off-site backup failed.';
}

export const GlobalOffsiteBackupControl:
  React.FC<GlobalOffsiteBackupControlProps> = ({
    runner: suppliedRunner,
  }) => {
    const navigate = useNavigate();

    const {
      repos,
      user,
      isSignedOut,
      isUnconfigured,
      isEphemeralDev,
    } = useApplication();

    const liveRunner =
      useMemo<OffsiteBackupRunner | null>(() => {
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

    const [
      lastSuccessfulAt,
      setLastSuccessfulAt,
    ] = useState<string | null>(
      () =>
        loadLastSuccessfulOffsiteBackupAt(),
    );

    const [clock, setClock] = useState(
      () => Date.now(),
    );

    const [backingUp, setBackingUp] =
      useState(false);

    const [message, setMessage] =
      useState<StatusMessage | null>(null);

    useEffect(() => {
      const refreshStatus = () => {
        setLastSuccessfulAt(
          loadLastSuccessfulOffsiteBackupAt(),
        );
        setClock(Date.now());
      };

      window.addEventListener(
        OFFSITE_BACKUP_STATUS_EVENT,
        refreshStatus,
      );

      return () => {
        window.removeEventListener(
          OFFSITE_BACKUP_STATUS_EVENT,
          refreshStatus,
        );
      };
    }, []);

    useEffect(() => {
      if (!lastSuccessfulAt) {
        return;
      }

      const lastMs =
        Date.parse(lastSuccessfulAt);

      if (!Number.isFinite(lastMs)) {
        return;
      }

      const remaining =
        lastMs +
        OFFSITE_BACKUP_DUE_AFTER_MS -
        Date.now();

      if (remaining <= 0) {
        setClock(Date.now());
        return;
      }

      const timer = window.setTimeout(
        () => setClock(Date.now()),
        remaining + 50,
      );

      return () => {
        window.clearTimeout(timer);
      };
    }, [lastSuccessfulAt]);

    const backupDue = isOffsiteBackupDue(
      lastSuccessfulAt,
      clock,
    );

    const buttonText = backingUp
      ? 'Backing up...'
      : backupDue
        ? 'Backup due'
        : 'Backup now';

    const handleBackup = async () => {
      if (backingUp) {
        return;
      }

      const token =
        await loadGitHubBackupCredential();

      if (!token) {
        setMessage({
          kind: 'warning',
          text:
            'Add your GitHub PAT in Settings > Backup before creating an off-site backup.',
        });

        navigate('/settings/backup');
        return;
      }

      if (!liveRunner) {
        setMessage({
          kind: 'error',
          text: isSignedOut
            ? 'Sign in before creating an off-site backup.'
            : 'Off-site backup is unavailable until the durable Firebase library is ready.',
        });
        return;
      }

      const config =
        loadGitHubBackupConnectionConfig() ??
        DEFAULT_GITHUB_BACKUP_CONNECTION_CONFIG;

      setBackingUp(true);
      setMessage(null);

      try {
        const result =
          await runTrackedOffsiteBackup(
            liveRunner,
            config,
            token,
          );

        setMessage({
          kind: 'success',
          text:
            `Recovery point stored as ${result.asset.name}.`,
        });
      } catch (error) {
        if (
          error instanceof
            DirectOffsiteBackupError &&
          error.code ===
            'retention_failed' &&
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

    const title = lastSuccessfulAt
      ? `Last successful GitHub backup: ${lastSuccessfulAt}`
      : 'No successful GitHub backup has been recorded on this device.';

    return (
      <div className="fixed right-4 bottom-20 md:bottom-4 z-40 flex flex-col items-end gap-2">
        {message && (
          <div
            role="status"
            className={`max-w-xs rounded-lg border px-3 py-2 text-xs paper-shadow ${
              message.kind === 'success'
                ? 'bg-[var(--color-soft-success)] text-[var(--color-success)] border-[var(--color-success)]'
                : message.kind === 'warning'
                  ? 'bg-[var(--color-soft-warning)] text-[var(--color-warning)] border-[var(--color-warning)]'
                  : 'bg-[var(--color-soft-attention)] text-[var(--color-error)] border-[var(--color-attention)]'
            }`}
          >
            {message.text}
          </div>
        )}

        <button
          type="button"
          onClick={handleBackup}
          disabled={backingUp}
          aria-label={buttonText}
          title={title}
          className="inline-flex items-center gap-2 rounded-full border border-[var(--border-color)] bg-[var(--surface-color)] px-4 py-2.5 text-sm font-medium font-ui paper-shadow hover:bg-[var(--bg-color)] disabled:opacity-60"
        >
          {backingUp ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : backupDue ? (
            <AlertTriangle className="w-4 h-4" />
          ) : (
            <Check className="w-4 h-4" />
          )}

          <CloudUpload className="w-4 h-4" />

          <span>{buttonText}</span>
        </button>
      </div>
    );
  };
