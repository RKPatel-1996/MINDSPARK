import { doc, runTransaction, serverTimestamp, type Firestore } from 'firebase/firestore';
import type { FirebaseStorage } from 'firebase/storage';
import { semanticallyEqual, type RestoreOperation } from '../../backup/restore';
import type { BackupEnvelopeV1 } from '../../backup/contract';
import { CANONICAL_TAXONOMY_REGISTRY } from '../../application/canonicalTaxonomy';
import { DEFAULT_SETTINGS } from '../../application/bootstrapService';
import { toPortableTargetKnowledgeItem } from '../../application/backupRestoreService';
import type { KnowledgeItem } from '../../domain/knowledge';
import type { ReviewCard } from '../../domain/card';
import type { ReviewEvent } from '../../domain/event';
import type { SchedulerParameterSet } from '../../domain/schedulerParameterSet';
import type { TaxonomyRegistry } from '../../domain/taxonomy';
import type { Settings } from '../repository/interfaces';
import {
  mapDTOToKnowledgeItem, mapDTOToReviewCard, mapDTOToReviewEvent,
  mapDTOToSchedulerParameterSet, mapDTOToSettings, mapDTOToTaxonomy,
  mapKnowledgeItemToDTO, mapReviewCardToDTO, mapReviewEventToDTO,
  mapSchedulerParameterSetToDTO, mapSettingsToDTO, mapTaxonomyToDTO,
  sanitizeFirestoreDto,
} from './mappers/domainMappers';
import { buildKnowledgeImageStoragePath, FirebaseImageStorageService } from './imageStorageService';

export class RestorePreconditionError extends Error {
  constructor(readonly operationId: string) {
    super(`Restore target or prerequisite changed for ${operationId}`);
    this.name = 'RestorePreconditionError';
  }
}

/** Each transaction checks its target and immediate B5 prerequisites before writing. */
export class FirebaseRestoreWriteGateway {
  constructor(private readonly db: Firestore, private readonly uid: string) {
    if (!uid || uid.includes('/')) throw new Error('Invalid restore owner UID');
  }

