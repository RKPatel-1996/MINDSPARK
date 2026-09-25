import { describe, expect, it, vi } from 'vitest';

const storageMocks = vi.hoisted(() => ({
  getStorage: vi.fn(),
}));

vi.mock('firebase/storage', () => ({
  getStorage: storageMocks.getStorage,
}));

vi.mock('../auth/firebaseAuth', () => ({
  app: { name: 'core-firebase-app' },
  isFirebaseConfigured: true,
  isFirebaseStorageConfigured: false,
}));

import {
  getFirebaseStorage,
  getFirebaseStorageInitializationError,
} from '../persistence/firebase/storageConfig';

describe('optional Firebase Storage initialization', () => {
  it('returns null without a bucket and never calls getStorage', () => {
    expect(getFirebaseStorage()).toBeNull();
    expect(getFirebaseStorageInitializationError()).toBeNull();
    expect(storageMocks.getStorage).not.toHaveBeenCalled();
  });
});
