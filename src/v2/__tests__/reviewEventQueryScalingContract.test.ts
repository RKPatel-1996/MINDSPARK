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

describe('WORK-015 aggregate ReviewEvent retrieval contract', () => {
  let repos: ReturnType<
    typeof createInMemoryRepositories
  >;

  beforeEach(async () => {
    repos =
      createInMemoryRepositories();

    await seedInitialLibrary(repos);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('Library listKnowledgeItems performs one logical multi-card history load', async () => {
    const batchReads =
      vi.spyOn(
        repos.reviewEvents,
        'listForCards'
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

    await new LibraryService(repos)
      .listKnowledgeItems();

    expect(batchReads)
      .toHaveBeenCalledTimes(1);

    expect(perCardReads)
      .toHaveBeenCalledTimes(0);

    expect(ownerWideReads)
      .toHaveBeenCalledTimes(0);
  });

  it('Library getKnowledgeItem performs one logical multi-card history load for that item', async () => {
    const items =
      await repos.knowledge.list();

    const firstItem =
      items[0];

    if (!firstItem) {
      throw new Error(
        'Expected seeded KnowledgeItem'
      );
    }

    const batchReads =
      vi.spyOn(
        repos.reviewEvents,
        'listForCards'
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

    await new LibraryService(repos)
      .getKnowledgeItem(
        firstItem.id
      );

    expect(batchReads)
      .toHaveBeenCalledTimes(1);

    expect(perCardReads)
      .toHaveBeenCalledTimes(0);

    expect(ownerWideReads)
      .toHaveBeenCalledTimes(0);
  });

  it('Insights performs one logical multi-card history load for active cards', async () => {
    const batchReads =
      vi.spyOn(
        repos.reviewEvents,
        'listForCards'
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

    await new InsightsService(repos)
      .getInsights();

    expect(batchReads)
      .toHaveBeenCalledTimes(1);

    expect(perCardReads)
      .toHaveBeenCalledTimes(0);

    expect(ownerWideReads)
      .toHaveBeenCalledTimes(0);
  });

  it('direct syncDayContext performs one logical multi-card history load', async () => {
    const batchReads =
      vi.spyOn(
        repos.reviewEvents,
        'listForCards'
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
      await service.syncDayContext();

      expect(batchReads)
        .toHaveBeenCalledTimes(1);

      expect(perCardReads)
        .toHaveBeenCalledTimes(0);

      expect(ownerWideReads)
        .toHaveBeenCalledTimes(0);
    } finally {
      service.destroy();
    }
  });

  it('getNextReview loads aggregate histories once and reuses them for day context and reconciliation', async () => {
    vi.spyOn(
      repos.reviewEvents,
      'observeForCard'
    ).mockImplementation(
      () => () => {}
    );

    const batchReads =
      vi.spyOn(
        repos.reviewEvents,
        'listForCards'
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

      expect(batchReads)
        .toHaveBeenCalledTimes(1);

      expect(perCardReads)
        .toHaveBeenCalledTimes(0);

      expect(ownerWideReads)
        .toHaveBeenCalledTimes(0);
    } finally {
      service.destroy();
    }
  });

  it('true single-card getEventsForCard retains the single-card repository contract', async () => {
    const cards =
      await repos.reviewCards.list();

    const firstCard =
      cards[0];

    if (!firstCard) {
      throw new Error(
        'Expected seeded ReviewCard'
      );
    }

    const batchReads =
      vi.spyOn(
        repos.reviewEvents,
        'listForCards'
      );

    const perCardReads =
      vi.spyOn(
        repos.reviewEvents,
        'listForCard'
      );

    const service =
      new ReviewService(repos);

    try {
      await service.getEventsForCard(
        firstCard.id
      );

      expect(perCardReads)
        .toHaveBeenCalledTimes(1);

      expect(batchReads)
        .toHaveBeenCalledTimes(0);
    } finally {
      service.destroy();
    }
  });
});
