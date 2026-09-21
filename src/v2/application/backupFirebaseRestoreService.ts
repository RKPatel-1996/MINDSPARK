import type { BackupMediaFile, BackupContentHasher } from './backupExportService';
import type { BackupEnvelopeV1 } from '../backup/contract';
import { webCryptoBackupHasher } from './backupExportService';
import { collectRestoreTargetState, reconcileRestoredState } from './backupRestoreService';
import { createRestorePlan, RESTORE_STAGE_ORDER, semanticallyEqual, type RestoreOperation, type RestorePlan } from '../backup/restore';
import { validateAndNormalizeBackup } from '../backup/validator';
import { MAX_IMAGE_BYTES, isAllowedImageMimeType } from '../domain/imageMedia';
import type { KnowledgeItem } from '../domain/knowledge';
import type { Repositories } from './types';

export interface RestoreMediaPayload {
  readonly files: ReadonlyMap<string, BackupMediaFile>;
}

export interface RestoreMediaGateway {
  canonicalPath(knowledgeItemId: string, imageId: string): string;
  readImageIfExists(storagePath: string): Promise<BackupMediaFile | null>;
  uploadImage(input: { knowledgeItemId: string; imageId: string; blob: Blob }): Promise<string>;
}

export interface RestoreWriteGateway {
  applyInsert(operation: RestoreOperation, value: unknown, backup: BackupEnvelopeV1): Promise<'inserted' | 'no_op'>;
}

export type FirebaseRestoreErrorCategory =
  | 'invalid_input' | 'unsafe_plan' | 'media_validation' | 'media_conflict'
  | 'precondition_conflict' | 'storage_failure' | 'firestore_failure' | 'postcondition_failure';

export type FirebaseRestoreResult = {
  status: 'complete' | 'incomplete' | 'conflict';
  category?: FirebaseRestoreErrorCategory;
  completedOperationIds: readonly string[];
  noOpOperationIds: readonly string[];
  failedOperationId?: string;
  error?: unknown;
};

function sameMedia(left: BackupMediaFile, right: BackupMediaFile): boolean {
  return left.mimeType === right.mimeType &&
    left.bytes.byteLength === right.bytes.byteLength &&
    left.bytes.every((byte, index) => byte === right.bytes[index]);
}

function planMatchesBackup(plan: RestorePlan): boolean {
  const source = plan.backup.data;
  const expected = [
    ...source.schedulerParameterSets.map((value) => ['scheduler_parameter_sets', 'scheduler_parameter_set', value.id, value]),
    ['taxonomy', 'taxonomy', 'taxonomy', source.taxonomy],
    ...source.knowledgeItems.map((value) => ['knowledge_items', 'knowledge_item', value.id, value]),
    ...source.reviewCards.map((value) => ['review_cards', 'review_card', value.id, value]),
    ...source.reviewEvents.map((value) => ['review_events', 'review_event', value.id, value]),
    ['settings', 'settings', 'settings', source.settings],
  ] as const;
  return semanticallyEqual(plan.stageOrder, RESTORE_STAGE_ORDER) &&
    plan.operations.length === expected.length &&
    plan.operations.every((operation, index) => {
      const [stage, entityType, entityId, value] = expected[index];
      return operation.stage === stage && operation.entityType === entityType &&
        operation.entityId === entityId &&
        operation.id === `${stage}:${entityType}:${entityId}` &&
        (operation.disposition === 'INSERT'
          ? semanticallyEqual(operation.value, value)
          : operation.value === undefined);
    }) &&
    plan.mediaPrerequisites.length === plan.backup.media.length &&
    plan.mediaPrerequisites.every((prerequisite, index) => {
      const media = plan.backup.media[index];
      return prerequisite.id === `media_prerequisites:media:${media.assetId}` &&
        prerequisite.entityId === media.assetId &&
        semanticallyEqual(prerequisite.media, media);
    });
}

/** B6 consumes B5's plan; the supplied bytes are independent of ZIP and Firebase. */
export class BackupFirebaseRestoreService {
  constructor(
    private readonly repos: Repositories,
    private readonly media: RestoreMediaGateway,
    private readonly writes: RestoreWriteGateway,
    private readonly hasher: BackupContentHasher = webCryptoBackupHasher,
  ) {}

