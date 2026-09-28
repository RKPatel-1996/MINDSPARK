import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  it,
} from 'vitest';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import {
  deleteDoc,
  doc,
  setDoc,
  writeBatch,
  type Firestore,
} from 'firebase/firestore';
import testOwnerConfig from '../../../../../test-config/firestore-test-owner.json';

const OWNER = testOwnerConfig.ownerUid;
const OTHER = 'not_the_owner';
const PROJECT_ID = 'mindspark-work014-claim-rules';

const CLAIM_ID = 'a'.repeat(64);
const ITEM_ID = '11111111-1111-4111-8111-111111111111';

function writeClaimAndItem(
  db: Firestore,
  claimId = CLAIM_ID,
  itemId = ITEM_ID
) {
  const batch = writeBatch(db);

  batch.set(
    doc(db, `users/${OWNER}/knowledgeItems/${itemId}`),
    {
      id: itemId,
    }
  );

  batch.set(
    doc(db, `users/${OWNER}/knowledgeImportClaims/${claimId}`),
    {
      id: claimId,
      knowledgeItemId: itemId,
      schemaVersion: 1,
    }
  );

  return batch.commit();
}

describe('knowledgeImportClaims Firestore rules', () => {
  let env: RulesTestEnvironment;

  beforeAll(async () => {
    env = await initializeTestEnvironment({
      projectId: PROJECT_ID,
      firestore: {
        host: '127.0.0.1',
        port: 8080,
      },
    });
  });

  beforeEach(async () => {
    await env.clearFirestore();
  });

  afterAll(async () => {
    await env.cleanup();
  });

  it('allows the owner to create a valid claim atomically with its KnowledgeItem', async () => {
    const db =
      env.authenticatedContext(OWNER).firestore() as unknown as Firestore;

    await assertSucceeds(
      writeClaimAndItem(db)
    );
  });

  it('rejects a claim whose referenced KnowledgeItem is absent from the post-write state', async () => {
    const db =
      env.authenticatedContext(OWNER).firestore() as unknown as Firestore;

    await assertFails(
      setDoc(
        doc(
          db,
          `users/${OWNER}/knowledgeImportClaims/${CLAIM_ID}`
        ),
        {
          id: CLAIM_ID,
          knowledgeItemId: ITEM_ID,
          schemaVersion: 1,
        }
      )
    );
  });

  it('rejects malformed claim IDs and extra fields', async () => {
    const db =
      env.authenticatedContext(OWNER).firestore() as unknown as Firestore;

    const malformedId = 'not-a-sha256';

    const batch = writeBatch(db);

    batch.set(
      doc(db, `users/${OWNER}/knowledgeItems/${ITEM_ID}`),
      {
        id: ITEM_ID,
      }
    );

    batch.set(
      doc(
        db,
        `users/${OWNER}/knowledgeImportClaims/${malformedId}`
      ),
      {
        id: malformedId,
        knowledgeItemId: ITEM_ID,
        schemaVersion: 1,
        unexpected: true,
      }
    );

    await assertFails(batch.commit());
  });

  it('rejects claim update and delete after creation', async () => {
    const db =
      env.authenticatedContext(OWNER).firestore() as unknown as Firestore;

    await assertSucceeds(
      writeClaimAndItem(db)
    );

    const claimRef = doc(
      db,
      `users/${OWNER}/knowledgeImportClaims/${CLAIM_ID}`
    );

    await assertFails(
      setDoc(
        claimRef,
        {
          id: CLAIM_ID,
          knowledgeItemId:
            '21111111-1111-4111-8111-111111111111',
          schemaVersion: 1,
        },
        {
          merge: true,
        }
      )
    );

    await assertFails(
      deleteDoc(claimRef)
    );
  });

  it('rejects a non-owner claim batch', async () => {
    const db =
      env.authenticatedContext(OTHER).firestore() as unknown as Firestore;

    const batch = writeBatch(db);

    batch.set(
      doc(db, `users/${OWNER}/knowledgeItems/${ITEM_ID}`),
      {
        id: ITEM_ID,
      }
    );

    batch.set(
      doc(
        db,
        `users/${OWNER}/knowledgeImportClaims/${CLAIM_ID}`
      ),
      {
        id: CLAIM_ID,
        knowledgeItemId: ITEM_ID,
        schemaVersion: 1,
      }
    );

    await assertFails(batch.commit());
  });
});
