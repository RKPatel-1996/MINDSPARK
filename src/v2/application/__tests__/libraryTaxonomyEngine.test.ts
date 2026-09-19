import { describe, it, expect } from 'vitest';
import type { TaxonomyRegistry } from '../../domain/taxonomy';
import type { KnowledgeItemWithCards } from '../types';
import type { KnowledgeItem } from '../../domain/knowledge';
import type { ReviewCard } from '../../domain/card';
import {
  computeTaxonomyCounts,
  updateTaxonomySelection,
  queryLibraryItems,
} from '../libraryQuery';

const testRegistry: TaxonomyRegistry = {
  domains: [
    { id: 'computing', name: 'Computing' },
    { id: 'biology', name: 'Biology' },
  ],
  topics: [
    { id: 'linux', domainId: 'computing', name: 'Linux OS' },
    { id: 'genetics', domainId: 'biology', name: 'Genetics' },
  ],
  subtopics: [
    { id: 'shell', topicId: 'linux', name: 'Shell Scripting' },
    { id: 'processes', topicId: 'linux', name: 'Process Control' },
    { id: 'dna', topicId: 'genetics', name: 'DNA Replication' },
  ],
  allowedTags: ['cli', 'kernel', 'molecular'],
};

function createMockCard(id: string, knowledgeItemId: string, type: 'flashcard' | 'mcq' | 'true_false' | 'free_recall'): ReviewCard {
  const base = {
    id,
    knowledgeItemId,
    schemaVersion: 1 as const,
    suspended: false,
    createdAt: '2026-09-01T00:00:00.000Z',
    updatedAt: '2026-09-01T00:00:00.000Z',
  };

  switch (type) {
    case 'flashcard':
      return { ...base, type: 'flashcard', front: 'Front text', back: 'Back text' };
    case 'mcq':
      return { ...base, type: 'mcq', question: 'Question?', options: ['A', 'B'], correctOptionIndex: 0 };
    case 'true_false':
      return { ...base, type: 'true_false', statement: 'Statement', isTrue: true };
    case 'free_recall':
      return { ...base, type: 'free_recall', prompt: 'Recall prompt', answerGuidance: 'Guidance' };
  }
}

function createMockBundle(
  id: string,
  title: string,
  content: string,
  domainId: string,
  topicId: string,
  subtopicId: string,
  status: 'active' | 'needs_review' | 'archived',
  cardTypes: Array<'flashcard' | 'mcq' | 'true_false' | 'free_recall'>
): KnowledgeItemWithCards {
  const item: KnowledgeItem = {
    id,
    schemaVersion: 1,
    title,
    content,
    taxonomy: { domainId, topicId, subtopicId },
    tags: ['cli'],
    status,
    createdAt: '2026-09-01T00:00:00.000Z',
    updatedAt: '2026-09-01T00:00:00.000Z',
  };

  const cards: ReviewCard[] = cardTypes.map((type, idx) =>
    createMockCard(`${id}-card-${idx}`, id, type)
  );

  return { item, cards, cardStates: {} };
}

describe('updateTaxonomySelection', () => {
  it('selecting Domain sets Domain and clears Topic and Subtopic', () => {
    const initial = { domainId: 'biology', topicId: 'genetics', subtopicId: 'dna' };
    const res = updateTaxonomySelection('domain', 'computing', testRegistry, initial);
    expect(res).toEqual({
      domainId: 'computing',
      topicId: '',
      subtopicId: '',
    });
  });

  it('clicking currently selected Domain toggles it off', () => {
    const initial = { domainId: 'computing', topicId: '', subtopicId: '' };
    const res = updateTaxonomySelection('domain', 'computing', testRegistry, initial);
    expect(res).toEqual({
      domainId: '',
      topicId: '',
      subtopicId: '',
    });
  });

  it('selecting Topic sets parent Domain + Topic and clears Subtopic', () => {
    const initial = { domainId: '', topicId: '', subtopicId: '' };
    const res = updateTaxonomySelection('topic', 'linux', testRegistry, initial);
    expect(res).toEqual({
      domainId: 'computing',
      topicId: 'linux',
      subtopicId: '',
    });
  });

  it('clicking currently selected Topic clears Topic and Subtopic while keeping parent Domain', () => {
    const initial = { domainId: 'computing', topicId: 'linux', subtopicId: '' };
    const res = updateTaxonomySelection('topic', 'linux', testRegistry, initial);
    expect(res).toEqual({
      domainId: 'computing',
      topicId: '',
      subtopicId: '',
    });
  });

  it('selecting Subtopic sets complete parent path (parent Domain, Topic, and Subtopic)', () => {
    const initial = { domainId: '', topicId: '', subtopicId: '' };
    const res = updateTaxonomySelection('subtopic', 'shell', testRegistry, initial);
    expect(res).toEqual({
      domainId: 'computing',
      topicId: 'linux',
      subtopicId: 'shell',
    });
  });

  it('clicking currently selected Subtopic clears Subtopic while keeping parent Topic and Domain', () => {
    const initial = { domainId: 'computing', topicId: 'linux', subtopicId: 'shell' };
    const res = updateTaxonomySelection('subtopic', 'shell', testRegistry, initial);
    expect(res).toEqual({
      domainId: 'computing',
      topicId: 'linux',
      subtopicId: '',
    });
  });
});

