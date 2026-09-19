import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { createRepositoriesForUser } from '../application/repositoryFactory';
import { createInMemoryRepositories } from '../persistence/memory/inMemoryRepositories';
import { createUnconfiguredRepositories } from '../persistence/unconfigured/unconfiguredRepositories';
import { ApplicationProvider, useApplication } from '../application/ApplicationContext';
import { SettingsView } from '../app/settings/SettingsView';
import { ReviewView } from '../app/review/ReviewView';
import { LibraryView } from '../app/library/LibraryView';

describe('Ephemeral Developer Mode Production Gating', () => {
  describe('createInMemoryRepositories explicit availability', () => {
    it('remains directly available for tests and explicit DI', async () => {
      const memRepos = createInMemoryRepositories();
      expect(memRepos).toBeDefined();
      expect(memRepos.knowledge).toBeDefined();
      expect(memRepos.reviewCards).toBeDefined();
      expect(memRepos.reviewEvents).toBeDefined();
      expect(memRepos.taxonomy).toBeDefined();
      expect(memRepos.parameterSets).toBeDefined();
      expect(memRepos.settings).toBeDefined();

      // Mutations succeed in in-memory repos
      const now = new Date().toISOString();
      const validEvent = {
        id: 'test_event_1',
        cardId: 'card_1',
        knowledgeItemId: 'item_1',
        cardType: 'flashcard' as const,
        rating: 'good' as const,
        objectiveCorrect: null,
        guessedOrStruggled: false,
        deviceId: 'test_device',
        schedulerMetadata: {
          algorithm: 'fsrs-6',
          implementation: 'ts-fsrs',
          implementationVersion: '5.4.2',
          parameterSetId: 'fsrs-6-default',
          scheduledDays: 1,
          stability: 2,
          difficulty: 5,
          desiredRetention: 0.9,
        },
        reviewTimestamp: now,
        schemaVersion: 1 as const,
      };

      await expect(memRepos.reviewEvents.append(validEvent)).resolves.toBeUndefined();

      const events = await memRepos.reviewEvents.listForCard('card_1');
      expect(events).toHaveLength(1);
    });
  });

  describe('repositoryFactory gating', () => {
    it('returns unconfigured repositories in production (isDev=false) even if devModeOptIn is true', async () => {
      const repos = createRepositoriesForUser(null, {
        isDev: false,
        devModeOptIn: true,
      });

      // Reading succeeds with empty result
      const items = await repos.knowledge.list();
      expect(items).toEqual([]);

      // Mutations are rejected
      const now = new Date().toISOString();
      await expect(
        repos.reviewEvents.append({
          id: 'evt_1',
          cardId: 'card_1',
          knowledgeItemId: 'item_1',
          cardType: 'flashcard' as const,
          rating: 'good' as const,
          objectiveCorrect: null,
          guessedOrStruggled: false,
          deviceId: 'test_device',
          schedulerMetadata: {
            algorithm: 'fsrs-6',
            implementation: 'ts-fsrs',
            implementationVersion: '5.4.2',
            parameterSetId: 'fsrs-6-default',
            scheduledDays: 1,
            stability: 2,
            difficulty: 5,
            desiredRetention: 0.9,
          },
          reviewTimestamp: now,
          schemaVersion: 1 as const,
        })
      ).rejects.toThrow(/Configuration required/);

      await expect(
        repos.knowledge.create({
          id: 'item_1',
          title: 'Title',
          content: 'Content',
          taxonomy: { domainId: 'computing', topicId: 'algorithms', subtopicId: 'sorting' },
          status: 'active',
          schemaVersion: 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
      ).rejects.toThrow(/Configuration required/);
    });

    it('returns unconfigured repositories in development if devModeOptIn is false', async () => {
      const repos = createRepositoriesForUser(null, {
        isDev: true,
        devModeOptIn: false,
      });

      await expect(
        repos.knowledge.create({
          id: 'item_1',
          title: 'Title',
          content: 'Content',
          taxonomy: { domainId: 'computing', topicId: 'algorithms', subtopicId: 'sorting' },
          status: 'active',
          schemaVersion: 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
      ).rejects.toThrow(/Configuration required/);
    });

    it('returns in-memory repositories in development only when devModeOptIn is true', async () => {
      const repos = createRepositoriesForUser(null, {
        isDev: true,
        devModeOptIn: true,
      });

      const item = {
        id: 'item_dev_1',
        title: 'Dev Title',
        content: 'Dev Content',
        taxonomy: { domainId: 'computing' as const, topicId: 'algorithms', subtopicId: 'sorting' },
        status: 'active' as const,
        schemaVersion: 1 as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await expect(repos.knowledge.create(item)).resolves.toBeUndefined();
      const loaded = await repos.knowledge.get('item_dev_1');
      expect(loaded?.title).toBe('Dev Title');
    });
  });

  describe('UI gating in production vs development', () => {
    beforeEach(() => {
      localStorage.clear();
    });

    afterEach(() => {
      localStorage.clear();
    });

    it('SettingsView does NOT expose the "enable ephemeral mode" toggle in production builds', () => {
      render(
        <ApplicationProvider isDev={false}>
          <SettingsView />
        </ApplicationProvider>
      );

      // Switch to Sync tab where cloud persistence / ephemeral status lives
      fireEvent.click(screen.getByRole('button', { name: /sync/i }));

      // Verify toggle label and buttons do not exist
      expect(screen.queryByText('Ephemeral Developer Mode')).toBeNull();
      expect(screen.queryByRole('button', { name: /Opt In \(Enable\)/i })).toBeNull();
      expect(screen.queryByRole('button', { name: /Exit Ephemeral Mode/i })).toBeNull();

      // Verify clear configuration-required / read-only state is shown
      expect(screen.getByText(/Read-Only \/ Configuration Required/i)).toBeDefined();
      expect(screen.getByText(/Ephemeral developer mode is not available in production builds/i)).toBeDefined();
    });

    it('SettingsView exposes the Ephemeral Developer Mode toggle in development builds', () => {
      render(
        <ApplicationProvider isDev={true}>
          <SettingsView />
        </ApplicationProvider>
      );

      // Switch to Sync tab
      fireEvent.click(screen.getByRole('button', { name: /sync/i }));

      // Verify toggle is visible in dev mode
      expect(screen.getByText('Ephemeral Developer Mode')).toBeDefined();
      expect(screen.getByRole('button', { name: /Opt In \(Enable\)/i })).toBeDefined();
    });

    it('disallows Seed and Import in production unconfigured state', async () => {
      render(
        <ApplicationProvider isDev={false}>
          <SettingsView />
        </ApplicationProvider>
      );

      // Switch to Library tab
      fireEvent.click(screen.getByRole('button', { name: /library/i }));

      // Check that mutation notice is displayed
      expect(
        screen.getByText(/Firebase Firestore is not configured. Cloud persistence is unavailable and library mutations are disabled in production builds./i)
      ).toBeDefined();

      // Buttons are disabled
      const seedButton = screen.getByRole('button', { name: /Load Standard Seed Library/i }) as HTMLButtonElement;
      expect(seedButton.disabled).toBe(true);

      const importButton = screen.getByRole('button', { name: /Import Packet/i }) as HTMLButtonElement;
      expect(importButton.disabled).toBe(true);
    });

    it('disallows Seed in ReviewView when unconfigured in production', async () => {
      render(
        <ApplicationProvider isDev={false}>
          <ReviewView />
        </ApplicationProvider>
      );

      await waitFor(() => {
        expect(screen.getByRole('heading', { level: 2, name: /No knowledge available yet/i })).toBeDefined();
      });

      const seedButton = screen.getByRole('button', { name: /Seed Standard Library/i }) as HTMLButtonElement;
      expect(seedButton.disabled).toBe(true);
      expect(
        screen.getByText(/Firebase Firestore credentials are not configured. Cloud persistence is unavailable and library seeding is disabled./i)
      ).toBeDefined();
    });

    it('disallows Seed in LibraryView when unconfigured in production', async () => {
      render(
        <ApplicationProvider isDev={false}>
          <LibraryView />
        </ApplicationProvider>
      );

      await waitFor(() => {
        expect(screen.getByRole('heading', { level: 3, name: /No knowledge found/i })).toBeDefined();
      });

      const seedButton = screen.getByRole('button', { name: /Seed Standard Library/i }) as HTMLButtonElement;
      expect(seedButton.disabled).toBe(true);
      expect(
        screen.getByText(/Firebase Firestore credentials are not configured. Library seeding is disabled in production builds./i)
      ).toBeDefined();
    });
  });
});
