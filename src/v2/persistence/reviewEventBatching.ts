export const REVIEW_EVENT_MULTI_CARD_QUERY_CHUNK_SIZE = 10;

export function chunkReviewEventCardIds(
  cardIds: readonly string[]
): string[][] {
  const uniqueCardIds =
    Array.from(new Set(cardIds));

  const chunks: string[][] = [];

  for (
    let offset = 0;
    offset < uniqueCardIds.length;
    offset += REVIEW_EVENT_MULTI_CARD_QUERY_CHUNK_SIZE
  ) {
    chunks.push(
      uniqueCardIds.slice(
        offset,
        offset + REVIEW_EVENT_MULTI_CARD_QUERY_CHUNK_SIZE
      )
    );
  }

  return chunks;
}
