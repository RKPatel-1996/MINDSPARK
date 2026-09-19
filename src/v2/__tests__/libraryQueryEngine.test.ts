import { describe, it, expect } from 'vitest';
import {
  queryLibraryItems,
  normalizeSearchText,
  extractSearchableText,
  compareLibraryItems,
  DEFAULT_LIBRARY_QUERY,
  type LibraryQuery,
  type LibraryStatusFilter,
  type LibrarySort,
} from '../application/libraryQuery';
import type { KnowledgeItemWithCards } from '../application/types';
import type { TaxonomyRegistry } from '../domain/taxonomy';
import type { ReviewCard } from '../domain/card';

// Standard test taxonomy registry
const testRegistry: TaxonomyRegistry = {
  domains: [
    { id: 'comp-sci', name: 'Computer Science' },
    { id: 'math', name: 'Mathematics' },
  ],
  topics: [
    { id: 'operating-systems', domainId: 'comp-sci', name: 'Operating Systems' },
    { id: 'algorithms', domainId: 'comp-sci', name: 'Algorithms & Data Structures' },
    { id: 'linear-algebra', domainId: 'math', name: 'Linear Algebra' },
  ],
  subtopics: [
    { id: 'file-systems', topicId: 'operating-systems', name: 'File Systems' },
    { id: 'sorting', topicId: 'algorithms', name: 'Sorting Algorithms' },
  ],
  allowedTags: ['kernel', 'storage', 'performance', 'filesystem-permissions'],
};

// Test helper to generate mock bundles
function createMockBundle(overrides?: {
  id?: string;
  title?: string;
  content?: string;
  explanationMarkdown?: string;
  domainId?: string;
  topicId?: string;
  subtopicId?: string;
  tags?: string[];
  status?: 'active' | 'needs_review' | 'archived';
  createdAt?: string;
  updatedAt?: string;
  sources?: Array<{ title?: string; url?: string; citation?: string }>;
  cards?: ReviewCard[];
}): KnowledgeItemWithCards {
  const id = overrides?.id ?? 'item-1';
  return {
    item: {
      id,
      schemaVersion: 1,
      title: overrides?.title ?? 'Test Item Title',
      content: overrides?.content ?? 'Core knowledge content',
      explanationMarkdown: overrides?.explanationMarkdown,
      taxonomy: {
        domainId: overrides?.domainId ?? 'comp-sci',
        topicId: overrides?.topicId ?? 'operating-systems',
        subtopicId: overrides?.subtopicId,
      },
      tags: overrides?.tags ?? ['kernel'],
      status: overrides?.status ?? 'active',
      createdAt: overrides?.createdAt ?? '2026-09-01T10:00:00.000Z',
      updatedAt: overrides?.updatedAt ?? '2026-09-01T12:00:00.000Z',
      sources: overrides?.sources,
    },
    cards: overrides?.cards ?? [],
    cardStates: {},
  };
}

