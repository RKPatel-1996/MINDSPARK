import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

describe('Firestore index contract', () => {
  it('declares every reviewEvents composite index required by production queries', () => {
    const config = JSON.parse(
      fs.readFileSync(path.join(process.cwd(), 'firestore.indexes.json'), 'utf8')
    );

    const reviewEventIndexes = config.indexes
      .filter((index: any) =>
        index.collectionGroup === 'reviewEvents' &&
        index.queryScope === 'COLLECTION'
      )
      .map((index: any) =>
        index.fields.map((field: any) => `${field.fieldPath}:${field.order}`)
      );

    expect(reviewEventIndexes).toEqual(
      expect.arrayContaining([
        ['serverReceivedAt:ASCENDING', 'id:ASCENDING'],
        ['cardId:ASCENDING', 'reviewTimestamp:ASCENDING', 'id:ASCENDING'],
        ['reviewTimestamp:ASCENDING', 'id:ASCENDING'],
      ])
    );
  });
});
