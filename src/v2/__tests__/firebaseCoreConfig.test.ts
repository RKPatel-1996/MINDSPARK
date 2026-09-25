import { describe, expect, it } from 'vitest';
import { classifyFirebaseCoreConfig } from '../auth/firebaseAuth';

describe('Firebase Auth and Firestore core configuration', () => {
  it('does not require a Storage bucket in the core configured values', () => {
    expect(classifyFirebaseCoreConfig(['api', 'auth', 'project', 'sender', 'app']))
      .toBe('configured');
  });

  it('keeps missing and partial core configuration fail-closed', () => {
    expect(classifyFirebaseCoreConfig([undefined, undefined, undefined, undefined, undefined]))
      .toBe('missing_configuration');
    expect(classifyFirebaseCoreConfig(['api', undefined, 'project', 'sender', 'app']))
      .toBe('invalid_configuration');
  });
});