describe('Library Query Engine (Pure, Deterministic)', () => {
  describe('Search Normalization (normalizeSearchText)', () => {
    it('handles lowercase, Unicode decomposition, punctuation to spaces, trim, and whitespace collapse', () => {
      expect(normalizeSearchText('  FILESYSTEM-PERMISSIONS  ')).toBe('filesystem permissions');
      expect(normalizeSearchText('os_kernel::vfs')).toBe('os kernel vfs');
      expect(normalizeSearchText('Schrödinger’s Cat—Quantum!')).toBe('schrodinger s cat quantum');
      expect(normalizeSearchText('word1   word2\t\nword3')).toBe('word1 word2 word3');
      expect(normalizeSearchText('')).toBe('');
    });

    it('"filesystem permissions" matches "filesystem-permissions"', () => {
      const bundle = createMockBundle({
        id: 'fs-1',
        title: 'UNIX Security',
        content: 'Understand filesystem-permissions in POSIX kernels.',
      });

      const result = queryLibraryItems([bundle], testRegistry, {
        searchText: 'filesystem permissions',
      });
      expect(result).toHaveLength(1);
      expect(result[0].item.id).toBe('fs-1');
    });

    it('reverse: "filesystem-permissions" query matches "filesystem permissions" in content', () => {
      const bundle = createMockBundle({
        id: 'fs-2',
        title: 'UNIX Security',
        content: 'Understand filesystem permissions in POSIX kernels.',
      });

      const result = queryLibraryItems([bundle], testRegistry, {
        searchText: 'filesystem-permissions',
      });
      expect(result).toHaveLength(1);
      expect(result[0].item.id).toBe('fs-2');
    });
  });

  describe('Status Filter Semantics', () => {
    const activeItem = createMockBundle({ id: 'act-1', status: 'active' });
    const needsReviewItem = createMockBundle({ id: 'rev-1', status: 'needs_review' });
    const archivedItem = createMockBundle({ id: 'arc-1', status: 'archived' });
    const allItems = [activeItem, needsReviewItem, archivedItem];

    it('current includes active + needs_review and excludes archived', () => {
      const result = queryLibraryItems(allItems, testRegistry, { status: 'current' });
      const ids = result.map((r) => r.item.id);
      expect(ids).toEqual(['act-1', 'rev-1']);
      expect(ids).not.toContain('arc-1');
    });

    it('default query status is current', () => {
      const result = queryLibraryItems(allItems, testRegistry, {});
      const ids = result.map((r) => r.item.id);
      expect(ids).toEqual(['act-1', 'rev-1']);
    });

    it('explicit active status includes only active items', () => {
      const result = queryLibraryItems(allItems, testRegistry, { status: 'active' });
      expect(result.map((r) => r.item.id)).toEqual(['act-1']);
    });

    it('explicit needs_review status includes only needs_review items', () => {
      const result = queryLibraryItems(allItems, testRegistry, { status: 'needs_review' });
      expect(result.map((r) => r.item.id)).toEqual(['rev-1']);
    });

    it('explicit archived status includes only archived items', () => {
      const result = queryLibraryItems(allItems, testRegistry, { status: 'archived' });
      expect(result.map((r) => r.item.id)).toEqual(['arc-1']);
    });

    it('explicit all status includes every item regardless of status', () => {
      const result = queryLibraryItems(allItems, testRegistry, { status: 'all' });
      const ids = result.map((r) => r.item.id);
      expect(ids).toContain('act-1');
      expect(ids).toContain('rev-1');
      expect(ids).toContain('arc-1');
      expect(result).toHaveLength(3);
    });
  });

  describe('Searchable Fields Coverage', () => {
    it('searches KnowledgeItem title, content, and explanationMarkdown', () => {
      const itemTitle = createMockBundle({ id: 's-1', title: 'Page Replacement Algorithms', content: 'Generic' });
      const itemContent = createMockBundle({ id: 's-2', title: 'Generic', content: 'Thrashing occurs under high load' });
      const itemExplanation = createMockBundle({
        id: 's-3',
        title: 'Generic',
        content: 'Generic',
        explanationMarkdown: 'Working set model defines page footprint',
      });

      expect(queryLibraryItems([itemTitle, itemContent, itemExplanation], testRegistry, { searchText: 'replacement' })).toHaveLength(1);
      expect(queryLibraryItems([itemTitle, itemContent, itemExplanation], testRegistry, { searchText: 'thrashing' })).toHaveLength(1);
      expect(queryLibraryItems([itemTitle, itemContent, itemExplanation], testRegistry, { searchText: 'working set' })).toHaveLength(1);
    });

    it('searches taxonomy IDs', () => {
      const bundle = createMockBundle({
        id: 'tax-1',
        domainId: 'comp-sci',
        topicId: 'operating-systems',
        subtopicId: 'file-systems',
      });

      expect(queryLibraryItems([bundle], testRegistry, { searchText: 'comp-sci' })).toHaveLength(1);
      expect(queryLibraryItems([bundle], testRegistry, { searchText: 'operating-systems' })).toHaveLength(1);
      expect(queryLibraryItems([bundle], testRegistry, { searchText: 'file-systems' })).toHaveLength(1);
    });

    it('searches taxonomy human-readable resolved display names', () => {
      const bundle = createMockBundle({
        id: 'tax-2',
        domainId: 'comp-sci',
        topicId: 'operating-systems',
        subtopicId: 'file-systems',
      });

      // Domain display name: "Computer Science"
      expect(queryLibraryItems([bundle], testRegistry, { searchText: 'Computer Science' })).toHaveLength(1);
      // Topic display name: "Operating Systems"
      expect(queryLibraryItems([bundle], testRegistry, { searchText: 'Operating Systems' })).toHaveLength(1);
      // Subtopic display name: "File Systems"
      expect(queryLibraryItems([bundle], testRegistry, { searchText: 'File Systems' })).toHaveLength(1);
    });

    it('tags are searchable', () => {
      const bundle = createMockBundle({
        id: 'tag-1',
        tags: ['storage', 'filesystem-permissions'],
      });

      expect(queryLibraryItems([bundle], testRegistry, { searchText: 'storage' })).toHaveLength(1);
      expect(queryLibraryItems([bundle], testRegistry, { searchText: 'permissions' })).toHaveLength(1);
    });

    it('searches all four card-type contents', () => {
      // 1. free_recall (prompt, answerGuidance)
      const freeRecallCard: ReviewCard = {
        id: 'c-fr-1',
        knowledgeItemId: 'item-fr',
        schemaVersion: 1,
        type: 'free_recall',
        prompt: 'State the deadlock conditions',
        answerGuidance: 'Mutual exclusion, hold and wait, no preemption, circular wait',
        suspended: false,
        createdAt: '2026-09-01T10:00:00.000Z',
        updatedAt: '2026-09-01T10:00:00.000Z',
      };
      const bFr = createMockBundle({ id: 'item-fr', cards: [freeRecallCard] });

      // 2. flashcard (front, back)
      const flashcardCard: ReviewCard = {
        id: 'c-fc-1',
        knowledgeItemId: 'item-fc',
        schemaVersion: 1,
        type: 'flashcard',
        front: 'What is a Semaphore?',
        back: 'An integer variable used for signaling and synchronization',
        suspended: false,
        createdAt: '2026-09-01T10:00:00.000Z',
        updatedAt: '2026-09-01T10:00:00.000Z',
      };
      const bFc = createMockBundle({ id: 'item-fc', cards: [flashcardCard] });

      // 3. mcq (question, options, explanation)
      const mcqCard: ReviewCard = {
        id: 'c-mcq-1',
        knowledgeItemId: 'item-mcq',
        schemaVersion: 1,
        type: 'mcq',
        question: 'Which scheduling algorithm prevents starvation?',
        options: ['FIFO', 'Round Robin', 'Shortest Job First'],
        correctOptionIndex: 1,
        explanation: 'Round Robin allocates time slices cyclically',
        suspended: false,
        createdAt: '2026-09-01T10:00:00.000Z',
        updatedAt: '2026-09-01T10:00:00.000Z',
      };
      const bMcq = createMockBundle({ id: 'item-mcq', cards: [mcqCard] });

      // 4. true_false (statement, explanation)
      const tfCard: ReviewCard = {
        id: 'c-tf-1',
        knowledgeItemId: 'item-tf',
        schemaVersion: 1,
        type: 'true_false',
        statement: 'Paging eliminates external fragmentation',
        isTrue: true,
        explanation: 'Pages are fixed size so only internal fragmentation remains',
        suspended: false,
        createdAt: '2026-09-01T10:00:00.000Z',
        updatedAt: '2026-09-01T10:00:00.000Z',
      };
      const bTf = createMockBundle({ id: 'item-tf', cards: [tfCard] });

      const allCardBundles = [bFr, bFc, bMcq, bTf];

      // free_recall search
      expect(queryLibraryItems(allCardBundles, testRegistry, { searchText: 'preemption' }).map((i) => i.item.id)).toEqual(['item-fr']);
      expect(queryLibraryItems(allCardBundles, testRegistry, { searchText: 'deadlock' }).map((i) => i.item.id)).toEqual(['item-fr']);

      // flashcard search
      expect(queryLibraryItems(allCardBundles, testRegistry, { searchText: 'semaphore' }).map((i) => i.item.id)).toEqual(['item-fc']);
      expect(queryLibraryItems(allCardBundles, testRegistry, { searchText: 'signaling' }).map((i) => i.item.id)).toEqual(['item-fc']);

      // mcq search
      expect(queryLibraryItems(allCardBundles, testRegistry, { searchText: 'starvation' }).map((i) => i.item.id)).toEqual(['item-mcq']);
      expect(queryLibraryItems(allCardBundles, testRegistry, { searchText: 'Round Robin' }).map((i) => i.item.id)).toEqual(['item-mcq']);
      expect(queryLibraryItems(allCardBundles, testRegistry, { searchText: 'cyclically' }).map((i) => i.item.id)).toEqual(['item-mcq']);

      // true_false search
      expect(queryLibraryItems(allCardBundles, testRegistry, { searchText: 'fragmentation' }).map((i) => i.item.id)).toEqual(['item-tf']);
      expect(queryLibraryItems(allCardBundles, testRegistry, { searchText: 'internal fragmentation' }).map((i) => i.item.id)).toEqual(['item-tf']);
    });

    it('searches source title, citation, and URL', () => {
      const bundle = createMockBundle({
        id: 'src-1',
        sources: [
          {
            title: 'Modern Operating Systems 4th Ed',
            citation: 'Tanenbaum & Bos, Chapter 3',
            url: 'https://example.com/books/tanenbaum-mos',
          },
        ],
      });

      expect(queryLibraryItems([bundle], testRegistry, { searchText: 'Tanenbaum' })).toHaveLength(1);
      expect(queryLibraryItems([bundle], testRegistry, { searchText: 'Modern Operating' })).toHaveLength(1);
      expect(queryLibraryItems([bundle], testRegistry, { searchText: 'tanenbaum-mos' })).toHaveLength(1);
    });

    it('does NOT search persistent UUIDs of items or cards', () => {
      const secretUuid = '550e8400-e29b-41d4-a716-446655440000';
      const bundle = createMockBundle({
        id: secretUuid,
        title: 'Ordinary Title',
        content: 'Ordinary Content',
      });

      // Searching for the item UUID should return 0 results
      expect(queryLibraryItems([bundle], testRegistry, { searchText: secretUuid })).toHaveLength(0);
      expect(queryLibraryItems([bundle], testRegistry, { searchText: '550e8400' })).toHaveLength(0);
    });
  });

  describe('Multi-Term Search Semantics', () => {
    it('uses logical AND across terms: all terms must be present', () => {
      const b1 = createMockBundle({ id: 'b1', title: 'Virtual Memory and Paging' });
      const b2 = createMockBundle({ id: 'b2', title: 'Virtual Memory Segmentation' });

      // "virtual memory paging" requires all 3 terms
      const res = queryLibraryItems([b1, b2], testRegistry, { searchText: 'virtual memory paging' });
      expect(res.map((r) => r.item.id)).toEqual(['b1']);
    });

    it('terms can match across different fields', () => {
      const card: ReviewCard = {
        id: 'c-1',
        knowledgeItemId: 'diff-1',
        schemaVersion: 1,
        type: 'free_recall',
        prompt: 'How does process scheduling function in modern kernels?',
        answerGuidance: 'Preemptive priority',
        suspended: false,
        createdAt: '2026-09-01T10:00:00.000Z',
        updatedAt: '2026-09-01T10:00:00.000Z',
      };

      // Item has:
      // - Taxonomy display name: "Operating Systems"
      // - Title: "POSIX Architecture"
      // - Card prompt: "How does process scheduling function..."
      const bundle = createMockBundle({
        id: 'diff-1',
        title: 'POSIX Architecture',
        topicId: 'operating-systems',
        cards: [card],
      });

      // "operating scheduling posix" matches across 3 separate locations:
      // 1. taxonomy name ("operating systems")
      // 2. card prompt ("process scheduling")
      // 3. title ("POSIX Architecture")
      const res = queryLibraryItems([bundle], testRegistry, {
        searchText: 'operating scheduling posix',
      });
      expect(res).toHaveLength(1);
      expect(res[0].item.id).toBe('diff-1');

      // But adding an unfulfilled term fails
      const res2 = queryLibraryItems([bundle], testRegistry, {
        searchText: 'operating scheduling posix nonexistent',
      });
      expect(res2).toHaveLength(0);
    });
  });

  describe('Taxonomy & Card-Type Filters', () => {
    const bCompSci = createMockBundle({
      id: 'f-1',
      domainId: 'comp-sci',
      topicId: 'operating-systems',
      subtopicId: 'file-systems',
    });
    const bAlgorithms = createMockBundle({
      id: 'f-2',
      domainId: 'comp-sci',
      topicId: 'algorithms',
      subtopicId: 'sorting',
    });
    const bMath = createMockBundle({
      id: 'f-3',
      domainId: 'math',
      topicId: 'linear-algebra',
    });

    const items = [bCompSci, bAlgorithms, bMath];

    it('domain filter selects only matching domain', () => {
      expect(queryLibraryItems(items, testRegistry, { domainId: 'math' }).map((i) => i.item.id)).toEqual(['f-3']);
      expect(queryLibraryItems(items, testRegistry, { domainId: 'comp-sci' }).map((i) => i.item.id)).toEqual(['f-1', 'f-2']);
    });

    it('domain, topic, and subtopic filters combine strictly with logical AND', () => {
      expect(
        queryLibraryItems(items, testRegistry, {
          domainId: 'comp-sci',
          topicId: 'operating-systems',
        }).map((i) => i.item.id)
      ).toEqual(['f-1']);

      expect(
        queryLibraryItems(items, testRegistry, {
          domainId: 'comp-sci',
          topicId: 'operating-systems',
          subtopicId: 'file-systems',
        }).map((i) => i.item.id)
      ).toEqual(['f-1']);

      // Incompatible topic under math
      expect(
        queryLibraryItems(items, testRegistry, {
          domainId: 'math',
          topicId: 'operating-systems',
        })
      ).toHaveLength(0);
    });

    it('card-type filtering matches items containing at least one requested card type', () => {
      const bOnlyFlashcard = createMockBundle({
        id: 'c-fc',
        cards: [
          {
            id: 'c1',
            knowledgeItemId: 'c-fc',
            schemaVersion: 1,
            type: 'flashcard',
            front: 'F',
            back: 'B',
            suspended: false,
            createdAt: '2026-09-01T10:00:00.000Z',
            updatedAt: '2026-09-01T10:00:00.000Z',
          },
        ],
      });
      const bOnlyMcq = createMockBundle({
        id: 'c-mcq',
        cards: [
          {
            id: 'c2',
            knowledgeItemId: 'c-mcq',
            schemaVersion: 1,
            type: 'mcq',
            question: 'Q',
            options: ['A', 'B'],
            correctOptionIndex: 0,
            suspended: false,
            createdAt: '2026-09-01T10:00:00.000Z',
            updatedAt: '2026-09-01T10:00:00.000Z',
          },
        ],
      });
      const bNoCards = createMockBundle({ id: 'c-none', cards: [] });

      const cardItems = [bOnlyFlashcard, bOnlyMcq, bNoCards];

      expect(queryLibraryItems(cardItems, testRegistry, { cardTypes: ['flashcard'] }).map((i) => i.item.id)).toEqual(['c-fc']);
      expect(queryLibraryItems(cardItems, testRegistry, { cardTypes: ['mcq'] }).map((i) => i.item.id)).toEqual(['c-mcq']);
      expect(queryLibraryItems(cardItems, testRegistry, { cardTypes: ['true_false'] })).toHaveLength(0);
    });

    it('multiple selected card types use logical OR within that filter', () => {
      const bFlashcard = createMockBundle({
        id: 'or-fc',
        cards: [
          {
            id: 'c1',
            knowledgeItemId: 'or-fc',
            schemaVersion: 1,
            type: 'flashcard',
            front: 'F',
            back: 'B',
            suspended: false,
            createdAt: '2026-09-01T10:00:00.000Z',
            updatedAt: '2026-09-01T10:00:00.000Z',
          },
        ],
      });
      const bMcq = createMockBundle({
        id: 'or-mcq',
        cards: [
          {
            id: 'c2',
            knowledgeItemId: 'or-mcq',
            schemaVersion: 1,
            type: 'mcq',
            question: 'Q',
            options: ['A', 'B'],
            correctOptionIndex: 0,
            suspended: false,
            createdAt: '2026-09-01T10:00:00.000Z',
            updatedAt: '2026-09-01T10:00:00.000Z',
          },
        ],
      });
      const bTrueFalse = createMockBundle({
        id: 'or-tf',
        cards: [
          {
            id: 'c3',
            knowledgeItemId: 'or-tf',
            schemaVersion: 1,
            type: 'true_false',
            statement: 'S',
            isTrue: true,
            suspended: false,
            createdAt: '2026-09-01T10:00:00.000Z',
            updatedAt: '2026-09-01T10:00:00.000Z',
          },
        ],
      });

      const res = queryLibraryItems([bFlashcard, bMcq, bTrueFalse], testRegistry, {
        cardTypes: ['flashcard', 'mcq'],
      });

      expect(res.map((r) => r.item.id)).toEqual(['or-fc', 'or-mcq']);
      expect(res.map((r) => r.item.id)).not.toContain('or-tf');
    });

    it('filters combine with search terms using logical AND', () => {
      const bMatchingDomainAndSearch = createMockBundle({
        id: 'combo-1',
        title: 'CPU Cache Hierarchy',
        domainId: 'comp-sci',
      });
      const bMismatchDomain = createMockBundle({
        id: 'combo-2',
        title: 'CPU Architecture',
        domainId: 'math',
      });
      const bMismatchSearch = createMockBundle({
        id: 'combo-3',
        title: 'Database Normalization',
        domainId: 'comp-sci',
      });

      const res = queryLibraryItems(
        [bMatchingDomainAndSearch, bMismatchDomain, bMismatchSearch],
        testRegistry,
        {
          domainId: 'comp-sci',
          searchText: 'cache',
        }
      );

      expect(res.map((r) => r.item.id)).toEqual(['combo-1']);
    });
  });

  describe('Sorting & Deterministic Tie-Breaking', () => {
    const item1 = createMockBundle({
      id: 'id-alpha',
      title: 'Alpha Concept',
      createdAt: '2026-09-01T10:00:00.000Z',
      updatedAt: '2026-09-03T10:00:00.000Z',
    });
    const item2 = createMockBundle({
      id: 'id-beta',
      title: 'Beta Concept',
      createdAt: '2026-09-02T10:00:00.000Z',
      updatedAt: '2026-09-01T10:00:00.000Z',
    });
    const item3 = createMockBundle({
      id: 'id-gamma',
      title: 'Gamma Concept',
      createdAt: '2026-09-03T10:00:00.000Z',
      updatedAt: '2026-09-02T10:00:00.000Z',
    });

    it('sorts by updated_desc (default)', () => {
      const res = queryLibraryItems([item1, item2, item3], testRegistry, { sort: 'updated_desc' });
      expect(res.map((r) => r.item.id)).toEqual(['id-alpha', 'id-gamma', 'id-beta']);
    });

    it('sorts by created_desc', () => {
      const res = queryLibraryItems([item1, item2, item3], testRegistry, { sort: 'created_desc' });
      expect(res.map((r) => r.item.id)).toEqual(['id-gamma', 'id-beta', 'id-alpha']);
    });

    it('sorts by title_asc', () => {
      const res = queryLibraryItems([item3, item1, item2], testRegistry, { sort: 'title_asc' });
      expect(res.map((r) => r.item.id)).toEqual(['id-alpha', 'id-beta', 'id-gamma']);
    });

    it('sorts by title_desc', () => {
      const res = queryLibraryItems([item1, item2, item3], testRegistry, { sort: 'title_desc' });
      expect(res.map((r) => r.item.id)).toEqual(['id-gamma', 'id-beta', 'id-alpha']);
    });

    it('uses deterministic tie-breaking via item.id when sort keys are identical', () => {
      const itemSameDateB = createMockBundle({
        id: 'item-b',
        title: 'Identical Title',
        updatedAt: '2026-09-01T10:00:00.000Z',
      });
      const itemSameDateA = createMockBundle({
        id: 'item-a',
        title: 'Identical Title',
        updatedAt: '2026-09-01T10:00:00.000Z',
      });
      const itemSameDateC = createMockBundle({
        id: 'item-c',
        title: 'Identical Title',
        updatedAt: '2026-09-01T10:00:00.000Z',
      });

      // Updated_desc with identical updatedAt uses item.id asc
      const resUpdated = queryLibraryItems([itemSameDateC, itemSameDateB, itemSameDateA], testRegistry, {
        sort: 'updated_desc',
      });
      expect(resUpdated.map((r) => r.item.id)).toEqual(['item-a', 'item-b', 'item-c']);

      // Title_asc with identical title uses item.id asc
      const resTitle = queryLibraryItems([itemSameDateC, itemSameDateB, itemSameDateA], testRegistry, {
        sort: 'title_asc',
      });
      expect(resTitle.map((r) => r.item.id)).toEqual(['item-a', 'item-b', 'item-c']);
    });
  });

  describe('Purity, Preservation & Immutability', () => {
    it('input array, original ordering, and domain objects are not mutated', () => {
      const b1 = createMockBundle({ id: 'z-1', title: 'Zebra', updatedAt: '2026-09-01T10:00:00.000Z' });
      const b2 = createMockBundle({ id: 'a-1', title: 'Antelope', updatedAt: '2026-09-02T10:00:00.000Z' });
      const originalArray = [b1, b2];
      const frozenCopy = Object.freeze([...originalArray]);

      const result = queryLibraryItems(originalArray, testRegistry, { sort: 'title_asc' });

      // Result is a new array
      expect(result).not.toBe(originalArray);
      // Original array preserved in original order
      expect(originalArray[0].item.id).toBe('z-1');
      expect(originalArray[1].item.id).toBe('a-1');
      // Elements returned are exact references (no unwanted cloning)
      expect(result[0]).toBe(b2);
      expect(result[1]).toBe(b1);
    });
  });
});
