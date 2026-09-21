import type { BackupEnvelopeV1, PortableKnowledgeItemV1 } from '../backup/contract';
import {
  createRestorePlan,
  type RestoreOperation,
  type RestorePlan,
  type RestoreTargetState,
} from '../backup/restore';
import type { ReviewCard } from '../domain/card';
import type { KnowledgeItem } from '../domain/knowledge';
import type { SchedulerParameterSet } from '../domain/schedulerParameterSet';
import { reconcileCardHistory, type ReconciliationResult } from '../reconciliation';
import type { Repositories } from './types';

export interface RestoreExecutionHooks {
  beforeInsert?(operation: RestoreOperation, insertNumber: number): void | Promise<void>;
}

export interface RestoreReconciliationResult {
  cardId: string;
  result: ReconciliationResult;
}

export type RestoreExecutionResult =
  | {
      status: 'blocked_conflicts';
      conflicts: RestorePlan['conflicts'];
      completedOperationIds: readonly string[];
    }
  | {
      status: 'blocked_media_prerequisite';
      mediaPrerequisites: RestorePlan['mediaPrerequisites'];
      completedOperationIds: readonly string[];
    }
  | {
      status: 'incomplete';
      completedOperationIds: readonly string[];
      failedOperationId: string;
      error: unknown;
    }
  | {
      status: 'postcondition_failed';
      completedOperationIds: readonly string[];
      reconciliation: readonly RestoreReconciliationResult[];
    }
  | {
      status: 'completed';
      completedOperationIds: readonly string[];
      noOpOperationIds: readonly string[];
      reconciliation: readonly RestoreReconciliationResult[];
    };

export function toPortableTargetKnowledgeItem(item: KnowledgeItem): PortableKnowledgeItemV1 {
  const { images, ...withoutImages } = item;
  return {
    ...withoutImages,
    ...(images && images.length > 0 ? {
      images: images.map(({ storagePath: _storagePath, ...image }) => ({
        ...image,
        assetId: image.id,
      })),
    } : {}),
  };
}

/** Reads complete authoritative state without writing or deriving CardState. */
export async function collectRestoreTargetState(repos: Repositories): Promise<RestoreTargetState> {
  const [taxonomy, settings, schedulerParameterSets, knowledgeItems, reviewCards, reviewEvents] =
    await Promise.all([
      repos.taxonomy.get(),
      repos.settings.get(),
      repos.parameterSets.list(),
      repos.knowledge.list(),
      repos.reviewCards.list(),
      repos.reviewEvents.list(),
    ]);
  return {
    taxonomy,
    settings,
    schedulerParameterSets,
    knowledgeItems: knowledgeItems.map(toPortableTargetKnowledgeItem),
    reviewCards,
    reviewEvents,
  };
}

async function writeInsert(repos: Repositories, operation: RestoreOperation): Promise<void> {
  switch (operation.entityType) {
    case 'scheduler_parameter_set':
      await repos.parameterSets.create(operation.value as SchedulerParameterSet);
      return;
    case 'taxonomy':
      await repos.taxonomy.save(operation.value as RestoreTargetState['taxonomy'] & {});
      return;
    case 'knowledge_item':
      await repos.knowledge.create(operation.value as unknown as KnowledgeItem);
      return;
    case 'review_card':
      await repos.reviewCards.create(operation.value as ReviewCard);
      return;
    case 'review_event':
      await repos.reviewEvents.append(operation.value as BackupEnvelopeV1['data']['reviewEvents'][number]);
      return;
    case 'settings':
      await repos.settings.save(operation.value as NonNullable<RestoreTargetState['settings']>);
      return;
  }
}

export async function reconcileRestoredState(repos: Repositories): Promise<RestoreReconciliationResult[]> {
  const [cards, events, parameterSets] = await Promise.all([
    repos.reviewCards.list(),
    repos.reviewEvents.list(),
    repos.parameterSets.list(),
  ]);
  const parameterSetsById = Object.fromEntries(
    parameterSets.map((parameterSet) => [parameterSet.id, parameterSet]),
  );
  return cards
    .slice()
    .sort((left, right) => left.id.localeCompare(right.id))
    .map((card) => ({
      cardId: card.id,
      result: reconcileCardHistory(
        card,
        events.filter((event) => event.cardId === card.id),
        parameterSetsById,
      ),
    }));
}

/** Executes only an already-created, conflict-free no-media plan. */
export async function executeRestorePlan(
  repos: Repositories,
  plan: RestorePlan,
  hooks: RestoreExecutionHooks = {},
): Promise<RestoreExecutionResult> {
  if (plan.conflicts.length > 0) {
    return { status: 'blocked_conflicts', conflicts: plan.conflicts, completedOperationIds: [] };
  }
  if (plan.requiresMediaExecutionInB6) {
    return {
      status: 'blocked_media_prerequisite',
      mediaPrerequisites: plan.mediaPrerequisites,
      completedOperationIds: [],
    };
  }

  const completedOperationIds: string[] = [];
  const noOpOperationIds = plan.operations
    .filter((operation) => operation.disposition === 'NO_OP')
    .map((operation) => operation.id);
  let insertNumber = 0;
  for (const operation of plan.operations) {
    if (operation.disposition !== 'INSERT') continue;
    insertNumber += 1;
    try {
      await hooks.beforeInsert?.(operation, insertNumber);
      await writeInsert(repos, operation);
      completedOperationIds.push(operation.id);
    } catch (error) {
      return {
        status: 'incomplete',
        completedOperationIds,
        failedOperationId: operation.id,
        error,
      };
    }
  }

  const reconciliation = await reconcileRestoredState(repos);
  if (reconciliation.some(({ result }) => result.ok === false)) {
    return { status: 'postcondition_failed', completedOperationIds, reconciliation };
  }
  return { status: 'completed', completedOperationIds, noOpOperationIds, reconciliation };
}

export class BackupRestoreService {
  constructor(private readonly repos: Repositories) {}

  async createPlan(backup: unknown): Promise<RestorePlan> {
    return createRestorePlan(backup, await collectRestoreTargetState(this.repos));
  }

  async execute(plan: RestorePlan, hooks?: RestoreExecutionHooks): Promise<RestoreExecutionResult> {
    return executeRestorePlan(this.repos, plan, hooks);
  }
}
