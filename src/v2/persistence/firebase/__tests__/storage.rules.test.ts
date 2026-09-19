import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { afterAll, afterEach, beforeAll, describe, it } from 'vitest';
import testOwnerConfig from '../../../../../test-config/firestore-test-owner.json';

const OWNER_UID = testOwnerConfig.ownerUid;
const OTHER_UID = 'user_bob';

// Storage emulator workaround: small uploads can hang before their promise settles.
const EMULATOR_UPLOAD_PAYLOAD = 'a'.repeat(300 * 1024);

function uploadAsPromise<T>(task: PromiseLike<T>): Promise<T> {
  return Promise.resolve(task);
}

const IMAGE_PATH =
  `users/${OWNER_UID}/knowledgeImages/knowledge-item-1/image-1`;

describe('Firebase Storage Security Rules', () => {
  let testEnv: RulesTestEnvironment;

  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: 'mindspark-v2-test',
      storage: {
        rules: readFileSync(
          resolve(__dirname, '../../../../../.generated/storage.test.rules'),
          'utf8',
        ),
      },
    });
  });

  afterEach(async () => {
    await testEnv.clearStorage();
  });

  afterAll(async () => {
    await testEnv.cleanup();
  });

  it('denies unauthenticated image writes and reads', async () => {
    const storage = testEnv.unauthenticatedContext().storage();
    const ref = storage.ref(IMAGE_PATH);

    await assertFails(
      uploadAsPromise(ref.putString(EMULATOR_UPLOAD_PAYLOAD, 'raw', { contentType: 'image/png' })),
    );

    await assertFails(ref.getDownloadURL());
  });

  it('denies non-owner access to the owner image path', async () => {
    const storage = testEnv.authenticatedContext(OTHER_UID).storage();
    const ref = storage.ref(IMAGE_PATH);

    await assertFails(
      uploadAsPromise(ref.putString(EMULATOR_UPLOAD_PAYLOAD, 'raw', { contentType: 'image/png' })),
    );

    await assertFails(ref.getDownloadURL());
  });

  it('allows owner JPEG, PNG, and WebP creates', async () => {
    const storage = testEnv.authenticatedContext(OWNER_UID).storage();

    await assertSucceeds(
      uploadAsPromise(storage
        .ref(`users/${OWNER_UID}/knowledgeImages/item/jpeg`)
        .putString(EMULATOR_UPLOAD_PAYLOAD, 'raw', { contentType: 'image/jpeg' })),
    );

    await assertSucceeds(
      uploadAsPromise(storage
        .ref(`users/${OWNER_UID}/knowledgeImages/item/png`)
        .putString(EMULATOR_UPLOAD_PAYLOAD, 'raw', { contentType: 'image/png' })),
    );

    await assertSucceeds(
      uploadAsPromise(storage
        .ref(`users/${OWNER_UID}/knowledgeImages/item/webp`)
        .putString(EMULATOR_UPLOAD_PAYLOAD, 'raw', { contentType: 'image/webp' })),
    );
  });

  it('rejects unsupported MIME types', async () => {
    const storage = testEnv.authenticatedContext(OWNER_UID).storage();

    await assertFails(
      uploadAsPromise(storage
        .ref(`users/${OWNER_UID}/knowledgeImages/item/gif`)
        .putString(EMULATOR_UPLOAD_PAYLOAD, 'raw', { contentType: 'image/gif' })),
    );

    await assertFails(
      uploadAsPromise(storage
        .ref(`users/${OWNER_UID}/knowledgeImages/item/svg`)
        .putString(EMULATOR_UPLOAD_PAYLOAD, 'raw', { contentType: 'image/svg+xml' })),
    );

    await assertFails(
      uploadAsPromise(storage
        .ref(`users/${OWNER_UID}/knowledgeImages/item/text`)
        .putString(EMULATOR_UPLOAD_PAYLOAD, 'raw', { contentType: 'text/plain' })),
    );
  });

  it('rejects files larger than 5 MiB', async () => {
    const storage = testEnv.authenticatedContext(OWNER_UID).storage();
    const oversized = 'a'.repeat((5 * 1024 * 1024) + 1);

    await assertFails(
      uploadAsPromise(storage
        .ref(`users/${OWNER_UID}/knowledgeImages/item/oversized`)
        .putString(oversized, 'raw', { contentType: 'image/png' })),
    );
  });

  it('allows owner read and delete', async () => {
    const storage = testEnv.authenticatedContext(OWNER_UID).storage();
    const ref = storage.ref(IMAGE_PATH);

    await assertSucceeds(
      uploadAsPromise(ref.putString(EMULATOR_UPLOAD_PAYLOAD, 'raw', { contentType: 'image/png' })),
    );

    await assertSucceeds(ref.getDownloadURL());
    await assertSucceeds(ref.delete());
  });

  it('denies overwriting an existing object', async () => {
    const storage = testEnv.authenticatedContext(OWNER_UID).storage();
    const ref = storage.ref(IMAGE_PATH);

    await assertSucceeds(
      uploadAsPromise(ref.putString(EMULATOR_UPLOAD_PAYLOAD, 'raw', { contentType: 'image/png' })),
    );

    await assertFails(
      uploadAsPromise(ref.putString(EMULATOR_UPLOAD_PAYLOAD, 'raw', { contentType: 'image/png' })),
    );
  });

  it('denies writes outside the canonical image path', async () => {
    const storage = testEnv.authenticatedContext(OWNER_UID).storage();

    await assertFails(
      uploadAsPromise(storage
        .ref(`users/${OWNER_UID}/other/image-1`)
        .putString(EMULATOR_UPLOAD_PAYLOAD, 'raw', { contentType: 'image/png' })),
    );
  });
});