  async applyInsert(
    operation: RestoreOperation, value: unknown, backup: BackupEnvelopeV1,
  ): Promise<'inserted' | 'no_op'> {
    if (operation.disposition !== 'INSERT' || operation.value === undefined) {
      throw new Error('Only B5 INSERT operations may be written');
    }
    const location = {
      scheduler_parameter_set: `schedulerParameterSets/${operation.entityId}`,
      taxonomy: 'taxonomy/current',
      knowledge_item: `knowledgeItems/${operation.entityId}`,
      review_card: `reviewCards/${operation.entityId}`,
      review_event: `reviewEvents/${operation.entityId}`,
      settings: 'settings/main',
    }[operation.entityType];
    const targetRef = doc(this.db, `users/${this.uid}/${location}`);
    return runTransaction(this.db, async (transaction) => {
      const dependencies: Array<{ path: string; expected: unknown; decode: (data: any) => unknown }> = [];
      const source = backup.data;
      if (operation.entityType === 'knowledge_item') {
        dependencies.push({ path: 'taxonomy/current', expected: source.taxonomy, decode: mapDTOToTaxonomy });
      }
      if (operation.entityType === 'review_card' || operation.entityType === 'review_event') {
        const card = operation.entityType === 'review_card'
          ? value as ReviewCard
          : source.reviewCards.find((entry) => entry.id === (value as ReviewEvent).cardId);
        if (!card) throw new RestorePreconditionError(operation.id);
        const item = source.knowledgeItems.find((entry) => entry.id === card.knowledgeItemId);
        if (!item) throw new RestorePreconditionError(operation.id);
        dependencies.push({ path: `knowledgeItems/${item.id}`, expected: item,
          decode: (data) => toPortableTargetKnowledgeItem(mapDTOToKnowledgeItem(data)) });
        if (operation.entityType === 'review_event') {
          dependencies.push({ path: `reviewCards/${card.id}`, expected: card, decode: mapDTOToReviewCard });
        }
      }
      if (operation.entityType === 'review_event' || operation.entityType === 'settings') {
        const parameterSetId = operation.entityType === 'review_event'
          ? (value as ReviewEvent).schedulerMetadata.parameterSetId
          : (value as Settings).activeParameterSetId;
        const parameterSet = source.schedulerParameterSets.find((entry) => entry.id === parameterSetId);
        if (!parameterSet) throw new RestorePreconditionError(operation.id);
        dependencies.push({ path: `schedulerParameterSets/${parameterSetId}`,
          expected: parameterSet, decode: mapDTOToSchedulerParameterSet });
      }
      const references = [targetRef, ...dependencies.map((entry) => doc(this.db, `users/${this.uid}/${entry.path}`))];
      const [snapshot, ...dependencySnapshots] = await Promise.all(
        references.map((reference) => transaction.get(reference)));
      dependencySnapshots.forEach((dependencySnapshot, index) => {
        const dependency = dependencies[index];
        if (!dependencySnapshot.exists()) {
          throw new RestorePreconditionError(operation.id);
        }
        try {
          if (!semanticallyEqual(dependency.decode(dependencySnapshot.data()), dependency.expected)) {
            throw new RestorePreconditionError(operation.id);
          }
        } catch {
          // A concurrently malformed prerequisite is also a stale B5 assumption.
          throw new RestorePreconditionError(operation.id);
        }
      });
      if (snapshot.exists()) {
        const data = snapshot.data();
        const existing = {
          scheduler_parameter_set: () => mapDTOToSchedulerParameterSet(data),
          taxonomy: () => mapDTOToTaxonomy(data),
          knowledge_item: () => toPortableTargetKnowledgeItem(mapDTOToKnowledgeItem(data)),
          review_card: () => mapDTOToReviewCard(data),
          review_event: () => mapDTOToReviewEvent(data),
          settings: () => mapDTOToSettings(data),
        }[operation.entityType]();
        const comparisonValue = operation.entityType === 'knowledge_item'
          ? operation.value : value;
        if (semanticallyEqual(existing, comparisonValue)) return 'no_op';
        if (operation.entityType === 'taxonomy' &&
          semanticallyEqual(existing, CANONICAL_TAXONOMY_REGISTRY)) {
          // B5 permits replacing only the unchanged bootstrap singleton.
        } else if (operation.entityType === 'settings' &&
          semanticallyEqual(existing, DEFAULT_SETTINGS)) {
          // B5 permits replacing only the unchanged bootstrap singleton.
        } else {
          throw new RestorePreconditionError(operation.id);
        }
      }
      const encoded = (() => {
        switch (operation.entityType) {
          case 'scheduler_parameter_set':
            return mapSchedulerParameterSetToDTO(value as SchedulerParameterSet);
          case 'taxonomy': return mapTaxonomyToDTO(value as TaxonomyRegistry);
          case 'knowledge_item': return mapKnowledgeItemToDTO(value as KnowledgeItem);
          case 'review_card': return mapReviewCardToDTO(value as ReviewCard);
          case 'review_event': return {
            ...mapReviewEventToDTO(value as ReviewEvent),
            serverReceivedAt: serverTimestamp(),
          };
          case 'settings': return mapSettingsToDTO(value as Settings);
        }
      })();
      transaction.set(targetRef, sanitizeFirestoreDto(encoded));
      return 'inserted';
    });
  }
}

export class FirebaseRestoreMediaGateway {
  private readonly images: FirebaseImageStorageService;

  constructor(storage: FirebaseStorage, private readonly uid: string) {
    this.images = new FirebaseImageStorageService(storage, uid);
  }

  canonicalPath(knowledgeItemId: string, imageId: string): string {
    return buildKnowledgeImageStoragePath(this.uid, knowledgeItemId, imageId);
  }

  readImageIfExists(storagePath: string) {
    return this.images.readImageIfExists(storagePath);
  }

  uploadImage(input: { knowledgeItemId: string; imageId: string; blob: Blob }) {
    return this.images.uploadImage(input);
  }
}
