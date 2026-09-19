import { describe, it, expect, beforeEach } from 'vitest';
import { createInMemoryRepositories } from '../persistence/memory/inMemoryRepositories';
import { bootstrapUserRepositories } from '../application/bootstrapService';
import { seedInitialLibrary, importDraftPayload } from '../application/importService';
import { ReviewService } from '../application/reviewService';
import { LibraryService } from '../application/libraryService';
import { InsightsService } from '../application/insightsService';
import { SettingsService } from '../application/settingsService';
import type { Repositories } from '../application/types';

describe('MindSpark V2 Application Services (Phase 3B Vertical Slice)', () => {
  let repos: Repositories;

  beforeEach(() => {
    repos = createInMemoryRepositories();
  });

  it('bootstraps empty repository with default settings, parameter sets, and taxonomy', async () => {
    const res = await bootstrapUserRepositories(repos);
    expect(res.settingsCreated).toBe(true);
    expect(res.parameterSetCreated).toBe(true);
    expect(res.taxonomyCreated).toBe(true);

    const settings = await repos.settings.get();
    expect(settings).toBeDefined();
    expect(settings?.desiredRetention).toBe(0.90);
    expect(settings?.activeParameterSetId).toBe('fsrs-6-default');

    const paramSet = await repos.parameterSets.get('fsrs-6-default');
    expect(paramSet).toBeDefined();
    expect(paramSet?.weights.length).toBe(21);

    const taxonomy = await repos.taxonomy.get();
    expect(taxonomy).toBeDefined();
    expect(taxonomy?.domains.length).toBeGreaterThan(0);
  });

  it('seeds authoritative seed library and verifies all items and cards are persisted', async () => {
    const res = await seedInitialLibrary(repos);
    expect(res.itemsSeeded).toBe(32);
    expect(res.cardsSeeded).toBeGreaterThanOrEqual(32);

    const items = await repos.knowledge.list();
    expect(items.length).toBe(32);

    const cards = await repos.reviewCards.list();
    expect(cards.length).toBe(res.cardsSeeded);
  });

  it('runs complete vertical slice: review selection -> user answer -> event append -> sibling burying -> next card', async () => {
    await seedInitialLibrary(repos);
    const reviewService = new ReviewService(repos);

    // 1. Initial review selection
    const firstQueue = await reviewService.getNextReview();
    expect(firstQueue.status).toBe('ready');
    if (firstQueue.status !== 'ready') return;

    const firstCard = firstQueue.active.card;
    const firstItem = firstQueue.active.knowledgeItem;
    const firstState = firstQueue.active.cardState;

    expect(firstCard).toBeDefined();
    expect(firstItem).toBeDefined();
    expect(firstQueue.active.reason).toBeDefined();
    expect(firstQueue.active.evidence).toBeDefined();

    // 2. Submit user review
    const submitResult = await reviewService.submitReview({
      card: firstCard,
      knowledgeItem: firstItem,
      currentState: firstState,
      rating: 'good',
      objectiveCorrect: firstCard.type === 'mcq' || firstCard.type === 'true_false' ? true : null,
      guessedOrStruggled: false,
      durationMs: 2500,
    });

    expect(submitResult.event).toBeDefined();
    expect(submitResult.event.cardId).toBe(firstCard.id);
    expect(submitResult.event.rating).toBe('good');
    expect(submitResult.provisionalState.reps).toBe(1);

    // 3. Verify event was appended to repository
    const storedEvents = await repos.reviewEvents.listForCard(firstCard.id);
    expect(storedEvents.length).toBe(1);
    expect(storedEvents[0].id).toBe(submitResult.event.id);

    // 4. Verify sibling burying
    const itemCards = await repos.reviewCards.listForKnowledgeItem(firstItem.id);
    const expectedBuriedSiblings = itemCards.filter((c) => c.id !== firstCard.id).length;
    expect(reviewService.getBuriedCount()).toBe(expectedBuriedSiblings);

    // 5. Next review card should be selected and not be a sibling of the first item
    const secondQueue = await reviewService.getNextReview();
    expect(secondQueue.status).toBe('ready');
    if (secondQueue.status === 'ready') {
      expect(secondQueue.active.knowledgeItem.id).not.toBe(firstItem.id);
    }
  });

  it('libraryService manages knowledge items, card queries, updates, and attention flagging', async () => {
    await seedInitialLibrary(repos);
    const libraryService = new LibraryService(repos);

    const items = await libraryService.listKnowledgeItems();
    expect(items.length).toBe(32);
    expect(items[0].cards.length).toBeGreaterThan(0);

    const targetItem = items[0].item;
    expect(targetItem.status).toBe('active');

    // Toggle attention
    const flagged = await libraryService.toggleNeedsAttention(targetItem.id);
    expect(flagged?.status).toBe('needs_review');

    // Update title
    await libraryService.updateKnowledgeItem({
      ...targetItem,
      title: 'Updated Test Title',
    });

    const updated = await libraryService.getKnowledgeItem(targetItem.id);
    expect(updated?.item.title).toBe('Updated Test Title');

    // Archive item
    await libraryService.archiveKnowledgeItem(targetItem.id);
    const archived = await libraryService.getKnowledgeItem(targetItem.id);
    expect(archived?.item.status).toBe('archived');
  });

  it('insightsService computes accurate real metrics from event history', async () => {
    await seedInitialLibrary(repos);
    const insightsService = new InsightsService(repos);
    const reviewService = new ReviewService(repos);

    const initialInsights = await insightsService.getInsights();
    expect(initialInsights.totalActiveItems).toBe(32);
    expect(initialInsights.reviewedTodayCount).toBe(0);

    // Do a review
    const q = await reviewService.getNextReview();
    if (q.status === 'ready') {
      await reviewService.submitReview({
        card: q.active.card,
        knowledgeItem: q.active.knowledgeItem,
        currentState: q.active.cardState,
        rating: 'good',
        objectiveCorrect: null,
        guessedOrStruggled: false,
      });
    }

    const postInsights = await insightsService.getInsights();
    expect(postInsights.reviewedTodayCount).toBe(1);
  });

  it('settingsService manages user preferences', async () => {
    await bootstrapUserRepositories(repos);
    const settingsService = new SettingsService(repos);
    const initial = await settingsService.getSettings();
    expect(initial.desiredRetention).toBe(0.90);

    const updated = await settingsService.updateSettings({
      desiredRetention: 0.85,
      newCardDailyLimit: 10,
    });

    expect(updated.desiredRetention).toBe(0.85);
    expect(updated.newCardDailyLimit).toBe(10);

    const reloaded = await settingsService.getSettings();
    expect(reloaded.desiredRetention).toBe(0.85);

    // Rejects invalid retention bounds
    await expect(settingsService.updateSettings({ desiredRetention: 0.50 })).rejects.toThrow();
  });
});