describe('computeTaxonomyCounts', () => {
  const items: KnowledgeItemWithCards[] = [
    // 3 active computing items
    createMockBundle('c1', 'Bash Shell', 'echo and pipes', 'computing', 'linux', 'shell', 'active', ['flashcard']),
    createMockBundle('c2', 'Zsh Scripting', 'functions and loops', 'computing', 'linux', 'shell', 'active', ['mcq']),
    createMockBundle('c3', 'Htop and Ps', 'process monitoring', 'computing', 'linux', 'processes', 'active', ['flashcard']),
    // 1 needs_review computing item
    createMockBundle('c4', 'Kill Signals', 'SIGTERM vs SIGKILL', 'computing', 'linux', 'processes', 'needs_review', ['true_false']),
    // 1 archived computing item
    createMockBundle('c5', 'Old SysV Init', 'legacy runlevels', 'computing', 'linux', 'processes', 'archived', ['flashcard']),
    // 2 active biology items
    createMockBundle('b1', 'Polymerase', 'DNA replication enzymes', 'biology', 'genetics', 'dna', 'active', ['flashcard']),
    createMockBundle('b2', 'Telomeres', 'chromosome ends', 'biology', 'genetics', 'dna', 'active', ['free_recall']),
  ];

  it('respects current status filter (excludes archived items in "current" tab)', () => {
    const counts = computeTaxonomyCounts(items, testRegistry, {
      status: 'current',
    });

    // Computing has: c1 (active), c2 (active), c3 (active), c4 (needs_review) = 4 in current tab (c5 is archived)
    expect(counts.domains['computing']).toBe(4);
    // Linux has 4
    expect(counts.topics['linux']).toBe(4);
    // Shell has c1, c2 = 2
    expect(counts.subtopics['shell']).toBe(2);
    // Processes has c3, c4 = 2 (c5 archived excluded)
    expect(counts.subtopics['processes']).toBe(2);
    // Biology has b1, b2 = 2
    expect(counts.domains['biology']).toBe(2);
  });

  it('includes only archived items when status filter is "archived"', () => {
    const counts = computeTaxonomyCounts(items, testRegistry, {
      status: 'archived',
    });

    expect(counts.domains['computing']).toBe(1); // c5
    expect(counts.topics['linux']).toBe(1);
    expect(counts.subtopics['processes']).toBe(1);
    expect(counts.subtopics['shell']).toBe(0);
    expect(counts.domains['biology']).toBe(0);
  });

  it('respects active search query', () => {
    const counts = computeTaxonomyCounts(items, testRegistry, {
      status: 'current',
      searchText: 'functions',
    });

    // Only c2 matches 'functions'
    expect(counts.domains['computing']).toBe(1);
    expect(counts.topics['linux']).toBe(1);
    expect(counts.subtopics['shell']).toBe(1);
    expect(counts.subtopics['processes']).toBe(0);
    expect(counts.domains['biology']).toBe(0);
  });

  it('respects card-type filters', () => {
    const counts = computeTaxonomyCounts(items, testRegistry, {
      status: 'current',
      cardTypes: ['mcq'],
    });

    // Only c2 has mcq
    expect(counts.domains['computing']).toBe(1);
    expect(counts.topics['linux']).toBe(1);
    expect(counts.subtopics['shell']).toBe(1);
    expect(counts.subtopics['processes']).toBe(0);
    expect(counts.domains['biology']).toBe(0);
  });

  it('produces counts identical to queryLibraryItems with matching taxonomy scope', () => {
    const baseQuery = {
      status: 'current' as const,
      searchText: 'process',
      cardTypes: ['flashcard' as const],
    };

    const counts = computeTaxonomyCounts(items, testRegistry, baseQuery);

    const directDomain = queryLibraryItems(items, testRegistry, {
      ...baseQuery,
      domainId: 'computing',
    }).length;
    const directTopic = queryLibraryItems(items, testRegistry, {
      ...baseQuery,
      domainId: 'computing',
      topicId: 'linux',
    }).length;
    const directSubtopic = queryLibraryItems(items, testRegistry, {
      ...baseQuery,
      domainId: 'computing',
      topicId: 'linux',
      subtopicId: 'processes',
    }).length;

    expect(counts.domains['computing']).toBe(directDomain);
    expect(counts.topics['linux']).toBe(directTopic);
    expect(counts.subtopics['processes']).toBe(directSubtopic);
  });
});
