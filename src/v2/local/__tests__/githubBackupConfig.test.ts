import { beforeEach, describe, expect, it } from 'vitest';
import {
  DEFAULT_GITHUB_BACKUP_CONNECTION_CONFIG,
  GitHubBackupConfigError,
  clearGitHubBackupConnectionConfig,
  clearGitHubBackupSessionToken,
  loadGitHubBackupConnectionConfig,
  loadGitHubBackupSessionToken,
  saveGitHubBackupConnectionConfig,
  saveGitHubBackupSessionToken,
} from '../githubBackupConfig';

describe('GitHub backup device-local configuration', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it('provides editable default connection values without a built-in PAT', () => {
    expect(DEFAULT_GITHUB_BACKUP_CONNECTION_CONFIG).toEqual({
      owner: 'RKPatel-1996',
      repository: 'MINDSPARK_android_sync',
      releaseTag: 'mindspark-recovery-points',
    });

    expect(sessionStorage.length).toBe(0);
    expect(localStorage.length).toBe(0);
  });

  it('persists only non-secret connection configuration in localStorage', () => {
    const saved = saveGitHubBackupConnectionConfig({
      owner: '  owner-name  ',
      repository: '  mindspark-backups  ',
      releaseTag: '  mindspark-recovery-points  ',
    });

    expect(saved).toEqual({
      owner: 'owner-name',
      repository: 'mindspark-backups',
      releaseTag: 'mindspark-recovery-points',
    });

    expect(loadGitHubBackupConnectionConfig()).toEqual(saved);
    expect(localStorage.length).toBe(1);

    const stored = localStorage.getItem(
      'mindspark_github_backup_connection_v2',
    );

    expect(stored).toContain('owner-name');
    expect(stored).toContain('mindspark-backups');
    expect(stored).toContain('mindspark-recovery-points');
    expect(stored).not.toMatch(/token|pat|secret/i);
  });

  it('stores the PAT only in sessionStorage and never in localStorage', () => {
    const token = 'github_pat_test_secret';

    saveGitHubBackupSessionToken(token);

    expect(loadGitHubBackupSessionToken()).toBe(token);

    const localValues = Array.from(
      { length: localStorage.length },
      (_, index) => localStorage.getItem(localStorage.key(index) ?? ''),
    );

    expect(localValues.join('\n')).not.toContain(token);

    expect(
      sessionStorage.getItem('mindspark_github_backup_pat_v1'),
    ).toBe(token);
  });

  it('clears connection configuration and session credential independently', () => {
    saveGitHubBackupConnectionConfig({
      owner: 'owner',
      repository: 'backups',
      releaseTag: 'recovery',
    });
    saveGitHubBackupSessionToken('github_pat_test_secret');

    clearGitHubBackupSessionToken();

    expect(loadGitHubBackupSessionToken()).toBeNull();
    expect(loadGitHubBackupConnectionConfig()).not.toBeNull();

    clearGitHubBackupConnectionConfig();

    expect(loadGitHubBackupConnectionConfig()).toBeNull();
  });

  it('rejects invalid persistent connection configuration', () => {
    expect(() =>
      saveGitHubBackupConnectionConfig({
        owner: '',
        repository: 'backups',
        releaseTag: 'recovery',
      }),
    ).toThrowError(
      expect.objectContaining({
        code: 'invalid_connection_config',
      }) as GitHubBackupConfigError,
    );

    expect(localStorage.length).toBe(0);
  });

  it('treats malformed stored connection data as absent', () => {
    localStorage.setItem(
      'mindspark_github_backup_connection_v2',
      '{"owner":"owner","repository":"backups","releaseTag":123}',
    );

    expect(loadGitHubBackupConnectionConfig()).toBeNull();
  });

  it('does not treat the old release-ID configuration as current configuration', () => {
    localStorage.setItem(
      'mindspark_github_backup_connection_v1',
      '{"owner":"owner","repository":"backups","releaseId":123}',
    );

    expect(loadGitHubBackupConnectionConfig()).toBeNull();
  });

  it('rejects an empty session token without writing storage', () => {
    expect(() =>
      saveGitHubBackupSessionToken('   '),
    ).toThrowError(
      expect.objectContaining({
        code: 'invalid_token',
      }) as GitHubBackupConfigError,
    );

    expect(sessionStorage.length).toBe(0);
    expect(localStorage.length).toBe(0);
  });
});
