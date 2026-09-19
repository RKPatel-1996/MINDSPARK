import type {
  KnowledgeRepository,
  ReviewCardRepository,
  ReviewEventRepository,
  TaxonomyRepository,
  SchedulerParameterSetRepository,
  SettingsRepository,
  SyncMetadata,
  EventWatermark,
  ReceivedEventPage,
  ReceivedReviewEvent,
  Settings,
} from '../repository/interfaces';
import type { KnowledgeItem, KnowledgeStatus } from '../../domain/knowledge';
import type { ReviewCard } from '../../domain/card';
import type { ReviewEvent } from '../../domain/event';
import { taxonomyRegistrySchema, type TaxonomyRegistry } from '../../domain/taxonomy';
import type { SchedulerParameterSet } from '../../domain/schedulerParameterSet';
import {
  BulkLifecycleError,
  normalizeBulkLifecycleItemIds,
  validateLifecycleTransition,
} from '../../domain/lifecycle';

export class InMemoryKnowledgeRepository implements KnowledgeRepository {
  private items = new Map<string, KnowledgeItem>();
  private cardRepo?: InMemoryReviewCardRepository;

  constructor(cardRepo?: InMemoryReviewCardRepository) {
    this.cardRepo = cardRepo;
  }

  setCardRepository(cardRepo: InMemoryReviewCardRepository): void {
    this.cardRepo = cardRepo;
  }

  async get(id: string): Promise<KnowledgeItem | null> {
    const item = this.items.get(id);
    return item ? JSON.parse(JSON.stringify(item)) : null;
  }

  async list(): Promise<KnowledgeItem[]> {
    return Array.from(this.items.values()).map((item) => JSON.parse(JSON.stringify(item)));
  }

  async create(item: KnowledgeItem): Promise<void> {
    this.items.set(item.id, JSON.parse(JSON.stringify(item)));
  }

  async createBundle(item: KnowledgeItem, cards: ReviewCard[]): Promise<void> {
    if (this.items.has(item.id)) {
      throw new Error(`KnowledgeItem ${item.id} already exists`);
    }
    const clonedItem = JSON.parse(JSON.stringify(item));
    const clonedCards = cards.map((c) => JSON.parse(JSON.stringify(c)));

    // Commit item and all cards atomically with rollback on any failure
    const insertedCardIds: string[] = [];
    try {
      this.items.set(clonedItem.id, clonedItem);
      if (this.cardRepo) {
        for (const card of clonedCards) {
          this.cardRepo.rawSet(card.id, card);
          insertedCardIds.push(card.id);
        }
      }
    } catch (err) {
      this.items.delete(clonedItem.id);
      if (this.cardRepo) {
        for (const cardId of insertedCardIds) {
          this.cardRepo.rawDelete(cardId);
        }
      }
      throw err;
    }
  }

  async createKnowledgeBundle(item: KnowledgeItem, cards: ReviewCard[]): Promise<void> {
    return this.createBundle(item, cards);
  }

  async update(item: KnowledgeItem): Promise<void> {
    if (!this.items.has(item.id)) {
      throw new Error(`KnowledgeItem ${item.id} not found`);
    }
    this.items.set(item.id, JSON.parse(JSON.stringify(item)));
  }

  async updateStatus(id: string, status: KnowledgeStatus, updatedAt: string): Promise<void> {
    const item = this.items.get(id);
    if (!item) {
      throw new Error(`KnowledgeItem ${id} not found`);
    }
    this.items.set(id, { ...item, status, updatedAt });
  }

  async bulkUpdateStatusAtomic(
    itemIds: readonly string[],
    targetStatus: KnowledgeStatus,
    updatedAt: string
  ): Promise<KnowledgeItem[]> {
    const normalizedIds = normalizeBulkLifecycleItemIds(itemIds);
    const currentItems = normalizedIds.map((itemId) => {
      const item = this.items.get(itemId);
      if (!item) {
        throw new BulkLifecycleError(
          'item_not_found',
          `KnowledgeItem "${itemId}" was not found.`,
          { itemId }
        );
      }
      return item;
    });

    // Resolve and validate the complete operation before mutating the backing map.
    for (const item of currentItems) {
      const validation = validateLifecycleTransition(item.status, targetStatus);
      if ('error' in validation) {
        throw new BulkLifecycleError(
          'invalid_transition',
          validation.error.message,
          { itemId: item.id, from: item.status, to: targetStatus }
        );
      }
    }

    const updatedItems = currentItems.map((item) => ({
      ...item,
      status: targetStatus,
      updatedAt,
    }));

    for (const item of updatedItems) {
      this.items.set(item.id, JSON.parse(JSON.stringify(item)));
    }

    return updatedItems.map((item) => JSON.parse(JSON.stringify(item)));
  }

