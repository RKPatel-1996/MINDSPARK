import type { Repositories } from './types';
import { createInMemoryRepositories } from '../persistence/memory/inMemoryRepositories';
import { createSignedOutRepositories } from '../persistence/signedOut/signedOutRepositories';
import { createUnconfiguredRepositories } from '../persistence/unconfigured/unconfiguredRepositories';
import {
  FirestoreKnowledgeRepository,
  FirestoreReviewCardRepository,
  FirestoreReviewEventRepository,
  FirestoreTaxonomyRepository,
  FirestoreSchedulerParameterSetRepository,
  FirestoreSettingsRepository,
} from '../persistence/firebase/repositories/firestoreRepositories';
import { getFirestoreDb } from '../persistence/firebase/config';
import type { User } from 'firebase/auth';

export interface RepositoryFactoryOptions {
  isDev?: boolean;
  devModeOptIn?: boolean;
}

export function createRepositoriesForUser(
  user: User | null,
  options?: RepositoryFactoryOptions
): Repositories {
  const db = getFirestoreDb();
  if (user && db) {
    return {
      knowledge: new FirestoreKnowledgeRepository(db, user.uid),
      reviewCards: new FirestoreReviewCardRepository(db, user.uid),
      reviewEvents: new FirestoreReviewEventRepository(db, user.uid),
      taxonomy: new FirestoreTaxonomyRepository(db, user.uid),
      parameterSets: new FirestoreSchedulerParameterSetRepository(db, user.uid),
      settings: new FirestoreSettingsRepository(db, user.uid),
    };
  }

  // If Firebase is configured but user is not signed in:
  // Return signed-out repositories that prohibit silent mutations into ephemeral memory
  if (db && !user) {
    return createSignedOutRepositories();
  }

  // Fallback when Firebase is unconfigured:
  // Ephemeral in-memory repositories are strictly restricted to development environments
  // with explicit user opt-in. In production builds or unconfigured dev without opt-in,
  // return read-only unconfigured repositories that reject mutations.
  const isDev = options?.isDev ?? (typeof import.meta !== 'undefined' && Boolean(import.meta.env?.DEV));
  if (isDev && options?.devModeOptIn) {
    return createInMemoryRepositories();
  }

  return createUnconfiguredRepositories();
}
