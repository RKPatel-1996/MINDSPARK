import type { Settings } from '../persistence/repository/interfaces';
import type { ReviewCard } from '../domain/card';
import type { ReviewEvent } from '../domain/event';
import type { SchedulerParameterSet } from '../domain/schedulerParameterSet';
import type { TaxonomyRegistry } from '../domain/taxonomy';
import { CANONICAL_TAXONOMY_REGISTRY } from '../application/canonicalTaxonomy';
import { DEFAULT_SETTINGS } from '../application/bootstrapService';
import type {
  BackupEnvelopeV1,
  BackupMediaEntryV1,
  PortableKnowledgeItemV1,
} from './contract';
import { validateAndNormalizeBackup, type BackupValidationIssue } from './validator';

export type RestoreStage =
  | 'media_prerequisites'
  | 'scheduler_parameter_sets'
  | 'taxonomy'
  | 'knowledge_items'
  | 'review_cards'
  | 'review_events'
  | 'settings';

export type RestoreEntityType =
  | 'media'
  | 'scheduler_parameter_set'
  | 'taxonomy'
  | 'knowledge_item'
  | 'review_card'
  | 'review_event'
  | 'settings';

export type RestoreDisposition = 'INSERT' | 'NO_OP' | 'CONFLICT';

export const RESTORE_STAGE_ORDER: readonly RestoreStage[] = [
  'media_prerequisites',
  'scheduler_parameter_sets',
  'taxonomy',
  'knowledge_items',
  'review_cards',
  'review_events',
  'settings',
];

export interface RestoreTargetState {
  taxonomy: TaxonomyRegistry | null;
  settings: Settings | null;
  schedulerParameterSets: readonly SchedulerParameterSet[];
  knowledgeItems: readonly PortableKnowledgeItemV1[];
  reviewCards: readonly ReviewCard[];
  reviewEvents: readonly ReviewEvent[];
}

export interface RestoreOperation {
  id: string;
  stage: Exclude<RestoreStage, 'media_prerequisites'>;
  entityType: Exclude<RestoreEntityType, 'media'>;
  entityId: string;
  disposition: RestoreDisposition;
  value?: RestoreValue;
}

type RestoreValue =
  | SchedulerParameterSet
  | TaxonomyRegistry
  | PortableKnowledgeItemV1
  | ReviewCard
  | ReviewEvent
  | Settings;

export interface RestoreMediaPrerequisite {
  id: string;
  stage: 'media_prerequisites';
  entityType: 'media';
  entityId: string;
  disposition: 'MEDIA_REQUIRES_B6';
  media: BackupMediaEntryV1;
}

export interface RestoreConflict {
  operationId: string;
  stage: RestoreStage;
  entityType: RestoreEntityType;
  entityId: string;
  reason: string;
}

export interface RestorePlan {
  backup: BackupEnvelopeV1;
  stageOrder: readonly RestoreStage[];
  mediaPrerequisites: readonly RestoreMediaPrerequisite[];
  operations: readonly RestoreOperation[];
  conflicts: readonly RestoreConflict[];
  canExecute: boolean;
  requiresMediaExecutionInB6: boolean;
}

export class RestorePreflightError extends Error {
  constructor(
    readonly code: 'invalid_backup',
    readonly issues: readonly BackupValidationIssue[],
  ) {
    super('Restore requires a valid MindSpark backup envelope');
    this.name = 'RestorePreflightError';
  }
}

