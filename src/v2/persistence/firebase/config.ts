import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  CACHE_SIZE_UNLIMITED,
  type Firestore,
} from 'firebase/firestore';
import { app, isFirebaseConfigured } from '../../auth/firebaseAuth';

let firestoreInstance: Firestore | null = null;
let firestoreInitializationError: Error | null = null;

export function getFirestoreDb(): Firestore | null {
  if (!isFirebaseConfigured || !app) {
    return null;
  }

  if (firestoreInstance) {
    return firestoreInstance;
  }

  try {
    // Note: CACHE_SIZE_UNLIMITED disables Firestore's LRU cache cleanup, 
    // ensuring long-term retention of offline knowledge items.
    // However, it does NOT override browser or device storage quotas.
    firestoreInstance = initializeFirestore(app, {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager(),
        cacheSizeBytes: CACHE_SIZE_UNLIMITED,
      })
    });
  } catch (err) {
    console.error('Failed to initialize Firestore with persistent local cache.', err);
    firestoreInitializationError = err instanceof Error ? err : new Error(String(err));
  }

  return firestoreInstance;
}

export function getFirestoreInitializationError(): Error | null {
  return firestoreInitializationError;
}
