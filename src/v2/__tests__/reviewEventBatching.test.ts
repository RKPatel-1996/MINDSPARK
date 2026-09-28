import {
  describe,
  expect,
  it,
} from 'vitest';
import type {
  ReviewEvent,
} from '../domain/event';
import {
  InMemoryReviewEventRepository,
} from '../persistence/memory/inMemoryRepositories';
import {
  REVIEW_EVENT_MULTI_CARD_QUERY_CHUNK_SIZE,
  chunkReviewEventCardIds,
} from '../persistence/reviewEventBatching';

describe('WORK-015 ReviewEvent multi-card repository primitives', () => {
  it('deduplicates card IDs without mutating input and chunks at the conservative limit', () => {
    const uniqueIds =
      Array.from(
        { length: 11 },
        (_, index) =>
          `card-${index + 1}`
      );

    const input = [
      ...uniqueIds,
      uniqueIds[0],
      uniqueIds[10],
    ];

    const original =
      [...input];

    const chunks =
      chunkReviewEventCardIds(input);

    expect(
      REVIEW_EVENT_MULTI_CARD_QUERY_CHUNK_SIZE
    ).toBe(10);

    expect(input)
      .toEqual(original);

    expect(chunks)
      .toHaveLength(2);

    expect(chunks[0])
      .toEqual(
        uniqueIds.slice(0, 10)
      );

    expect(chunks[1])
      .toEqual([
        uniqueIds[10],
      ]);

    expect(
      chunkReviewEventCardIds([])
    ).toEqual([]);
  });

  it('returns grouped in-memory histories for every requested card with reviewTimestamp/id chronology', async () => {
    const repo =
      new InMemoryReviewEventRepository();

    const cardA =
      '11111111-1111-4111-8111-111111111111';

    const cardB =
      '22222222-2222-4222-8222-222222222222';

    const cardEmpty =
      '33333333-3333-4333-8333-333333333333';

    const firstId =
      'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1';

    const secondId =
      'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2';

    const eventBId =
      'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1';

    const sameTimestamp =
      '2026-09-28T00:00:00.000Z';

    const makeEvent = (
      id: string,
      cardId: string,
      reviewTimestamp: string
    ): ReviewEvent =>
      ({
        id,
        cardId,
        reviewTimestamp,
      } as ReviewEvent);

    await repo.append(
      makeEvent(
        secondId,
        cardA,
        sameTimestamp
      )
    );

    await repo.append(
      makeEvent(
        firstId,
        cardA,
        sameTimestamp
      )
    );

    await repo.append(
      makeEvent(
        eventBId,
        cardB,
        '2026-09-28T00:01:00.000Z'
      )
    );

    const requested = [
      cardA,
      cardB,
      cardEmpty,
      cardA,
    ];

    const histories =
      await repo.listForCards(requested);

    expect(
      Array.from(histories.keys())
    ).toEqual([
      cardA,
      cardB,
      cardEmpty,
    ]);

    expect(
      histories
        .get(cardA)!
        .map((event) => event.id)
    ).toEqual([
      firstId,
      secondId,
    ]);

    expect(
      histories
        .get(cardB)!
        .map((event) => event.id)
    ).toEqual([
      eventBId,
    ]);

    expect(
      histories.get(cardEmpty)
    ).toEqual([]);
  });
});
