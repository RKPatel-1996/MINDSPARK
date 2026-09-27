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

  const VALID_EVENT_ID = '11111111-1111-4111-8111-111111111111';
  const VALID_CARD_ID = '22222222-2222-4222-8222-222222222222';
  const VALID_KNOWLEDGE_ITEM_ID = '33333333-3333-4333-8333-333333333333';

  const validSchedulerMetadata = () => ({
    algorithm: 'fsrs-6',
    implementation: 'ts-fsrs',
    implementationVersion: '5.4.2',
    parameterSetId: 'fsrs-6-default',
    scheduledDays: 1,
    stability: 2.5,
    difficulty: 5,
    desiredRetention: 0.9,
  });

  const validReviewEvent = (overrides: Record<string, unknown> = {}) => ({
    id: VALID_EVENT_ID,
    cardId: VALID_CARD_ID,
    knowledgeItemId: VALID_KNOWLEDGE_ITEM_ID,
    reviewTimestamp: serverTimestamp(),
    rating: 'good',
    cardType: 'flashcard',
    objectiveCorrect: null,
    guessedOrStruggled: false,
    deviceId: 'test-device-id',
    schedulerMetadata: validSchedulerMetadata(),
    schemaVersion: 1,
    serverReceivedAt: serverTimestamp(),
    ...overrides,
  });

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
    it('create allowed for owner with valid subjective ReviewEvent', async () => {
      const ownerDb = getOwnerDb();
      const eventRef = ownerDb.doc(`users/${OWNER_UID}/reviewEvents/${VALID_EVENT_ID}`);
      await assertSucceeds(eventRef.set(validReviewEvent()));
    });

    it('create allowed for owner with valid objective ReviewEvent', async () => {
      const ownerDb = getOwnerDb();
      const eventRef = ownerDb.doc(`users/${OWNER_UID}/reviewEvents/${VALID_EVENT_ID}`);
      await assertSucceeds(eventRef.set(validReviewEvent({
        cardType: 'mcq',
        objectiveCorrect: true,
        durationMs: 0,
      })));
    });

    it('create denied if document ID does not match event ID', async () => {
      const ownerDb = getOwnerDb();
      const eventRef = ownerDb.doc(`users/${OWNER_UID}/reviewEvents/${VALID_EVENT_ID}`);
      await assertFails(eventRef.set(validReviewEvent({
        id: '44444444-4444-4444-8444-444444444444',
      })));
    });

    it('create denied if missing required field', async () => {
      const ownerDb = getOwnerDb();
      const eventRef = ownerDb.doc(`users/${OWNER_UID}/reviewEvents/${VALID_EVENT_ID}`);
      const event = validReviewEvent();
      delete (event as any).reviewTimestamp;
      await assertFails(eventRef.set(event));
    });

    it('create denied if unexpected field exists', async () => {
      const ownerDb = getOwnerDb();
      const eventRef = ownerDb.doc(`users/${OWNER_UID}/reviewEvents/${VALID_EVENT_ID}`);
      await assertFails(eventRef.set(validReviewEvent({
        unexpectedField: 'not allowed',
      })));
    });

    it('create denied for invalid ReviewEvent UUID', async () => {
      const ownerDb = getOwnerDb();
      const eventRef = ownerDb.doc(`users/${OWNER_UID}/reviewEvents/not-a-uuid`);
      await assertFails(eventRef.set(validReviewEvent({ id: 'not-a-uuid' })));
    });

    it('create denied for invalid card UUID', async () => {
      const ownerDb = getOwnerDb();
      const eventRef = ownerDb.doc(`users/${OWNER_UID}/reviewEvents/${VALID_EVENT_ID}`);
      await assertFails(eventRef.set(validReviewEvent({ cardId: 'not-a-uuid' })));
    });

    it('create denied for invalid knowledgeItem UUID', async () => {
      const ownerDb = getOwnerDb();
      const eventRef = ownerDb.doc(`users/${OWNER_UID}/reviewEvents/${VALID_EVENT_ID}`);
      await assertFails(eventRef.set(validReviewEvent({ knowledgeItemId: 'not-a-uuid' })));
    });

    it('create denied for invalid rating enum', async () => {
      const ownerDb = getOwnerDb();
      const eventRef = ownerDb.doc(`users/${OWNER_UID}/reviewEvents/${VALID_EVENT_ID}`);
      await assertFails(eventRef.set(validReviewEvent({ rating: 'perfect' })));
    });

    it('create denied for invalid cardType enum', async () => {
      const ownerDb = getOwnerDb();
      const eventRef = ownerDb.doc(`users/${OWNER_UID}/reviewEvents/${VALID_EVENT_ID}`);
      await assertFails(eventRef.set(validReviewEvent({ cardType: 'essay' })));
    });

    it('create denied when objective card has null objectiveCorrect', async () => {
      const ownerDb = getOwnerDb();
      const eventRef = ownerDb.doc(`users/${OWNER_UID}/reviewEvents/${VALID_EVENT_ID}`);
      await assertFails(eventRef.set(validReviewEvent({
        cardType: 'mcq',
        objectiveCorrect: null,
      })));
    });

    it('create denied when subjective card has boolean objectiveCorrect', async () => {
      const ownerDb = getOwnerDb();
      const eventRef = ownerDb.doc(`users/${OWNER_UID}/reviewEvents/${VALID_EVENT_ID}`);
      await assertFails(eventRef.set(validReviewEvent({
        cardType: 'flashcard',
        objectiveCorrect: true,
      })));
    });

    it('create denied for empty deviceId', async () => {
      const ownerDb = getOwnerDb();
      const eventRef = ownerDb.doc(`users/${OWNER_UID}/reviewEvents/${VALID_EVENT_ID}`);
      await assertFails(eventRef.set(validReviewEvent({ deviceId: '' })));
    });

    it('create denied for unsupported schemaVersion', async () => {
      const ownerDb = getOwnerDb();
      const eventRef = ownerDb.doc(`users/${OWNER_UID}/reviewEvents/${VALID_EVENT_ID}`);
      await assertFails(eventRef.set(validReviewEvent({ schemaVersion: 2 })));
    });

    it('create denied for negative durationMs', async () => {
      const ownerDb = getOwnerDb();
      const eventRef = ownerDb.doc(`users/${OWNER_UID}/reviewEvents/${VALID_EVENT_ID}`);
      await assertFails(eventRef.set(validReviewEvent({ durationMs: -1 })));
    });

    it('create denied for fractional durationMs', async () => {
      const ownerDb = getOwnerDb();
      const eventRef = ownerDb.doc(`users/${OWNER_UID}/reviewEvents/${VALID_EVENT_ID}`);
      await assertFails(eventRef.set(validReviewEvent({ durationMs: 1.5 })));
    });

    it('create denied for incomplete schedulerMetadata', async () => {
      const ownerDb = getOwnerDb();
      const eventRef = ownerDb.doc(`users/${OWNER_UID}/reviewEvents/${VALID_EVENT_ID}`);
      await assertFails(eventRef.set(validReviewEvent({
        schedulerMetadata: { algo: 'test' },
      })));
    });

    it('create denied for invalid scheduler field type', async () => {
      const ownerDb = getOwnerDb();
      const eventRef = ownerDb.doc(`users/${OWNER_UID}/reviewEvents/${VALID_EVENT_ID}`);
      await assertFails(eventRef.set(validReviewEvent({
        schedulerMetadata: {
          ...validSchedulerMetadata(),
          scheduledDays: '1',
        },
      })));
    });

    it('create denied for empty scheduler identity string', async () => {
      const ownerDb = getOwnerDb();
      const eventRef = ownerDb.doc(`users/${OWNER_UID}/reviewEvents/${VALID_EVENT_ID}`);
      await assertFails(eventRef.set(validReviewEvent({
        schedulerMetadata: {
          ...validSchedulerMetadata(),
          algorithm: '',
        },
      })));
    });

    it('create denied for negative scheduledDays', async () => {
      const ownerDb = getOwnerDb();
      const eventRef = ownerDb.doc(`users/${OWNER_UID}/reviewEvents/${VALID_EVENT_ID}`);
      await assertFails(eventRef.set(validReviewEvent({
        schedulerMetadata: {
          ...validSchedulerMetadata(),
          scheduledDays: -1,
        },
      })));
    });

    it('create denied for negative stability', async () => {
      const ownerDb = getOwnerDb();
      const eventRef = ownerDb.doc(`users/${OWNER_UID}/reviewEvents/${VALID_EVENT_ID}`);
      await assertFails(eventRef.set(validReviewEvent({
        schedulerMetadata: {
          ...validSchedulerMetadata(),
          stability: -0.01,
        },
      })));
    });

    it('create denied for difficulty above domain range', async () => {
      const ownerDb = getOwnerDb();
      const eventRef = ownerDb.doc(`users/${OWNER_UID}/reviewEvents/${VALID_EVENT_ID}`);
      await assertFails(eventRef.set(validReviewEvent({
        schedulerMetadata: {
          ...validSchedulerMetadata(),
          difficulty: 10.01,
        },
      })));
    });

    it('create denied for desiredRetention below domain range', async () => {
      const ownerDb = getOwnerDb();
      const eventRef = ownerDb.doc(`users/${OWNER_UID}/reviewEvents/${VALID_EVENT_ID}`);
      await assertFails(eventRef.set(validReviewEvent({
        schedulerMetadata: {
          ...validSchedulerMetadata(),
          desiredRetention: 0.69,
        },
      })));
    });

    it('update denied', async () => {
      const ownerDb = getOwnerDb();
      const eventRef = ownerDb.doc(`users/${OWNER_UID}/reviewEvents/${VALID_EVENT_ID}`);

      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().doc(
          `users/${OWNER_UID}/reviewEvents/${VALID_EVENT_ID}`
        ).set({ id: VALID_EVENT_ID });
      });

      await assertFails(eventRef.update({ rating: 'again' }));
    });

    it('delete denied', async () => {
      const ownerDb = getOwnerDb();
      const eventRef = ownerDb.doc(`users/${OWNER_UID}/reviewEvents/${VALID_EVENT_ID}`);

      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().doc(
          `users/${OWNER_UID}/reviewEvents/${VALID_EVENT_ID}`
        ).set({ id: VALID_EVENT_ID });
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
