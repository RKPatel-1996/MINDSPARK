import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from 'vitest';
import {
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import {
  disableNetwork,
  doc,
  enableNetwork,
  setDoc,
  type Firestore,
} from 'firebase/firestore';
import type { KnowledgeItem } from '../../../domain/knowledge';
import {
  FirestoreKnowledgeRepository,
} from '../repositories/firestoreRepositories';
import testOwnerConfig from '../../../../../test-config/firestore-test-owner.json';

const OWNER = testOwnerConfig.ownerUid;
const PROJECT_ID = 'mindspark-work014-claim-migration-repository';

function makeItem(
  id: string,
  title: string,
  updatedAt: string
): KnowledgeItem {
  return {
    id,
    schemaVersion: 1,
    title,
    content: `Content for ${title}`,
    taxonomy: {
      domainId: 'computing',
      topicId: 'linux',
      subtopicId: 'shell',
    },
    tags: [],
    status: 'active',
    createdAt: '2026-09-28T00:00:00.000Z',
    updatedAt,
  };
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

describe('FirestoreKnowledgeRepository fingerprint migration', () => {
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

  it('migrates a claimed fingerprint and releases the old authority', async () => {
    const db =
      env.authenticatedContext(OWNER).firestore() as unknown as Firestore;

    const repo =
      new FirestoreKnowledgeRepository(db, OWNER);

    const original = makeItem(
      '11111111-1111-4111-8111-111111111111',
      'Fingerprint A',
      '2026-09-28T00:00:00.000Z'
    );

    expect(
      await repo.createUniqueKnowledgeBundle(
        'fingerprint-a',
        original,
        []
      )
    ).toEqual({
      status: 'created',
    });

    const edited = {
      ...original,
      title: 'Fingerprint B',
      updatedAt: '2026-09-28T00:01:00.000Z',
    };

    expect(
      await repo.updateWithFingerprintAuthority(
        original,
        edited,
        'fingerprint-a',
        'fingerprint-b'
      )
    ).toEqual({
      status: 'updated',
    });

    expect(await repo.get(original.id)).toMatchObject({
      id: original.id,
      title: 'Fingerprint B',
    });

    const oldFingerprintReplacement = makeItem(
      '21111111-1111-4111-8111-111111111111',
      'Replacement A',
      '2026-09-28T00:02:00.000Z'
    );

    expect(
      await repo.createUniqueKnowledgeBundle(
        'fingerprint-a',
        oldFingerprintReplacement,
        []
      )
    ).toEqual({
      status: 'created',
    });

    const duplicateNewFingerprint = makeItem(
      '31111111-1111-4111-8111-111111111111',
      'Duplicate B',
      '2026-09-28T00:03:00.000Z'
    );

    expect(
      await repo.createUniqueKnowledgeBundle(
        'fingerprint-b',
        duplicateNewFingerprint,
        []
      )
    ).toEqual({
      status: 'duplicate',
      existingKnowledgeItemId: original.id,
    });
  });

  it('rejects migration into a fingerprint owned by another KnowledgeItem without changing either item', async () => {
    const db =
      env.authenticatedContext(OWNER).firestore() as unknown as Firestore;

    const repo =
      new FirestoreKnowledgeRepository(db, OWNER);

    const itemA = makeItem(
      '41111111-1111-4111-8111-111111111111',
      'A',
      '2026-09-28T00:00:00.000Z'
    );

    const itemB = makeItem(
      '51111111-1111-4111-8111-111111111111',
      'B',
      '2026-09-28T00:00:00.000Z'
    );

    await repo.createUniqueKnowledgeBundle(
      'fingerprint-a',
      itemA,
      []
    );

    await repo.createUniqueKnowledgeBundle(
      'fingerprint-b',
      itemB,
      []
    );

    const result =
      await repo.updateWithFingerprintAuthority(
        itemA,
        {
          ...itemA,
          title: 'B',
          updatedAt: '2026-09-28T00:01:00.000Z',
        },
        'fingerprint-a',
        'fingerprint-b'
      );

    expect(result).toEqual({
      status: 'duplicate',
      existingKnowledgeItemId: itemB.id,
    });

    expect(await repo.get(itemA.id)).toMatchObject({
      title: 'A',
    });

    expect(await repo.get(itemB.id)).toMatchObject({
      title: 'B',
    });
  });

  it('allows only one concurrent stale fingerprint-changing edit to become authoritative', async () => {
    const dbA =
      env.authenticatedContext(OWNER).firestore() as unknown as Firestore;

    const dbB =
      env.authenticatedContext(OWNER).firestore() as unknown as Firestore;

    const repoA =
      new FirestoreKnowledgeRepository(dbA, OWNER);

    const repoB =
      new FirestoreKnowledgeRepository(dbB, OWNER);

    const original = makeItem(
      '61111111-1111-4111-8111-111111111111',
      'A',
      '2026-09-28T00:00:00.000Z'
    );

    await repoA.createUniqueKnowledgeBundle(
      'fingerprint-a',
      original,
      []
    );

    const results = await Promise.all([
      repoA.updateWithFingerprintAuthority(
        original,
        {
          ...original,
          title: 'B',
          updatedAt: '2026-09-28T00:01:00.000Z',
        },
        'fingerprint-a',
        'fingerprint-b'
      ),
      repoB.updateWithFingerprintAuthority(
        original,
        {
          ...original,
          title: 'C',
          updatedAt: '2026-09-28T00:02:00.000Z',
        },
        'fingerprint-a',
        'fingerprint-c'
      ),
    ]);

    expect(
      results.filter((result) => result.status === 'updated')
    ).toHaveLength(1);

    expect(
      results.filter((result) => result.status === 'stale')
    ).toHaveLength(1);

    const persisted = await repoA.get(original.id);

    expect(['B', 'C']).toContain(persisted?.title);
  });

  it('recovers a pre-WORK-014 item with no old claim through server-verified transaction authority', async () => {
    const db =
      env.authenticatedContext(OWNER).firestore() as unknown as Firestore;

    const repo =
      new FirestoreKnowledgeRepository(db, OWNER);

    const legacy = makeItem(
      '71111111-1111-4111-8111-111111111111',
      'Legacy A',
      '2026-09-28T00:00:00.000Z'
    );

    await setDoc(
      doc(db, `users/${OWNER}/knowledgeItems/${legacy.id}`),
      legacy
    );

    const edited = {
      ...legacy,
      title: 'Legacy B',
      updatedAt: '2026-09-28T00:01:00.000Z',
    };

    expect(
      await repo.updateWithFingerprintAuthority(
        legacy,
        edited,
        'legacy-a',
        'legacy-b'
      )
    ).toEqual({
      status: 'updated',
    });

    expect(await repo.get(legacy.id)).toMatchObject({
      title: 'Legacy B',
    });

    const duplicate = makeItem(
      '81111111-1111-4111-8111-111111111111',
      'Duplicate Legacy B',
      '2026-09-28T00:02:00.000Z'
    );

    expect(
      await repo.createUniqueKnowledgeBundle(
        'legacy-b',
        duplicate,
        []
      )
    ).toEqual({
      status: 'duplicate',
      existingKnowledgeItemId: legacy.id,
    });
  });

  it('keeps a claimed fingerprint migration pending offline until reconnect', async () => {
    const db =
      env.authenticatedContext(OWNER).firestore() as unknown as Firestore;

    const repo =
      new FirestoreKnowledgeRepository(db, OWNER);

    const original = makeItem(
      '91111111-1111-4111-8111-111111111111',
      'Offline A',
      '2026-09-28T00:00:00.000Z'
    );

    await repo.createUniqueKnowledgeBundle(
      'offline-a',
      original,
      []
    );

    await disableNetwork(db);

    let settled = false;

    const pending =
      repo.updateWithFingerprintAuthority(
        original,
        {
          ...original,
          title: 'Offline B',
          updatedAt: '2026-09-28T00:01:00.000Z',
        },
        'offline-a',
        'offline-b'
      ).then((result) => {
        settled = true;
        return result;
      });

    try {
      await delay(150);

      expect(settled).toBe(false);

      await enableNetwork(db);

      expect(await pending).toEqual({
        status: 'updated',
      });
    } finally {
      await enableNetwork(db);
    }
  });
});