  async archive(id: string): Promise<void> {
    await this.updateStatus(id, 'archived', new Date().toISOString());
  }

  clear(): void {
    this.items.clear();
  }
}

export class InMemoryReviewCardRepository implements ReviewCardRepository {
  private cards = new Map<string, ReviewCard>();

  rawSet(id: string, card: ReviewCard): void {
    this.cards.set(id, JSON.parse(JSON.stringify(card)));
  }

  rawDelete(id: string): void {
    this.cards.delete(id);
  }

  async get(id: string): Promise<ReviewCard | null> {
    const card = this.cards.get(id);
    return card ? JSON.parse(JSON.stringify(card)) : null;
  }

  async list(): Promise<ReviewCard[]> {
    return Array.from(this.cards.values()).map((card) => JSON.parse(JSON.stringify(card)));
  }

  async listForKnowledgeItem(knowledgeItemId: string): Promise<ReviewCard[]> {
    return Array.from(this.cards.values())
      .filter((c) => c.knowledgeItemId === knowledgeItemId)
      .map((card) => JSON.parse(JSON.stringify(card)));
  }

  async create(card: ReviewCard): Promise<void> {
    this.cards.set(card.id, JSON.parse(JSON.stringify(card)));
  }

  async update(card: ReviewCard): Promise<void> {
    if (!this.cards.has(card.id)) {
      throw new Error(`ReviewCard ${card.id} not found`);
    }
    this.cards.set(card.id, JSON.parse(JSON.stringify(card)));
  }

  clear(): void {
    this.cards.clear();
  }
}

export class InMemoryReviewEventRepository implements ReviewEventRepository {
  private events: Array<{ event: ReviewEvent; serverReceivedAt: { seconds: number; nanoseconds: number } }> = [];
  private listeners = new Map<string, Set<(events: ReviewEvent[], meta: SyncMetadata) => void>>();
  private syncMetadata: SyncMetadata = {
    state: 'synced',
    hasPendingWrites: false,
    fromCache: false,
  };
  private syncStateListeners = new Set<(meta: SyncMetadata) => void>();

  getSyncMetadata(): SyncMetadata {
    return { ...this.syncMetadata };
  }

  setSyncMetadata(meta: SyncMetadata): void {
    this.syncMetadata = { ...meta };
    for (const listener of this.syncStateListeners) {
      listener(this.syncMetadata);
    }
  }

  observeSyncState(callback: (metadata: SyncMetadata) => void): () => void {
    this.syncStateListeners.add(callback);
    callback({ ...this.syncMetadata });
    return () => {
      this.syncStateListeners.delete(callback);
    };
  }

  async append(event: ReviewEvent): Promise<void> {
    const now = Date.now();
    const serverReceivedAt = {
      seconds: Math.floor(now / 1000),
      nanoseconds: (now % 1000) * 1_000_000,
    };
    const clonedEvent = JSON.parse(JSON.stringify(event));
    this.events.push({ event: clonedEvent, serverReceivedAt });

    const cardListeners = this.listeners.get(event.cardId);
    if (cardListeners) {
      const cardEvents = await this.listForCard(event.cardId);
      const meta: SyncMetadata = { ...this.syncMetadata };
      for (const listener of cardListeners) {
        listener(cardEvents, meta);
      }
    }
  }

  async get(id: string): Promise<ReviewEvent | null> {
    const found = this.events.find((e) => e.event.id === id);
    return found ? JSON.parse(JSON.stringify(found.event)) : null;
  }

  async listForCard(cardId: string): Promise<ReviewEvent[]> {
    return this.events
      .filter((e) => e.event.cardId === cardId)
      .sort((a, b) => {
        const diff = new Date(a.event.reviewTimestamp).getTime() - new Date(b.event.reviewTimestamp).getTime();
        return diff !== 0 ? diff : a.event.id.localeCompare(b.event.id);
      })
      .map((e) => JSON.parse(JSON.stringify(e.event)));
  }

  observeForCard(cardId: string, callback: (events: ReviewEvent[], metadata: SyncMetadata) => void): () => void {
    if (!this.listeners.has(cardId)) {
      this.listeners.set(cardId, new Set());
    }
    this.listeners.get(cardId)!.add(callback);
    this.listForCard(cardId).then((cardEvents) => {
      callback(cardEvents, { state: 'synced', hasPendingWrites: false, fromCache: false });
    });

    return () => {
      this.listeners.get(cardId)?.delete(callback);
    };
  }

