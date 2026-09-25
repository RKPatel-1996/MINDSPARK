import { initializeApp, getApp, getApps } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User,
} from 'firebase/auth';

export type FirebaseConfigState = 'configured' | 'missing_configuration' | 'invalid_configuration';

const getEnvVar = (key: string) => {
  // Try Vite's import.meta.env first
  if (typeof import.meta !== 'undefined' && (import.meta as any).env) {
    return (import.meta as any).env[key];
  }
  // Fallback to process.env for Node/test environments
  if (typeof process !== 'undefined' && process.env) {
    return process.env[key];
  }
  return undefined;
};

const firebaseConfig = {
  apiKey: getEnvVar('VITE_FIREBASE_API_KEY'),
  authDomain: getEnvVar('VITE_FIREBASE_AUTH_DOMAIN'),
  projectId: getEnvVar('VITE_FIREBASE_PROJECT_ID'),
  storageBucket: getEnvVar('VITE_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: getEnvVar('VITE_FIREBASE_MESSAGING_SENDER_ID'),
  appId: getEnvVar('VITE_FIREBASE_APP_ID'),
};

export function classifyFirebaseCoreConfig(values: readonly unknown[]): FirebaseConfigState {
  if (values.every(value => Boolean(value))) return 'configured';
  if (values.every(value => !value)) return 'missing_configuration';
  return 'invalid_configuration';
}

export function getFirebaseConfigState(): FirebaseConfigState {
  return classifyFirebaseCoreConfig([
    firebaseConfig.apiKey,
    firebaseConfig.authDomain,
    firebaseConfig.projectId,
    firebaseConfig.messagingSenderId,
    firebaseConfig.appId,
  ]);
}

export const isFirebaseConfigured = getFirebaseConfigState() === 'configured';
export const isFirebaseStorageConfigured = Boolean(firebaseConfig.storageBucket);

export const app = isFirebaseConfigured 
  ? (getApps().length === 0 ? initializeApp(firebaseConfig as any) : getApp())
  : null;

export const auth = app ? getAuth(app) : null;
const googleProvider = new GoogleAuthProvider();

export function observeAuthState(callback: (user: User | null) => void) {
  if (!auth) {
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(auth, callback);
}

export async function signInWithGooglePopup(): Promise<User | null> {
  if (!auth) throw new Error('Firebase Auth is not initialized');
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}

export async function signInWithGoogleRedirect(): Promise<void> {
  if (!auth) throw new Error('Firebase Auth is not initialized');
  await signInWithRedirect(auth, googleProvider);
}

export async function completeRedirectSignIn(): Promise<User | null> {
  if (!auth) return null;
  const result = await getRedirectResult(auth);
  return result?.user ?? null;
}

export async function signOut(): Promise<void> {
  if (!auth) return;
  await firebaseSignOut(auth);
}

export function getCurrentUser(): User | null {
  return auth?.currentUser ?? null;
}
