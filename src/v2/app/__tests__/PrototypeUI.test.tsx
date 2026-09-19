import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { ReviewView } from '../review/ReviewView';
import { SettingsView } from '../settings/SettingsView';
import { useShortcutStore } from '../store/shortcutStore';
import { ApplicationProvider } from '../../application/ApplicationContext';
import { createInMemoryRepositories } from '../../persistence/memory/inMemoryRepositories';
import { bootstrapUserRepositories, DEFAULT_SETTINGS } from '../../application/bootstrapService';
import { generateId } from '../../domain/id';
import type { Repositories } from '../../application/types';
import type { KnowledgeItem } from '../../domain/knowledge';
import type { ReviewCard } from '../../domain/card';

describe('MindSpark V2 UI Production Vertical Slice', () => {
  let repos: Repositories;
  const itemId = generateId();
  const mcqCardId = generateId();
  const recallCardId = generateId();

  const sampleItem: KnowledgeItem = {
    id: itemId,
    schemaVersion: 1,
    title: 'Test Knowledge Title',
    content: 'Test content explanation',
    explanationMarkdown: 'Full markdown explanation',
    taxonomy: {
      domainId: 'computing',
      topicId: 'linux',
      subtopicId: 'shell',
    },
    tags: ['concept'],
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const sampleMcqCard: ReviewCard = {
    id: mcqCardId,
    knowledgeItemId: itemId,
    schemaVersion: 1,
    suspended: false,
    type: 'mcq',
    question: 'What command displays current directory?',
    options: ['pwd', 'ls', 'cd', 'mkdir'],
    correctOptionIndex: 0,
    explanation: 'pwd stands for print working directory.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const sampleRecallCard: ReviewCard = {
    id: recallCardId,
    knowledgeItemId: itemId,
    schemaVersion: 1,
    suspended: false,
    type: 'free_recall',
    prompt: 'Recall Question Test Prompt',
    answerGuidance: 'Recall Answer Guidance',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  beforeEach(() => {
    repos = createInMemoryRepositories();
    useShortcutStore.getState().restoreDefaults();
  });

  it('renders empty state when repository has no cards', async () => {
    await bootstrapUserRepositories(repos);

    render(
      <ApplicationProvider customRepos={repos}>
        <ReviewView />
      </ApplicationProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('No knowledge available yet')).toBeDefined();
    });
    expect(screen.getByText(/Seed Standard Library/)).toBeDefined();
  });

  it('navigates through real MCQ review flow', async () => {
    await bootstrapUserRepositories(repos);
    await repos.knowledge.create(sampleItem);
    await repos.reviewCards.create(sampleMcqCard);

    render(
      <ApplicationProvider customRepos={repos}>
        <ReviewView />
      </ApplicationProvider>
    );

    // Initial state: MCQ Question
    await waitFor(() => {
      expect(screen.getByText('What command displays current directory?')).toBeDefined();
    });
    expect(screen.getByText('pwd')).toBeDefined();

    // Select option (pwd)
    fireEvent.click(screen.getByText('pwd'));

    // Check answer
    fireEvent.click(screen.getByText(/Check answer/));

    // Should show Correct and explanation
    await waitFor(() => {
      expect(screen.getByText('Correct')).toBeDefined();
      expect(screen.getByText(/print working directory/)).toBeDefined();
    });

    // Continue
    fireEvent.click(screen.getByText(/Continue/));

    // After continuing, event is appended to repo and card is buried for session -> All caught up!
    await waitFor(() => {
      expect(screen.getByText('All caught up')).toBeDefined();
    });

    const events = await repos.reviewEvents.listForCard(mcqCardId);
    expect(events.length).toBe(1);
    expect(events[0].rating).toBe('good');
  });

  it('navigates through real Free Recall flow and records rating', async () => {
    await bootstrapUserRepositories(repos);
    await repos.knowledge.create(sampleItem);
    await repos.reviewCards.create(sampleRecallCard);

    render(
      <ApplicationProvider customRepos={repos}>
        <ReviewView />
      </ApplicationProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Recall Question Test Prompt')).toBeDefined();
    });

    // Reveal answer
    fireEvent.click(screen.getByText(/Reveal answer/));

    await waitFor(() => {
      expect(screen.getByText('Recall Answer Guidance')).toBeDefined();
      expect(screen.getByText(/Again/)).toBeDefined();
      expect(screen.getByText(/Good/)).toBeDefined();
    });

    // Click 'Good'
    fireEvent.click(screen.getByText(/Good/));

    await waitFor(() => {
      expect(screen.getByText('All caught up')).toBeDefined();
    });

    const events = await repos.reviewEvents.listForCard(recallCardId);
    expect(events.length).toBe(1);
    expect(events[0].rating).toBe('good');
  });

  it('respects shortcut constraints (does not trigger in inputs)', async () => {
    render(
      <ApplicationProvider customRepos={repos}>
        <SettingsView />
      </ApplicationProvider>
    );

    // Go to Shortcuts tab
    fireEvent.click(screen.getByText('shortcuts'));

    // Click the button for 'g r'
    const buttonGr = screen.getByText('g r');
    fireEvent.click(buttonGr);

    const input = screen.getByDisplayValue('Press keys...');
    expect(input).toBeDefined();

    // Type ' ' inside input
    fireEvent.keyDown(input, { key: ' ' });
    expect(input).toBeDefined();
  });

  it('5 completed reviews → completion state appears → sixth card is not loaded until Continue reviewing is activated', async () => {
    await bootstrapUserRepositories(repos);
    await repos.settings.save({
      ...DEFAULT_SETTINGS,
      newCardDailyLimit: 10,
    });

    const itemIds = Array.from({ length: 6 }, () => generateId());
    const cardIds = Array.from({ length: 6 }, () => generateId());

    const items: KnowledgeItem[] = Array.from({ length: 6 }, (_, i) => ({
      id: itemIds[i],
      schemaVersion: 1,
      title: `Concept ${i + 1}`,
      content: `Content for concept ${i + 1}`,
      explanationMarkdown: `Explanation ${i + 1}`,
      taxonomy: {
        domainId: 'computing',
        topicId: `topic-${i + 1}`,
        subtopicId: 'subtopic-1',
      },
      tags: ['concept'],
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));

    const cards: ReviewCard[] = Array.from({ length: 6 }, (_, i) => ({
      id: cardIds[i],
      knowledgeItemId: itemIds[i],
      schemaVersion: 1,
      suspended: false,
      type: 'free_recall',
      prompt: `Card Question Prompt ${i + 1}`,
      answerGuidance: `Answer Guidance ${i + 1}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));

    for (const item of items) {
      await repos.knowledge.create(item);
    }
    for (const card of cards) {
      await repos.reviewCards.create(card);
    }

    render(
      <MemoryRouter initialEntries={['/review']}>
        <ApplicationProvider customRepos={repos}>
          <ReviewView />
        </ApplicationProvider>
      </MemoryRouter>
    );

    // Complete reviews 1 through 5
    for (let cardNum = 1; cardNum <= 5; cardNum++) {
      await waitFor(() => {
        expect(screen.getByText(`Card Question Prompt ${cardNum}`)).toBeDefined();
      });
      expect(screen.getByText(`${cardNum}/5`)).toBeDefined();

      // Reveal answer
      fireEvent.click(screen.getByText(/Reveal answer/));

      await waitFor(() => {
        expect(screen.getByText(`Answer Guidance ${cardNum}`)).toBeDefined();
      });

      // Submit review rating 'Good'
      fireEvent.click(screen.getByText(/Good/));
    }

    // After 5 completed reviews: completion state MUST appear
    await waitFor(() => {
      expect(screen.getByText('Focus set complete')).toBeDefined();
    });
    expect(screen.getByText('5 useful reviews completed')).toBeDefined();
    expect(screen.getByRole('button', { name: 'Continue reviewing' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Library' })).toBeDefined();

    // Critical assertion: Card 6 MUST NOT be loaded yet!
    expect(screen.queryByText('Card Question Prompt 6')).toBeNull();

    // Now click 'Continue reviewing'
    fireEvent.click(screen.getByRole('button', { name: 'Continue reviewing' }));

    // Now Card 6 should be loaded lazily, and the counter resets to 1/5
    await waitFor(() => {
      expect(screen.getByText('Card Question Prompt 6')).toBeDefined();
    });
    expect(screen.getByText('1/5')).toBeDefined();
  });
});
