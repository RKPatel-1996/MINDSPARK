import type { ReviewCard } from '../domain/card';
import type { ReviewEvent } from '../domain/event';
import type { SchedulerParameterSet } from '../domain/schedulerParameterSet';
import type { TaxonomyRegistry } from '../domain/taxonomy';

export interface BackupDataCollections<TKnowledgeItem extends { id: string }, TSettings> {
  taxonomy: TaxonomyRegistry;
  settings: TSettings;
  schedulerParameterSets: SchedulerParameterSet[];
  knowledgeItems: TKnowledgeItem[];
  reviewCards: ReviewCard[];
  reviewEvents: ReviewEvent[];
}

function compareStrings(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

/** Applies the V1 collection ordering without validating a final media envelope. */
export function normalizeBackupDataCollections<
  TKnowledgeItem extends { id: string },
  TSettings,
>(data: BackupDataCollections<TKnowledgeItem, TSettings>): BackupDataCollections<TKnowledgeItem, TSettings> {
  return {
    taxonomy: {
      domains: [...data.taxonomy.domains].sort((a, b) => compareStrings(a.id, b.id)),
      topics: [...data.taxonomy.topics].sort((a, b) => compareStrings(a.id, b.id)),
      subtopics: [...data.taxonomy.subtopics].sort((a, b) => compareStrings(a.id, b.id)),
      allowedTags: [...data.taxonomy.allowedTags].sort(compareStrings),
    },
    settings: { ...data.settings },
    schedulerParameterSets: [...data.schedulerParameterSets].sort((a, b) => compareStrings(a.id, b.id)),
    knowledgeItems: [...data.knowledgeItems].sort((a, b) => compareStrings(a.id, b.id)),
    reviewCards: [...data.reviewCards].sort((a, b) => compareStrings(a.id, b.id)),
    reviewEvents: [...data.reviewEvents].sort((a, b) => {
      const timestampDifference = new Date(a.reviewTimestamp).getTime() - new Date(b.reviewTimestamp).getTime();
      return timestampDifference || compareStrings(a.id, b.id);
    }),
  };
}