function stableValue(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableValue).join(',')}]`;
  if (value && typeof value === 'object') {
    const object = value as Record<string, unknown>;
    return `{${Object.keys(object).sort().flatMap((key) =>
      object[key] === undefined ? [] : [`${JSON.stringify(key)}:${stableValue(object[key])}`]
    ).join(',')}}`;
  }
  return JSON.stringify(value);
}

function semanticallyEqual(left: unknown, right: unknown): boolean {
  return stableValue(left) === stableValue(right);
}

function operationId(stage: RestoreStage, entityType: RestoreEntityType, entityId: string): string {
  return `${stage}:${entityType}:${entityId}`;
}

function classifyEntity<S extends RestoreValue & { id: string }, T extends { id: string }>(
  stage: RestoreOperation['stage'],
  entityType: RestoreOperation['entityType'],
  source: readonly S[],
  target: readonly T[],
): { operations: RestoreOperation[]; conflicts: RestoreConflict[] } {
  const targetById = new Map<string, T>();
  const duplicateTargetIds = new Set<string>();
  for (const value of target) {
    if (targetById.has(value.id)) duplicateTargetIds.add(value.id);
    else targetById.set(value.id, value);
  }

  const conflicts: RestoreConflict[] = [];
  const operations = source.map((value) => {
    const id = operationId(stage, entityType, value.id);
    const existing = targetById.get(value.id);
    if (duplicateTargetIds.has(value.id)) {
      const conflict: RestoreConflict = {
        operationId: id,
        stage,
        entityType,
        entityId: value.id,
        reason: 'Target contains multiple records with the same immutable ID',
      };
      conflicts.push(conflict);
      return { id, stage, entityType, entityId: value.id, disposition: 'CONFLICT' as const };
    }
    if (!existing) {
      return { id, stage, entityType, entityId: value.id, disposition: 'INSERT' as const, value };
    }
    if (semanticallyEqual(existing, value)) {
      return { id, stage, entityType, entityId: value.id, disposition: 'NO_OP' as const };
    }
    conflicts.push({
      operationId: id,
      stage,
      entityType,
      entityId: value.id,
      reason: 'Same ID has different authoritative content in the target',
    });
    return { id, stage, entityType, entityId: value.id, disposition: 'CONFLICT' as const };
  });
  return { operations, conflicts };
}

function classifySingleton<T extends RestoreValue>(
  stage: Extract<RestoreOperation['stage'], 'taxonomy' | 'settings'>,
  entityType: Extract<RestoreOperation['entityType'], 'taxonomy' | 'settings'>,
  source: T,
  target: T | null,
  bootstrapDefault: T,
): { operation: RestoreOperation; conflict?: RestoreConflict } {
  const entityId = entityType;
  const id = operationId(stage, entityType, entityId);
  if (target === null) {
    return { operation: { id, stage, entityType, entityId, disposition: 'INSERT', value: source } };
  }
  if (semanticallyEqual(target, source)) {
    return { operation: { id, stage, entityType, entityId, disposition: 'NO_OP' } };
  }
  if (semanticallyEqual(target, bootstrapDefault)) {
    return { operation: { id, stage, entityType, entityId, disposition: 'INSERT', value: source } };
  }
  const conflict: RestoreConflict = {
    operationId: id,
    stage,
    entityType,
    entityId,
    reason: 'Non-default authoritative target value differs from the backup',
  };
  return {
    operation: { id, stage, entityType, entityId, disposition: 'CONFLICT' },
    conflict,
  };
}

/** Builds a no-write, deterministic V1 restore plan from the B2 authority. */
export function createRestorePlan(
  backupInput: unknown,
  target: RestoreTargetState,
): RestorePlan {
  const validation = validateAndNormalizeBackup(backupInput);
  if ('issues' in validation) {
    throw new RestorePreflightError('invalid_backup', validation.issues);
  }
  const backup = validation.backup;
  const parameterSets = classifyEntity(
    'scheduler_parameter_sets', 'scheduler_parameter_set',
    backup.data.schedulerParameterSets, target.schedulerParameterSets,
  );
  const knowledgeItems = classifyEntity(
    'knowledge_items', 'knowledge_item',
    backup.data.knowledgeItems, target.knowledgeItems,
  );
  const reviewCards = classifyEntity(
    'review_cards', 'review_card', backup.data.reviewCards, target.reviewCards,
  );
  const reviewEvents = classifyEntity(
    'review_events', 'review_event', backup.data.reviewEvents, target.reviewEvents,
  );
  const taxonomy = classifySingleton(
    'taxonomy', 'taxonomy', backup.data.taxonomy, target.taxonomy,
    CANONICAL_TAXONOMY_REGISTRY,
  );
  const settings = classifySingleton(
    'settings', 'settings', backup.data.settings, target.settings,
    DEFAULT_SETTINGS,
  );
  const conflicts = [
    ...parameterSets.conflicts,
    ...(taxonomy.conflict ? [taxonomy.conflict] : []),
    ...knowledgeItems.conflicts,
    ...reviewCards.conflicts,
    ...reviewEvents.conflicts,
    ...(settings.conflict ? [settings.conflict] : []),
  ];
  const mediaPrerequisites = backup.media.map((media) => ({
    id: operationId('media_prerequisites', 'media', media.assetId),
    stage: 'media_prerequisites' as const,
    entityType: 'media' as const,
    entityId: media.assetId,
    disposition: 'MEDIA_REQUIRES_B6' as const,
    media,
  }));
  const operations = [
    ...parameterSets.operations,
    taxonomy.operation,
    ...knowledgeItems.operations,
    ...reviewCards.operations,
    ...reviewEvents.operations,
    settings.operation,
  ];

  return {
    backup,
    stageOrder: RESTORE_STAGE_ORDER,
    mediaPrerequisites,
    operations,
    conflicts,
    canExecute: conflicts.length === 0 && mediaPrerequisites.length === 0,
    requiresMediaExecutionInB6: mediaPrerequisites.length > 0,
  };
}
