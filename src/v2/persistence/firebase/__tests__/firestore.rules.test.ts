import { initializeTestEnvironment, assertFails, assertSucceeds, RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { describe, it, beforeAll, afterAll, afterEach } from 'vitest';
import { serverTimestamp } from 'firebase/firestore';
import testOwnerConfig from '../../../../../test-config/firestore-test-owner.json';

const OWNER_UID = testOwnerConfig.ownerUid;
const OTHER_UID = 'user_bob';

describe('Firestore Security Rules', () => {
  let testEnv: RulesTestEnvironment;

  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: 'mindspark-v2-test',
      firestore: {
        rules: readFileSync(resolve(__dirname, '../../../../../.generated/firestore.test.rules'), 'utf8'),
      },
    });
  });

  afterAll(async () => {
    await testEnv.cleanup();
  });

  afterEach(async () => {
    await testEnv.clearFirestore();
  });

  const getOwnerDb = () => testEnv.authenticatedContext(OWNER_UID).firestore();
  const getOtherDb = () => testEnv.authenticatedContext(OTHER_UID).firestore();
  const getUnauthDb = () => testEnv.unauthenticatedContext().firestore();

  it('unauthenticated -> denied', async () => {
    const unauthDb = getUnauthDb();
    await assertFails(unauthDb.collection(`users/${OWNER_UID}/knowledgeItems`).get());
    await assertFails(unauthDb.collection(`users/${OWNER_UID}/knowledgeItems`).add({ title: 'Test' }));
  });

  it('non-owner -> their own path denied', async () => {
    const otherDb = getOtherDb();
    await assertFails(otherDb.collection(`users/${OTHER_UID}/knowledgeItems`).get());
    await assertFails(otherDb.collection(`users/${OTHER_UID}/knowledgeItems`).add({ title: 'Bob item' }));
  });

  it('non-owner -> owner path denied', async () => {
    const otherDb = getOtherDb();
    await assertFails(otherDb.collection(`users/${OWNER_UID}/knowledgeItems`).get());
    await assertFails(otherDb.collection(`users/${OWNER_UID}/knowledgeItems`).add({ title: 'Test' }));
  });

  it('owner -> owner path allowed', async () => {
    const ownerDb = getOwnerDb();
    const docRef = ownerDb.doc(`users/${OWNER_UID}/knowledgeItems/test-item`);
    await assertSucceeds(docRef.set({ title: 'Test' }));
    await assertSucceeds(docRef.get());
  });

  it('owner -> other path denied', async () => {
    const ownerDb = getOwnerDb();
    const docRef = ownerDb.doc(`users/${OTHER_UID}/knowledgeItems/test-item`);
    await assertFails(docRef.set({ title: 'Test' }));
    await assertFails(docRef.get());
  });

  describe('ReviewEvents', () => {
    it('create allowed for owner with valid data', async () => {
      const ownerDb = getOwnerDb();
      const eventRef = ownerDb.doc(`users/${OWNER_UID}/reviewEvents/event-123`);
      await assertSucceeds(eventRef.set({
        id: 'event-123', // Matches doc ID
        cardId: 'card-1',
        knowledgeItemId: 'ki-1',
        reviewTimestamp: serverTimestamp(),
        rating: 'good',
        cardType: 'flashcard',
        objectiveCorrect: null,
        guessedOrStruggled: false,
        deviceId: 'test-device-id',
        schedulerMetadata: { algo: 'test' },
        schemaVersion: 1,
        serverReceivedAt: serverTimestamp(), // Correct server time
      }));
    });

    it('create denied if document ID does not match event ID', async () => {
      const ownerDb = getOwnerDb();
      const eventRef = ownerDb.doc(`users/${OWNER_UID}/reviewEvents/event-123`);
      await assertFails(eventRef.set({
        id: 'different-id',
        cardId: 'card-1',
        knowledgeItemId: 'ki-1',
        reviewTimestamp: serverTimestamp(),
        rating: 'good',
        cardType: 'flashcard',
        objectiveCorrect: null,
        guessedOrStruggled: false,
        deviceId: 'test-device-id',
        schedulerMetadata: { algo: 'test' },
        schemaVersion: 1,
        serverReceivedAt: serverTimestamp(),
      }));
    });

    it('create denied if missing required field', async () => {
      const ownerDb = getOwnerDb();
      const eventRef = ownerDb.doc(`users/${OWNER_UID}/reviewEvents/event-missing`);
      await assertFails(eventRef.set({
        id: 'event-missing',
        cardId: 'card-1',
        knowledgeItemId: 'ki-1',
        // missing reviewTimestamp
        rating: 'good',
        cardType: 'flashcard',
        objectiveCorrect: null,
        guessedOrStruggled: false,
        deviceId: 'test-device-id',
        schedulerMetadata: { algo: 'test' },
        schemaVersion: 1,
        serverReceivedAt: serverTimestamp(),
      }));
    });

    it('create denied if unexpected field exists', async () => {
      const ownerDb = getOwnerDb();
      const eventRef = ownerDb.doc(`users/${OWNER_UID}/reviewEvents/event-unexpected`);
      await assertFails(eventRef.set({
        id: 'event-unexpected',
        cardId: 'card-1',
        knowledgeItemId: 'ki-1',
        reviewTimestamp: serverTimestamp(),
        rating: 'good',
        cardType: 'flashcard',
        objectiveCorrect: null,
        guessedOrStruggled: false,
        deviceId: 'test-device-id',
        schedulerMetadata: { algo: 'test' },
        schemaVersion: 1,
        serverReceivedAt: serverTimestamp(),
        unexpectedField: 'not allowed',
      }));
    });

    it('update denied', async () => {
      const ownerDb = getOwnerDb();
      const eventRef = ownerDb.doc(`users/${OWNER_UID}/reviewEvents/event-update-test`);
      
      // Setup doc through bypass (using withSecurityRulesDisabled)
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().doc(`users/${OWNER_UID}/reviewEvents/event-update-test`).set({
          id: 'event-update-test'
        });
      });

      await assertFails(eventRef.update({ rating: 'again' }));
    });

    it('delete denied', async () => {
      const ownerDb = getOwnerDb();
      const eventRef = ownerDb.doc(`users/${OWNER_UID}/reviewEvents/event-delete-test`);
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().doc(`users/${OWNER_UID}/reviewEvents/event-delete-test`).set({
          id: 'event-delete-test'
        });
      });

      await assertFails(eventRef.delete());
    });
  });

  describe('SchedulerParameterSets', () => {
    it('creation allowed', async () => {
      const ownerDb = getOwnerDb();
      const setRef = ownerDb.doc(`users/${OWNER_UID}/schedulerParameterSets/param-1`);
      await assertSucceeds(setRef.set({
        id: 'param-1',
        weights: [1, 2, 3]
      }));
    });

    it('update denied', async () => {
      const ownerDb = getOwnerDb();
      const setRef = ownerDb.doc(`users/${OWNER_UID}/schedulerParameterSets/param-update-test`);
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().doc(`users/${OWNER_UID}/schedulerParameterSets/param-update-test`).set({
          id: 'param-update-test'
        });
      });
      await assertFails(setRef.update({ newWeight: 4 }));
    });

    it('delete denied', async () => {
      const ownerDb = getOwnerDb();
      const setRef = ownerDb.doc(`users/${OWNER_UID}/schedulerParameterSets/param-delete-test`);
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().doc(`users/${OWNER_UID}/schedulerParameterSets/param-delete-test`).set({
          id: 'param-delete-test'
        });
      });
      await assertFails(setRef.delete());
    });
  });
});
