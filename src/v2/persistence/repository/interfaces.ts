import type { KnowledgeItem, KnowledgeStatus } from '../../domain/knowledge';
import type { ReviewCard } from '../../domain/card';
import type { ReviewEvent } from '../../domain/event';
import type { TaxonomyRegistry } from '../../domain/taxonomy';
import type { SchedulerParameterSet } from '../../domain/schedulerParameterSet';

export type SyncState = 'synced' | 'pending_writes' | 'offline_or_cache' | 'error';

export interface SyncMetadata {
  state: SyncState;
  hasPendingWrites: boolean;
  fromCache: boolean;
}

export interface Settings {
  schemaVersion: number;
  desiredRetention: number;
  activeParameterSetId: string;
  newCardDailyLimit: number;
  reserveHorizonHours: number;
}

export interface KnowledgeRepository {
  get(id: string): Promise<KnowledgeItem | null>;
  list(): Promise<KnowledgeItem[]>;
  create(item: KnowledgeItem): Promise<void>;
  createBundle(item: KnowledgeItem, cards: ReviewCard[]): Promise<void>;
  createKnowledgeBundle?(item: KnowledgeItem, cards: ReviewCard[]): Promise<void>;
  update(item: KnowledgeItem): Promise<void>;
  archive(id: string): Promise<void>;
  updateStatus(id: string, status: KnowledgeStatus, updatedAt: string): Promise<void>;
  bulkUpdateStatusAtomic(
    itemIds: readonly string[],
    targetStatus: KnowledgeStatus,
    updatedAt: string
  ): Promise<KnowledgeItem[]>;
}

export interface ReviewCardRepository {
  get(id: string): Promise<ReviewCard | null>;
  list(): Promise<ReviewCard[]>;
  listForKnowledgeItem(knowledgeItemId: string): Promise<ReviewCard[]>;
  create(card: ReviewCard): Promise<void>;
  update(card: ReviewCard): Promise<void>;
}

export interface PreciseTimestamp {
  seconds: number;
  nanoseconds: number; // 0 through 999,999,999
}

export interface EventWatermark {
  serverReceivedAt: PreciseTimestamp;
  eventId: string;
}

export interface ReceivedReviewEvent {
  event: ReviewEvent;
  serverReceivedAt: PreciseTimestamp;
}

export interface ReceivedEventPage {
  events: ReceivedReviewEvent[];
  nextWatermark: EventWatermark | null;
}

export interface ReviewEventRepository {
  append(event: ReviewEvent): Promise<void>;
  get(id: string): Promise<ReviewEvent | null>;
  list(): Promise<ReviewEvent[]>;
  listForCard(cardId: string): Promise<ReviewEvent[]>;
  observeForCard(cardId: string, callback: (events: ReviewEvent[], metadata: SyncMetadata) => void): () => void;
  observeSyncState?(callback: (metadata: SyncMetadata) => void): () => void;
  getSyncMetadata?(): SyncMetadata;
  // query events received after a synchronization watermark
  listReceivedAfter(watermark?: EventWatermark, limit?: number): Promise<ReceivedEventPage>;
}

export interface TaxonomyRepository {
  get(): Promise<TaxonomyRegistry | null>;
  save(registry: TaxonomyRegistry): Promise<void>;
  mutate(mutator: (current: TaxonomyRegistry) => TaxonomyRegistry): Promise<TaxonomyRegistry>;
}

export interface SchedulerParameterSetRepository {
  get(id: string): Promise<SchedulerParameterSet | null>;
  list(): Promise<SchedulerParameterSet[]>;
  create(parameterSet: SchedulerParameterSet): Promise<void>;
}

export interface SettingsRepository {
  get(): Promise<Settings | null>;
  save(settings: Settings): Promise<void>;
}
