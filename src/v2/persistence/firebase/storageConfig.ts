import {
  getStorage,
  type FirebaseStorage,
} from 'firebase/storage';
import { app, isFirebaseConfigured, isFirebaseStorageConfigured } from '../../auth/firebaseAuth';

let storageInstance: FirebaseStorage | null = null;
let storageInitializationError: Error | null = null;

export function getFirebaseStorage(): FirebaseStorage | null {
  if (!isFirebaseConfigured || !isFirebaseStorageConfigured || !app) {
    return null;
  }

  if (storageInstance) {
    return storageInstance;
  }

  try {
    storageInstance = getStorage(app);
  } catch (err) {
    console.error('Failed to initialize Firebase Storage.', err);
    storageInitializationError =
      err instanceof Error ? err : new Error(String(err));
  }

  return storageInstance;
}

export function getFirebaseStorageInitializationError(): Error | null {
  return storageInitializationError;
}
