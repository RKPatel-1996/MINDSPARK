import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  startAfter,
  limit,
  writeBatch,
  runTransaction,
  type Firestore,
  Timestamp,
} from 'firebase/firestore';
import type {
  KnowledgeRepository,
  ReviewCardRepository,
  ReviewEventRepository,
  TaxonomyRepository,
  SchedulerParameterSetRepository,
  SettingsRepository,
  SyncMetadata,
  SyncState,
  EventWatermark,
  ReceivedEventPage
} from '../../repository/interfaces';
import type { KnowledgeItem, KnowledgeStatus } from '../../../domain/knowledge';
import type { ReviewCard } from '../../../domain/card';
import type { ReviewEvent } from '../../../domain/event';
import { taxonomyRegistrySchema, type TaxonomyRegistry } from '../../../domain/taxonomy';
import type { SchedulerParameterSet } from '../../../domain/schedulerParameterSet';
import type { Settings } from '../../repository/interfaces';
import {
  eventWatermarkSchema
} from '../../../domain/event';
import {
  mapKnowledgeItemToDTO,
  mapDTOToKnowledgeItem,
  mapReviewCardToDTO,
  mapDTOToReviewCard,
  mapReviewEventToDTO,
  mapDTOToReviewEvent,
  mapTaxonomyToDTO,
  mapDTOToTaxonomy,
  mapSchedulerParameterSetToDTO,
  mapDTOToSchedulerParameterSet,
  mapSettingsToDTO,
  mapDTOToSettings,
  sanitizeFirestoreDto,
} from '../mappers/domainMappers';

export class FirestoreKnowledgeRepository implements KnowledgeRepository {
  constructor(private db: Firestore, private uid: string) {}

  private getCollection() {
    return collection(this.db, `users/${this.uid}/knowledgeItems`);
  }

  async get(id: string): Promise<KnowledgeItem | null> {
    const d = await getDoc(doc(this.getCollection(), id));
    return d.exists() ? mapDTOToKnowledgeItem(d.data()) : null;
  }

  async list(): Promise<KnowledgeItem[]> {
    const snapshot = await getDocs(this.getCollection());
    return snapshot.docs.map((d) => mapDTOToKnowledgeItem(d.data()));
  }

  async create(item: KnowledgeItem): Promise<void> {
    await setDoc(doc(this.getCollection(), item.id), mapKnowledgeItemToDTO(item));
  }

  async createBundle(item: KnowledgeItem, cards: ReviewCard[]): Promise<void> {
    const batch = writeBatch(this.db);
    const itemRef = doc(this.getCollection(), item.id);
    batch.set(itemRef, mapKnowledgeItemToDTO(item));
    for (const card of cards) {
      const cardRef = doc(this.db, `users/${this.uid}/reviewCards/${card.id}`);
      batch.set(cardRef, mapReviewCardToDTO(card));
    }
    await batch.commit();
  }

  async createKnowledgeBundle(item: KnowledgeItem, cards: ReviewCard[]): Promise<void> {
    return this.createBundle(item, cards);
  }

  async update(item: KnowledgeItem): Promise<void> {
    await updateDoc(doc(this.getCollection(), item.id), mapKnowledgeItemToDTO(item));
  }

  async updateStatus(id: string, status: KnowledgeStatus, updatedAt: string): Promise<void> {
    await updateDoc(doc(this.getCollection(), id), { status, updatedAt });
  }

  async archive(id: string): Promise<void> {
    await this.updateStatus(id, 'archived', new Date().toISOString());
  }
}

export class FirestoreReviewCardRepository implements ReviewCardRepository {
  constructor(private db: Firestore, private uid: string) {}

  private getCollection() {
    return collection(this.db, `users/${this.uid}/reviewCards`);
  }

  async get(id: string): Promise<ReviewCard | null> {
    const d = await getDoc(doc(this.getCollection(), id));
    return d.exists() ? mapDTOToReviewCard(d.data()) : null;
  }