  async listReceivedAfter(watermark?: EventWatermark, limitCount = 250): Promise<ReceivedEventPage> {
    let list = [...this.events].sort((a, b) => {
      if (a.serverReceivedAt.seconds !== b.serverReceivedAt.seconds) {
        return a.serverReceivedAt.seconds - b.serverReceivedAt.seconds;
      }
      if (a.serverReceivedAt.nanoseconds !== b.serverReceivedAt.nanoseconds) {
        return a.serverReceivedAt.nanoseconds - b.serverReceivedAt.nanoseconds;
      }
      return a.event.id.localeCompare(b.event.id);
    });

    if (watermark) {
      const idx = list.findIndex(
        (e) =>
          e.serverReceivedAt.seconds === watermark.serverReceivedAt.seconds &&
          e.serverReceivedAt.nanoseconds === watermark.serverReceivedAt.nanoseconds &&
          e.event.id === watermark.eventId
      );
      if (idx !== -1) {
        list = list.slice(idx + 1);
      }
    }

    const sliced = list.slice(0, limitCount);
    const receivedEvents: ReceivedReviewEvent[] = sliced.map((s) => ({
      event: JSON.parse(JSON.stringify(s.event)),
      serverReceivedAt: { ...s.serverReceivedAt },
    }));

    let nextWatermark: EventWatermark | null = null;
    if (sliced.length > 0) {
      const last = sliced[sliced.length - 1];
      nextWatermark = {
        serverReceivedAt: { ...last.serverReceivedAt },
        eventId: last.event.id,
      };
    }

    return { events: receivedEvents, nextWatermark };
  }

  clear(): void {
    this.events = [];
    this.listeners.clear();
  }
}

export class InMemoryTaxonomyRepository implements TaxonomyRepository {
  private registry: TaxonomyRegistry | null = null;
  private mutationQueue: Promise<unknown> = Promise.resolve();

  async get(): Promise<TaxonomyRegistry | null> {
    return this.registry ? JSON.parse(JSON.stringify(this.registry)) : null;
  }

  async save(registry: TaxonomyRegistry): Promise<void> {
    this.registry = JSON.parse(JSON.stringify(registry));
  }

  async mutate(mutator: (current: TaxonomyRegistry) => TaxonomyRegistry): Promise<TaxonomyRegistry> {
    const op = async () => {
      if (!this.registry) {
        throw new Error('Taxonomy registry does not exist. Initial bootstrap is required before mutation.');
      }
      const currentClone: TaxonomyRegistry = JSON.parse(JSON.stringify(this.registry));
      const mutated = mutator(currentClone);
      const validated = taxonomyRegistrySchema.parse(mutated);
      this.registry = JSON.parse(JSON.stringify(validated));
      return JSON.parse(JSON.stringify(validated));
    };

    const nextPromise = this.mutationQueue.then(op, op);
    this.mutationQueue = nextPromise.catch(() => {});
    return nextPromise as Promise<TaxonomyRegistry>;
  }

  clear(): void {
    this.registry = null;
  }
}

export class InMemorySchedulerParameterSetRepository implements SchedulerParameterSetRepository {
  private sets = new Map<string, SchedulerParameterSet>();

  async get(id: string): Promise<SchedulerParameterSet | null> {
    const set = this.sets.get(id);
    return set ? JSON.parse(JSON.stringify(set)) : null;
  }

  async list(): Promise<SchedulerParameterSet[]> {
    return Array.from(this.sets.values()).map((s) => JSON.parse(JSON.stringify(s)));
  }

  async create(parameterSet: SchedulerParameterSet): Promise<void> {
    this.sets.set(parameterSet.id, JSON.parse(JSON.stringify(parameterSet)));
  }

  clear(): void {
    this.sets.clear();
  }
}

export class InMemorySettingsRepository implements SettingsRepository {
  private settings: Settings | null = null;

  async get(): Promise<Settings | null> {
    return this.settings ? JSON.parse(JSON.stringify(this.settings)) : null;
  }

  async save(settings: Settings): Promise<void> {
    this.settings = JSON.parse(JSON.stringify(settings));
  }

  clear(): void {
    this.settings = null;
  }
}

export interface Repositories {
  knowledge: KnowledgeRepository;
  reviewCards: ReviewCardRepository;
  reviewEvents: ReviewEventRepository;
  taxonomy: TaxonomyRepository;
  parameterSets: SchedulerParameterSetRepository;
  settings: SettingsRepository;
}

export function createInMemoryRepositories(): Repositories {
  const cardRepo = new InMemoryReviewCardRepository();
  const knowledgeRepo = new InMemoryKnowledgeRepository(cardRepo);
  return {
    knowledge: knowledgeRepo,
    reviewCards: cardRepo,
    reviewEvents: new InMemoryReviewEventRepository(),
    taxonomy: new InMemoryTaxonomyRepository(),
    parameterSets: new InMemorySchedulerParameterSetRepository(),
    settings: new InMemorySettingsRepository(),
  };
}
