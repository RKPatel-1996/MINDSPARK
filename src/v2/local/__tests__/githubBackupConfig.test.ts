import {
  beforeEach,
  describe,
  expect,
  it,
} from 'vitest';
import {
  DEFAULT_GITHUB_BACKUP_CONNECTION_CONFIG,
  GitHubBackupConfigError,
  clearGitHubBackupConnectionConfig,
  clearGitHubBackupMemoryToken,
  loadGitHubBackupConnectionConfig,
  loadGitHubBackupMemoryToken,
  saveGitHubBackupConnectionConfig,
  saveGitHubBackupMemoryToken,
} from '../githubBackupConfig';

describe(
  'GitHub backup device-local configuration',
  () => {
    beforeEach(() => {
      localStorage.clear();
      sessionStorage.clear();
      clearGitHubBackupMemoryToken();
    });

    it('provides repository-file backup defaults without a built-in PAT', () => {
      expect(
        DEFAULT_GITHUB_BACKUP_CONNECTION_CONFIG,
      ).toEqual({
        owner: 'RKPatel-1996',
        repository: 'MINDSPARK_BACKUPS',
      });

      expect(localStorage.length).toBe(0);
      expect(sessionStorage.length).toBe(0);

      expect(
        loadGitHubBackupMemoryToken(),
      ).toBeNull();
    });

    it('persists only non-secret connection configuration in localStorage', () => {
      const saved =
        saveGitHubBackupConnectionConfig({
          owner: '  owner-name  ',
          repository:
            '  mindspark-backups  ',
        });

      expect(saved).toEqual({
        owner: 'owner-name',
        repository: 'mindspark-backups',
      });

      expect(
        loadGitHubBackupConnectionConfig(),
      ).toEqual(saved);

      expect(localStorage.length).toBe(1);
      expect(sessionStorage.length).toBe(0);

      const stored =
        localStorage.getItem(
          'mindspark_github_backup_connection_v3',
        );

      expect(stored).toContain('owner-name');
      expect(stored).toContain(
        'mindspark-backups',
      );

      expect(stored).not.toMatch(
        /token|pat|secret|releaseTag/i,
      );
    });

    it('migrates the prior Release-tag connection without carrying the Release tag forward', () => {
      localStorage.setItem(
        'mindspark_github_backup_connection_v2',
        JSON.stringify({
          owner: 'saved-owner',
          repository: 'saved-repository',
          releaseTag: 'obsolete-release',
        }),
      );

      expect(
        loadGitHubBackupConnectionConfig(),
      ).toEqual({
        owner: 'saved-owner',
        repository: 'saved-repository',
      });

      expect(
        localStorage.getItem(
          'mindspark_github_backup_connection_v2',
        ),
      ).toBeNull();

      expect(
        localStorage.getItem(
          'mindspark_github_backup_connection_v3',
        ),
      ).toBe(
        JSON.stringify({
          owner: 'saved-owner',
          repository: 'saved-repository',
        }),
      );
    });

    it('keeps the PAT only in app memory and never in browser string storage', () => {
      const token =
        'github_pat_test_secret';

      saveGitHubBackupMemoryToken(token);

      expect(
        loadGitHubBackupMemoryToken(),
      ).toBe(token);

      expect(localStorage.length).toBe(0);
      expect(sessionStorage.length).toBe(0);

      expect(
        JSON.stringify(localStorage),
      ).not.toContain(token);

      expect(
        JSON.stringify(sessionStorage),
      ).not.toContain(token);
    });

    it('clears connection configuration and runtime credential independently', () => {
      saveGitHubBackupConnectionConfig({
        owner: 'owner',
        repository: 'backups',
      });

      saveGitHubBackupMemoryToken(
        'github_pat_test_secret',
      );

      clearGitHubBackupMemoryToken();

      expect(
        loadGitHubBackupMemoryToken(),
      ).toBeNull();

      expect(
        loadGitHubBackupConnectionConfig(),
      ).not.toBeNull();

      clearGitHubBackupConnectionConfig();

      expect(
        loadGitHubBackupConnectionConfig(),
      ).toBeNull();
    });

    it('rejects invalid persistent connection configuration', () => {
      expect(() =>
        saveGitHubBackupConnectionConfig({
          owner: '',
          repository: 'backups',
        }),
      ).toThrowError(
        expect.objectContaining({
          code: 'invalid_connection_config',
        }) as GitHubBackupConfigError,
      );

      expect(localStorage.length).toBe(0);
    });

    it('treats malformed current connection data as absent', () => {
      localStorage.setItem(
        'mindspark_github_backup_connection_v3',
        '{"owner":"owner","repository":123}',
      );

      expect(
        loadGitHubBackupConnectionConfig(),
      ).toBeNull();
    });

    it('does not treat the old release-ID configuration as current configuration', () => {
      localStorage.setItem(
        'mindspark_github_backup_connection_v1',
        '{"owner":"owner","repository":"backups","releaseId":123}',
      );

      expect(
        loadGitHubBackupConnectionConfig(),
      ).toBeNull();
    });

    it('rejects an empty runtime token without writing browser storage', () => {
      expect(() =>
        saveGitHubBackupMemoryToken('   '),
      ).toThrowError(
        expect.objectContaining({
          code: 'invalid_token',
        }) as GitHubBackupConfigError,
      );

      expect(
        loadGitHubBackupMemoryToken(),
      ).toBeNull();

      expect(localStorage.length).toBe(0);
      expect(sessionStorage.length).toBe(0);
    });
  },
);
