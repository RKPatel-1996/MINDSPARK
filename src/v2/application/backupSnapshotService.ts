import { normalizeBackupDataCollections } from '../backup/normalization';
import { reviewCardSchema, type ReviewCard } from '../domain/card';
import { reviewEventSchema, type ReviewEvent } from '../domain/event';
import { knowledgeItemSchema, type KnowledgeItem } from '../domain/knowledge';
import { schedulerParameterSetSchema, type SchedulerParameterSet } from '../domain/schedulerParameterSet';
import { taxonomyRegistrySchema, type TaxonomyRegistry } from '../domain/taxonomy';
import { settingsSchema } from './settingsService';
import type { Settings } from '../persistence/repository/interfaces';
import type { Repositories } from './types';

export interface BackupSourceSnapshot {
  exportedAt: string;
  taxonomy: TaxonomyRegistry;
  settings: Settings;
  schedulerParameterSets: SchedulerParameterSet[];
  knowledgeItems: KnowledgeItem[];
  reviewCards: ReviewCard[];
  reviewEvents: ReviewEvent[];
}

export class BackupSourceSnapshotValidationError extends Error {
  constructor(readonly causeValue: unknown) {
    super('Collected source data is not a valid MindSpark backup snapshot');
    this.name = 'BackupSourceSnapshotValidationError';
  }
}

/**
 * Collects repository-owned source data before B4 converts media references to
 * portable archive entries and invokes the B2 final-envelope validator.
 */
export class BackupSnapshotService {
  constructor(
    private readonly repos: Repositories,
    private readonly now: () => string = () => new Date().toISOString(),
  ) {}

  async createSnapshot(): Promise<BackupSourceSnapshot> {
    const [rawTaxonomy, rawSettings, rawParameterSets, rawKnowledgeItems, rawReviewCards, rawReviewEvents] =
      await Promise.all([
        this.repos.taxonomy.get(),
        this.repos.settings.get(),
        this.repos.parameterSets.list(),
        this.repos.knowledge.list(),
        this.repos.reviewCards.list(),
        this.repos.reviewEvents.list(),
      ]);

    try {
      const data = normalizeBackupDataCollections({
        taxonomy: taxonomyRegistrySchema.parse(rawTaxonomy),
        settings: settingsSchema.parse(rawSettings),
        schedulerParameterSets: rawParameterSets.map((value) => schedulerParameterSetSchema.parse(value)),
        knowledgeItems: rawKnowledgeItems.map((value) => knowledgeItemSchema.parse(value)),
        reviewCards: rawReviewCards.map((value) => reviewCardSchema.parse(value)),
        reviewEvents: rawReviewEvents.map((value) => reviewEventSchema.parse(value)),
      });
      return { exportedAt: this.now(), ...data };
    } catch (error) {
      throw new BackupSourceSnapshotValidationError(error);
    }
  }
}
