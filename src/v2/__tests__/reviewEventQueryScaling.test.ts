import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import {
  createInMemoryRepositories,
} from '../persistence/memory/inMemoryRepositories';
import {
  seedInitialLibrary,
} from '../application/importService';
import {
  LibraryService,
} from '../application/libraryService';
import {
  InsightsService,
} from '../application/insightsService';
import {
  ReviewService,
} from '../application/reviewService';

describe('WORK-015 ReviewEvent query scaling', () => {
  let repos: ReturnType<typeof createInMemoryRepositories>;

  beforeEach(async () => {
    repos = createInMemoryRepositories();
    await seedInitialLibrary(repos);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('Library aggregate loading does not issue one persistent history read per card or replace it with an owner-wide scan', async () => {
    const cards =
      await repos.reviewCards.list();

    expect(cards.length)
      .toBeGreaterThan(1);

    const perCardReads =
      vi.spyOn(
        repos.reviewEvents,
        'listForCard'
      );

    const ownerWideReads =
      vi.spyOn(
        repos.reviewEvents,
        'list'
      );

    await new LibraryService(repos)
      .listKnowledgeItems();

    expect(perCardReads)
      .toHaveBeenCalledTimes(0);

    expect(ownerWideReads)
      .toHaveBeenCalledTimes(0);
  });

  it('Insights aggregate loading does not issue one persistent history read per active card or replace it with an owner-wide scan', async () => {
    const [items, cards] =
      await Promise.all([
        repos.knowledge.list(),
        repos.reviewCards.list(),
      ]);

    const activeItemIds =
      new Set(
        items
          .filter(
            (item) =>
              item.status === 'active'
          )
          .map(
            (item) =>
              item.id
          )
      );

    const activeCards =
      cards.filter(
        (card) =>
          !card.suspended &&
          activeItemIds.has(
            card.knowledgeItemId
          )
      );

    expect(activeCards.length)
      .toBeGreaterThan(1);

    const perCardReads =
      vi.spyOn(
        repos.reviewEvents,
        'listForCard'
      );

    const ownerWideReads =
      vi.spyOn(
        repos.reviewEvents,
        'list'
      );

    await new InsightsService(repos)
      .getInsights();

    expect(perCardReads)
      .toHaveBeenCalledTimes(0);

    expect(ownerWideReads)
      .toHaveBeenCalledTimes(0);
  });

  it('direct syncDayContext does not issue one persistent history read per card or use an owner-wide scan', async () => {
    const cards =
      await repos.reviewCards.list();

    expect(cards.length)
      .toBeGreaterThan(1);

    const perCardReads =
      vi.spyOn(
        repos.reviewEvents,
        'listForCard'
      );

    const ownerWideReads =
      vi.spyOn(
        repos.reviewEvents,
        'list'
      );

    const service =
      new ReviewService(repos);

    try {
      await service.syncDayContext();

      expect(perCardReads)
        .toHaveBeenCalledTimes(0);

      expect(ownerWideReads)
        .toHaveBeenCalledTimes(0);
    } finally {
      service.destroy();
    }
  });

  it('getNextReview performs no aggregate per-card history traversal and does not use an owner-wide scan', async () => {
    const cards =
      await repos.reviewCards.list();

    expect(cards.length)
      .toBeGreaterThan(1);

    // Active-card live observation remains an intentionally supported
    // single-card workflow. Suppress it here so this test measures only
    // queue-reconstruction history loading.
    vi.spyOn(
      repos.reviewEvents,
      'observeForCard'
    ).mockImplementation(
      () => () => {}
    );

    const perCardReads =
      vi.spyOn(
        repos.reviewEvents,
        'listForCard'
      );

    const ownerWideReads =
      vi.spyOn(
        repos.reviewEvents,
        'list'
      );

    const service =
      new ReviewService(repos);

    try {
      const queue =
        await service.getNextReview();

      expect(queue.status)
        .toBe('ready');

      expect(perCardReads)
        .toHaveBeenCalledTimes(0);

      expect(ownerWideReads)
        .toHaveBeenCalledTimes(0);
    } finally {
      service.destroy();
    }
  });
});