  async list(): Promise<ReviewCard[]> { const q = query(this.getCollection()); const snapshot = await getDocs(q); return snapshot.docs.map((d) => mapDTOToReviewCard({ id: d.id, ...d.data() } as any)); } async listForKnowledgeItem(knowledgeItemId: string): Promise<ReviewCard[]> {
    const q = query(this.getCollection(), where('knowledgeItemId', '==', knowledgeItemId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => mapDTOToReviewCard(d.data()));
  }

  async create(card: ReviewCard): Promise<void> {
    await setDoc(doc(this.db, `users/${this.uid}/reviewCards/${card.id}`), mapReviewCardToDTO(card));
  }

  async update(card: ReviewCard): Promise<void> {
    await updateDoc(doc(this.db, `users/${this.uid}/reviewCards/${card.id}`), mapReviewCardToDTO(card));
  }
}

export class FirestoreReviewEventRepository implements ReviewEventRepository {
  private currentSyncMetadata: SyncMetadata = {
    state: 'synced',
    hasPendingWrites: false,
    fromCache: false,
  };

  constructor(private db: Firestore, private uid: string) {}

  private getCollection() {
    return collection(this.db, `users/${this.uid}/reviewEvents`);
  }

  getSyncMetadata(): SyncMetadata {
    return { ...this.currentSyncMetadata };
  }

  observeSyncState(callback: (metadata: SyncMetadata) => void): () => void {
    // Note: A more scalable dedicated sync-metadata strategy can be introduced later if history becomes very large.
    // For now, observing the entire collection guarantees that any locally cached pending ReviewEvent 
    // is represented in the observed snapshot.
    return onSnapshot(
      this.getCollection(),
      { includeMetadataChanges: true },
      (snapshot) => {
        const hasPendingWrites = snapshot.metadata.hasPendingWrites;
        const fromCache = snapshot.metadata.fromCache;
        const state: SyncState = hasPendingWrites
          ? 'pending_writes'
          : fromCache
          ? 'offline_or_cache'
          : 'synced';
        this.currentSyncMetadata = { state, hasPendingWrites, fromCache };
        callback(this.currentSyncMetadata);
      },
      (error) => {
        this.currentSyncMetadata = { state: 'error', hasPendingWrites: false, fromCache: false };
        callback(this.currentSyncMetadata);
      }
    );
  }

  async append(event: ReviewEvent): Promise<void> {
    const dto = mapReviewEventToDTO(event);
    // Add persistence metadata: serverReceivedAt
    dto.serverReceivedAt = serverTimestamp();
    // Deterministic ID matches Event ID
    await setDoc(doc(this.getCollection(), event.id), sanitizeFirestoreDto(dto));
  }

  async get(id: string): Promise<ReviewEvent | null> {
    const d = await getDoc(doc(this.getCollection(), id));
    return d.exists() ? mapDTOToReviewEvent(d.data()) : null;
  }

