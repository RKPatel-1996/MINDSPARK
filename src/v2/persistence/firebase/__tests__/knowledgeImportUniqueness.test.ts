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
  enableNetwork,
  type Firestore,
} from 'firebase/firestore';
import type { KnowledgeItem } from '../../../domain/knowledge';
import type { ReviewCard } from '../../../domain/card';
import {
  FirestoreKnowledgeRepository,
  FirestoreReviewCardRepository,
} from '../repositories/firestoreRepositories';
import testOwnerConfig from '../../../../../test-config/firestore-test-owner.json';

const OWNER = testOwnerConfig.ownerUid;
const PROJECT_ID = 'mindspark-work014-import-uniqueness';

function item(id: string, title: string): KnowledgeItem {
  const now = '2026-09-28T00:00:00.000Z';

  return {
    id,
    schemaVersion: 1,
    title,
    content: `Content for ${title}`,
    taxonomy: {
      domainId: 'domain',
      topicId: 'topic',
    },
    tags: [],
    status: 'active',
    createdAt: now,
    updatedAt: now,
  };
}

function card(
  id: string,
  knowledgeItemId: string,
  label: string
): ReviewCard {
  const now = '2026-09-28T00:00:00.000Z';

  return {
    id,
    knowledgeItemId,
    schemaVersion: 1,
    type: 'flashcard',
    front: `Front ${label}`,
    back: `Back ${label}`,
    suspended: false,
    createdAt: now,
    updatedAt: now,
  };
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

describe('FirestoreKnowledgeRepository import uniqueness', () => {
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

  it('allows exactly one authoritative bundle for simultaneous identical fingerprints', async () => {
    const dbA = env.authenticatedContext(OWNER).firestore() as unknown as Firestore;
    const dbB = env.authenticatedContext(OWNER).firestore() as unknown as Firestore;

    const repoA = new FirestoreKnowledgeRepository(dbA, OWNER);
    const repoB = new FirestoreKnowledgeRepository(dbB, OWNER);

    const itemA = item(
      '11111111-1111-4111-8111-111111111111',
      'Concurrent A'
    );
    const itemB = item(
      '21111111-1111-4111-8111-111111111111',
      'Concurrent B'
    );

    const cardA = card(
      '31111111-1111-4111-8111-111111111111',
      itemA.id,
      'A'
    );
    const cardB = card(
      '41111111-1111-4111-8111-111111111111',
      itemB.id,
      'B'
    );

    const fingerprint = 'domain::topic::::same title';

    const results = await Promise.all([
      repoA.createUniqueKnowledgeBundle(
        fingerprint,
        itemA,
        [cardA]
      ),
      repoB.createUniqueKnowledgeBundle(
        fingerprint,
        itemB,
        [cardB]
      ),
    ]);

    expect(
      results.filter((result) => result.status === 'created')
    ).toHaveLength(1);

    expect(
      results.filter((result) => result.status === 'duplicate')
    ).toHaveLength(1);

    const verifierDb =
      env.authenticatedContext(OWNER).firestore() as unknown as Firestore;

    const knowledge =
      new FirestoreKnowledgeRepository(verifierDb, OWNER);

    const reviewCards =
      new FirestoreReviewCardRepository(verifierDb, OWNER);

    const storedItems = await knowledge.list();
    const storedCards = await reviewCards.list();

    expect(storedItems).toHaveLength(1);
    expect(storedCards).toHaveLength(1);

    const duplicate = results.find(
      (result) => result.status === 'duplicate'
    );

    expect(duplicate?.status).toBe('duplicate');

    if (duplicate?.status === 'duplicate') {
      expect(duplicate.existingKnowledgeItemId).toBe(
        storedItems[0].id
      );
    }

    expect(storedCards[0].knowledgeItemId).toBe(
      storedItems[0].id
    );
  });

  it('accepts independently different fingerprints', async () => {
    const db = env.authenticatedContext(OWNER).firestore() as unknown as Firestore;
    const repo = new FirestoreKnowledgeRepository(db, OWNER);

    const itemA = item(
      '51111111-1111-4111-8111-111111111111',
      'Different A'
    );
    const itemB = item(
      '61111111-1111-4111-8111-111111111111',
      'Different B'
    );

    expect(
      await repo.createUniqueKnowledgeBundle(
        'domain::topic::::different a',
        itemA,
        [
          card(
            '71111111-1111-4111-8111-111111111111',
            itemA.id,
            'A'
          ),
        ]
      )
    ).toEqual({ status: 'created' });

    expect(
      await repo.createUniqueKnowledgeBundle(
        'domain::topic::::different b',
        itemB,
        [
          card(
            '81111111-1111-4111-8111-111111111111',
            itemB.id,
            'B'
          ),
        ]
      )
    ).toEqual({ status: 'created' });

    expect(await repo.list()).toHaveLength(2);
  });

  it('keeps a unique import pending while offline and resolves it after reconnect', async () => {
    const db = env.authenticatedContext(OWNER).firestore() as unknown as Firestore;
    const repo = new FirestoreKnowledgeRepository(db, OWNER);

    const knowledgeItem = item(
      '91111111-1111-4111-8111-111111111111',
      'Offline unique'
    );

    const reviewCard = card(
      'a1111111-1111-4111-8111-111111111111',
      knowledgeItem.id,
      'offline'
    );

    await disableNetwork(db);

    let settled = false;

    const pending = repo.createUniqueKnowledgeBundle(
      'domain::topic::::offline unique',
      knowledgeItem,
      [reviewCard]
    ).then((result) => {
      settled = true;
      return result;
    });

    try {
      await delay(150);
      expect(settled).toBe(false);

      await enableNetwork(db);

      expect(await pending).toEqual({
        status: 'created',
      });
    } finally {
      await enableNetwork(db);
    }
  });

  it('returns duplicate after an offline conflicting claim reconnects and leaves no losing bundle', async () => {
    const seedDb =
      env.authenticatedContext(OWNER).firestore() as unknown as Firestore;

    const seedRepo =
      new FirestoreKnowledgeRepository(seedDb, OWNER);

    const winner = item(
      'b1111111-1111-4111-8111-111111111111',
      'Winner'
    );

    await seedRepo.createUniqueKnowledgeBundle(
      'domain::topic::::offline conflict',
      winner,
      [
        card(
          'c1111111-1111-4111-8111-111111111111',
          winner.id,
          'winner'
        ),
      ]
    );

    const losingDb =
      env.authenticatedContext(OWNER).firestore() as unknown as Firestore;

    const losingRepo =
      new FirestoreKnowledgeRepository(losingDb, OWNER);

    const loser = item(
      'd1111111-1111-4111-8111-111111111111',
      'Loser'
    );

    const loserCard = card(
      'e1111111-1111-4111-8111-111111111111',
      loser.id,
      'loser'
    );

    await disableNetwork(losingDb);

    let settled = false;

    const pending = losingRepo.createUniqueKnowledgeBundle(
      'domain::topic::::offline conflict',
      loser,
      [loserCard]
    ).then((result) => {
      settled = true;
      return result;
    });

    try {
      await delay(150);
      expect(settled).toBe(false);

      await enableNetwork(losingDb);

      expect(await pending).toEqual({
        status: 'duplicate',
        existingKnowledgeItemId: winner.id,
      });

      const verifierDb =
        env.authenticatedContext(OWNER).firestore() as unknown as Firestore;

      const verifierKnowledge =
        new FirestoreKnowledgeRepository(verifierDb, OWNER);

      const verifierCards =
        new FirestoreReviewCardRepository(verifierDb, OWNER);

      expect(await verifierKnowledge.get(loser.id)).toBeNull();

      expect(
        await verifierCards.get(loserCard.id)
      ).toBeNull();
    } finally {
      await enableNetwork(losingDb);
    }
  });
});