  async execute(
    plan: RestorePlan,
    payload: RestoreMediaPayload,
    beforeOperation?: (operationId: string) => void | Promise<void>,
  ): Promise<FirebaseRestoreResult> {
    const completedOperationIds: string[] = [];
    const noOpOperationIds: string[] = [];
    const fail = (
      category: FirebaseRestoreErrorCategory,
      failedOperationId: string | undefined,
      error?: unknown,
    ): FirebaseRestoreResult => ({
      status: category === 'precondition_conflict' || category === 'media_conflict' || category === 'unsafe_plan'
        ? 'conflict' : 'incomplete',
      category, completedOperationIds, noOpOperationIds, failedOperationId, error,
    });

    // Validate every supplied byte before the first persistence mutation.
    const validation = validateAndNormalizeBackup(plan.backup);
    if ('issues' in validation ||
      !semanticallyEqual(validation.backup, plan.backup) ||
      !planMatchesBackup(plan) ||
      plan.conflicts.length > 0 ||
      (!plan.canExecute && !plan.requiresMediaExecutionInB6) ||
      plan.operations.some((operation) => operation.disposition === 'CONFLICT')) {
      return fail('unsafe_plan', undefined, 'Backup or B5 plan is not execution-safe');
    }
    const manifestIds = new Set(plan.mediaPrerequisites.map((entry) => entry.media.assetId));
    if (manifestIds.size !== plan.backup.media.length ||
      plan.mediaPrerequisites.length !== plan.backup.media.length ||
      payload.files.size !== manifestIds.size ||
      [...payload.files.keys()].some((assetId) => !manifestIds.has(assetId))) {
      return fail('invalid_input', undefined, 'Media payload does not match the validated manifest');
    }
    for (const prerequisite of plan.mediaPrerequisites) {
      const manifest = prerequisite.media;
      const file = payload.files.get(manifest.assetId);
      try {
        if (!file || !isAllowedImageMimeType(file.mimeType) ||
          file.mimeType !== manifest.mimeType ||
          file.bytes.byteLength !== manifest.byteLength ||
          file.bytes.byteLength === 0 || file.bytes.byteLength > MAX_IMAGE_BYTES ||
          await this.hasher.sha256(file.bytes) !== manifest.sha256) {
          return fail('media_validation', prerequisite.id, 'Media bytes fail manifest or image validation');
        }
      } catch (error) {
        return fail('media_validation', prerequisite.id, error);
      }
    }

    for (const prerequisite of plan.mediaPrerequisites) {
      const manifest = prerequisite.media;
      const file = payload.files.get(manifest.assetId)!;
      const storagePath = this.media.canonicalPath(manifest.knowledgeItemId, manifest.imageId);
      try {
        await beforeOperation?.(prerequisite.id);
        const existing = await this.media.readImageIfExists(storagePath);
        if (existing) {
          if (!sameMedia(existing, file)) return fail('media_conflict', prerequisite.id);
          noOpOperationIds.push(prerequisite.id);
          continue;
        }
        try {
          await this.media.uploadImage({
            knowledgeItemId: manifest.knowledgeItemId,
            imageId: manifest.imageId,
            blob: new Blob([file.bytes as BlobPart], { type: file.mimeType }),
          });
        } catch (error) {
          // Storage rules allow create only. A concurrent identical upload is a no-op.
          const raced = await this.media.readImageIfExists(storagePath);
          if (!raced) return fail('storage_failure', prerequisite.id, error);
          if (!sameMedia(raced, file)) return fail('media_conflict', prerequisite.id, error);
          noOpOperationIds.push(prerequisite.id);
          continue;
        }
        completedOperationIds.push(prerequisite.id);
      } catch (error) {
        return fail('storage_failure', prerequisite.id, error);
      }
    }

    for (const operation of plan.operations) {
      if (operation.disposition === 'NO_OP') {
        noOpOperationIds.push(operation.id);
        continue;
      }
      if (operation.disposition !== 'INSERT' || operation.value === undefined) {
        return fail('unsafe_plan', operation.id);
      }
      let value: unknown = operation.value;
      if (operation.entityType === 'knowledge_item') {
        const portable = operation.value as RestorePlan['backup']['data']['knowledgeItems'][number];
        const { images, ...withoutImages } = portable;
        value = {
          ...withoutImages,
          ...(images ? { images: images.map(({ assetId: _assetId, ...image }) => ({
            ...image,
            storagePath: this.media.canonicalPath(portable.id, image.id),
          })) } : {}),
        } satisfies KnowledgeItem;
      }
      try {
        await beforeOperation?.(operation.id);
        const outcome = await this.writes.applyInsert(operation, value, plan.backup);
        (outcome === 'inserted' ? completedOperationIds : noOpOperationIds).push(operation.id);
      } catch (error) {
        const category = error instanceof Error && error.name === 'RestorePreconditionError'
          ? 'precondition_conflict' : 'firestore_failure';
        return fail(category, operation.id, error);
      }
    }

    try {
      const target = await collectRestoreTargetState(this.repos);
      const postPlan = createRestorePlan(plan.backup, target);
      if (postPlan.conflicts.length > 0 ||
        postPlan.operations.some((operation) => operation.disposition !== 'NO_OP')) {
        return fail('postcondition_failure', undefined, postPlan.conflicts);
      }
      const restoredItemIds = new Set(plan.backup.data.knowledgeItems.map((item) => item.id));
      const restoredItems = (await this.repos.knowledge.list())
        .filter((item) => restoredItemIds.has(item.id));
      for (const item of restoredItems) {
        for (const image of item.images ?? []) {
          if (image.storagePath !== this.media.canonicalPath(item.id, image.id)) {
            return fail('postcondition_failure', `knowledge_items:knowledge_item:${item.id}`);
          }
        }
      }
      for (const prerequisite of plan.mediaPrerequisites) {
        const entry = prerequisite.media;
        const path = this.media.canonicalPath(entry.knowledgeItemId, entry.imageId);
        const restored = await this.media.readImageIfExists(path);
        if (!restored || !sameMedia(restored, payload.files.get(entry.assetId)!)) {
          return fail('postcondition_failure', prerequisite.id);
        }
      }
      const reconciliation = await reconcileRestoredState(this.repos);
      if (reconciliation.some(({ result }) => !result.ok)) {
        return fail('postcondition_failure', undefined, reconciliation);
      }
    } catch (error) {
      return fail('postcondition_failure', undefined, error);
    }
    return { status: 'complete', completedOperationIds, noOpOperationIds };
  }
}