  async listForCard(cardId: string): Promise<ReviewEvent[]> {
    const q = query(
      this.getCollection(),
      where('cardId', '==', cardId),
      orderBy('reviewTimestamp', 'asc'),
      orderBy('id', 'asc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => mapDTOToReviewEvent(d.data()));
  }

  observeForCard(cardId: string, callback: (events: ReviewEvent[], metadata: SyncMetadata) => void): () => void {
    const q = query(
      this.getCollection(),
      where('cardId', '==', cardId),
      orderBy('reviewTimestamp', 'asc'),
      orderBy('id', 'asc')
    );
    return onSnapshot(q, (snapshot) => {
      const events = snapshot.docs.map((d) => mapDTOToReviewEvent(d.data()));
      const syncMeta: SyncMetadata = {
        hasPendingWrites: snapshot.metadata.hasPendingWrites,
        fromCache: snapshot.metadata.fromCache,
        state: snapshot.metadata.hasPendingWrites ? 'pending_writes' : snapshot.metadata.fromCache ? 'offline_or_cache' : 'synced',
      };
      callback(events, syncMeta);
    }, (error) => {
       console.error("Observe events failed", error);
       callback([], { state: 'error', hasPendingWrites: false, fromCache: false });
    });
  }

  async listReceivedAfter(watermark?: EventWatermark, limitCount: number = 250): Promise<ReceivedEventPage> {
    if (limitCount <= 0 || limitCount > 1000) {
      throw new Error("limitCount must be a positive integer <= 1000");
    }
    
    let q = query(
      this.getCollection(),
      orderBy('serverReceivedAt', 'asc'),
      orderBy('id', 'asc'),
      limit(limitCount)
    );
    
    if (watermark) {
      const validatedWatermark = eventWatermarkSchema.parse(watermark);
      const ts = new Timestamp(validatedWatermark.serverReceivedAt.seconds, validatedWatermark.serverReceivedAt.nanoseconds);
      q = query(q, startAfter(ts, validatedWatermark.eventId));
    }
    
    const snapshot = await getDocs(q);
    
    const receivedEvents: import('../../repository/interfaces').ReceivedReviewEvent[] = [];
    let nextWatermark: EventWatermark | null = null;
    
    for (const d of snapshot.docs) {
      const data = d.data();
      // Filter out events that haven't been resolved with a server timestamp yet
      // This happens if the document is still pending write to the server
      if (data.serverReceivedAt && typeof data.serverReceivedAt.seconds === 'number') {
        const receivedAt = {
          seconds: data.serverReceivedAt.seconds,
          nanoseconds: data.serverReceivedAt.nanoseconds
        };
        receivedEvents.push({
          event: mapDTOToReviewEvent(data),
          serverReceivedAt: receivedAt
        });
        nextWatermark = {
          serverReceivedAt: receivedAt,
          eventId: data.id
        };
      }
    }
    
    return {
      events: receivedEvents,
      nextWatermark
    };
  }
}

export class FirestoreTaxonomyRepository implements TaxonomyRepository {
  constructor(private db: Firestore, private uid: string) {}

  private getDocRef() {
    return doc(this.db, `users/${this.uid}/taxonomy/current`);
  }

  async get(): Promise<TaxonomyRegistry | null> {
    const d = await getDoc(this.getDocRef());
    return d.exists() ? mapDTOToTaxonomy(d.data()) : null;
  }

  async save(registry: TaxonomyRegistry): Promise<void> {
    await setDoc(this.getDocRef(), mapTaxonomyToDTO(registry));
  }

  async mutate(mutator: (current: TaxonomyRegistry) => TaxonomyRegistry): Promise<TaxonomyRegistry> {
    const docRef = this.getDocRef();
    return await runTransaction(this.db, async (transaction) => {
      const snapshot = await transaction.get(docRef);
      if (!snapshot.exists()) {
        throw new Error('Taxonomy registry does not exist. Initial bootstrap is required before mutation.');
      }
      const currentRegistry = mapDTOToTaxonomy(snapshot.data());
      const mutated = mutator(currentRegistry);
      const validated = taxonomyRegistrySchema.parse(mutated);
      transaction.set(docRef, mapTaxonomyToDTO(validated));
      return validated;
    });
  }
}

export class FirestoreSchedulerParameterSetRepository implements SchedulerParameterSetRepository {
  constructor(private db: Firestore, private uid: string) {}

  private getCollection() {
    return collection(this.db, `users/${this.uid}/schedulerParameterSets`);
  }

  async get(id: string): Promise<SchedulerParameterSet | null> {
    const d = await getDoc(doc(this.getCollection(), id));
    return d.exists() ? mapDTOToSchedulerParameterSet(d.data()) : null;
  }

  async list(): Promise<SchedulerParameterSet[]> {
    const snapshot = await getDocs(this.getCollection());
    return snapshot.docs.map((d) => mapDTOToSchedulerParameterSet(d.data()));
  }

  async create(parameterSet: SchedulerParameterSet): Promise<void> {
    // Append-only, do not allow update/delete in repository
    await setDoc(doc(this.getCollection(), parameterSet.id), mapSchedulerParameterSetToDTO(parameterSet));
  }
}

export class FirestoreSettingsRepository implements SettingsRepository {
  constructor(private db: Firestore, private uid: string) {}

  private getDocRef() {
    return doc(this.db, `users/${this.uid}/settings/main`);
  }

  async get(): Promise<Settings | null> {
    const d = await getDoc(this.getDocRef());
    return d.exists() ? mapDTOToSettings(d.data()) : null;
  }

  async save(settings: Settings): Promise<void> {
    await setDoc(this.getDocRef(), mapSettingsToDTO(settings));
  }
}
