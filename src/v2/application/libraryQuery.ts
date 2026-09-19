import type { KnowledgeItemWithCards } from './types';
import type { CardType } from '../domain/card';
import type { TaxonomyRegistry } from '../domain/taxonomy';

export type ReviewCardType = CardType;

export type LibraryStatusFilter = 'current' | 'active' | 'needs_review' | 'archived' | 'all';

export type LibrarySort = 'updated_desc' | 'created_desc' | 'title_asc' | 'title_desc';

export interface LibraryQuery {
  searchText?: string;
  status?: LibraryStatusFilter;
  domainId?: string;
  topicId?: string;
  subtopicId?: string;
  cardTypes?: CardType[];
  sort?: LibrarySort;
}

export const DEFAULT_LIBRARY_QUERY: LibraryQuery = {
  searchText: '',
  status: 'current',
  sort: 'updated_desc',
};

/**
 * Normalizes text for search indexing and term matching.
 * 
 * Rules:
 * 1. Unicode decomposition (NFD) and diacritic stripping (\p{M})
 * 2. Lowercase
 * 3. Replace hyphens, underscores, and punctuation boundaries with spaces
 * 4. Trim leading/trailing whitespace
 * 5. Collapse repeated whitespace to single spaces
 */
export function normalizeSearchText(text: string): string {
  if (!text) return '';
  return text
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

/**
 * Extracts aggregate searchable content from a KnowledgeItemWithCards bundle,
 * including KnowledgeItem content, tags, taxonomy IDs & resolved names,
 * all ReviewCard contents (across all 4 card types), and source references.
 * 
 * Persistent IDs (item.id, card.id) are explicitly excluded.
 */
export function extractSearchableText(
  bundle: KnowledgeItemWithCards,
  registry: TaxonomyRegistry
): string {
  const parts: string[] = [];

  // 1. KnowledgeItem fields
  if (bundle.item.title) parts.push(bundle.item.title);
  if (bundle.item.content) parts.push(bundle.item.content);
  if (bundle.item.explanationMarkdown) parts.push(bundle.item.explanationMarkdown);
  if (bundle.item.tags && bundle.item.tags.length > 0) {
    parts.push(...bundle.item.tags);
  }

  // 2. Taxonomy IDs and resolved names from registry
  const { domainId, topicId, subtopicId } = bundle.item.taxonomy;
  if (domainId) parts.push(domainId);
  if (topicId) parts.push(topicId);
  if (subtopicId) parts.push(subtopicId);

  if (registry) {
    const domain = registry.domains?.find((d) => d.id === domainId);
    if (domain?.name) parts.push(domain.name);

    const topic = registry.topics?.find((t) => t.id === topicId);
    if (topic?.name) parts.push(topic.name);

    if (subtopicId) {
      const subtopic = registry.subtopics?.find((s) => s.id === subtopicId);
      if (subtopic?.name) parts.push(subtopic.name);
    }
  }

  // 3. ReviewCards content for all four card types
  if (bundle.cards && bundle.cards.length > 0) {
    for (const card of bundle.cards) {
      switch (card.type) {
        case 'free_recall':
          if (card.prompt) parts.push(card.prompt);
          if (card.answerGuidance) parts.push(card.answerGuidance);
          break;
        case 'flashcard':
          if (card.front) parts.push(card.front);
          if (card.back) parts.push(card.back);
          break;
        case 'mcq':
          if (card.question) parts.push(card.question);
          if (card.options && card.options.length > 0) parts.push(...card.options);
          if (card.explanation) parts.push(card.explanation);
          break;
        case 'true_false':
          if (card.statement) parts.push(card.statement);
          if (card.explanation) parts.push(card.explanation);
          break;
      }
    }
  }

  // 4. Sources: title, citation, and URL
  if (bundle.item.sources && bundle.item.sources.length > 0) {
    for (const source of bundle.item.sources) {
      if (source.title) parts.push(source.title);
      if (source.citation) parts.push(source.citation);
      if (source.url) parts.push(source.url);
    }
  }

  return normalizeSearchText(parts.join(' '));
}

/**
 * Checks whether a single knowledge bundle satisfies all query filters and search terms.
 * All criteria are combined using logical AND.
 */
export function matchesQuery(
  bundle: KnowledgeItemWithCards,
  registry: TaxonomyRegistry,
  query: LibraryQuery
): boolean {
  // 1. Status filter
  const statusFilter: LibraryStatusFilter = query.status ?? 'current';
  switch (statusFilter) {
    case 'active':
      if (bundle.item.status !== 'active') return false;
      break;
    case 'needs_review':
      if (bundle.item.status !== 'needs_review') return false;
      break;
    case 'archived':
      if (bundle.item.status !== 'archived') return false;
      break;
    case 'current':
      // current = active + needs_review, excluding archived
      if (bundle.item.status === 'archived') return false;
      if (bundle.item.status !== 'active' && bundle.item.status !== 'needs_review') return false;
      break;
    case 'all':
      // matches all statuses
      break;
  }

  // 2. Taxonomy filters (strict AND, incompatible filters reject items)
  if (query.domainId && query.domainId !== 'all') {
    if (bundle.item.taxonomy.domainId !== query.domainId) return false;
  }

  if (query.topicId && query.topicId !== 'all') {
    if (bundle.item.taxonomy.topicId !== query.topicId) return false;
  }

  if (query.subtopicId && query.subtopicId !== 'all') {
    if (bundle.item.taxonomy.subtopicId !== query.subtopicId) return false;
  }

  // 3. Card types filter (OR within cardTypes filter: bundle matches if it contains >= 1 requested type)
  if (query.cardTypes && query.cardTypes.length > 0) {
    const hasMatchingType = bundle.cards.some((c) => query.cardTypes!.includes(c.type));
    if (!hasMatchingType) return false;
  }

  // 4. Multi-term search (all terms must be found in aggregate searchable content)
  if (query.searchText) {
    const normalizedQuery = normalizeSearchText(query.searchText);
    if (normalizedQuery.length > 0) {
      const terms = normalizedQuery.split(' ').filter(Boolean);
      if (terms.length > 0) {
        const aggregateContent = extractSearchableText(bundle, registry);
        for (const term of terms) {
          if (!aggregateContent.includes(term)) {
            return false;
          }
        }
      }
    }
  }

  return true;
}

/**
 * Deterministically compares two items by the selected sort mode,
 * using item.id as a stable tie breaker.
 */
export function compareLibraryItems(
  a: KnowledgeItemWithCards,
  b: KnowledgeItemWithCards,
  sort: LibrarySort
): number {
  switch (sort) {
    case 'created_desc': {
      const primary = b.item.createdAt.localeCompare(a.item.createdAt);
      if (primary !== 0) return primary;
      return a.item.id.localeCompare(b.item.id);
    }
    case 'title_asc': {
      const primary =
        a.item.title.localeCompare(b.item.title, undefined, { sensitivity: 'base' }) ||
        a.item.title.localeCompare(b.item.title);
      if (primary !== 0) return primary;
      return a.item.id.localeCompare(b.item.id);
    }
    case 'title_desc': {
      const primary =
        b.item.title.localeCompare(a.item.title, undefined, { sensitivity: 'base' }) ||
        b.item.title.localeCompare(a.item.title);
      if (primary !== 0) return primary;
      return a.item.id.localeCompare(b.item.id);
    }
    case 'updated_desc':
    default: {
      const primary = b.item.updatedAt.localeCompare(a.item.updatedAt);
      if (primary !== 0) return primary;
      return a.item.id.localeCompare(b.item.id);
    }
  }
}

/**
 * Pure, deterministic library query engine.
 * 
 * Filters and sorts items synchronously without side-effects, external repository calls,
 * or mutating input arrays or objects.
 */
export function queryLibraryItems(
  items: KnowledgeItemWithCards[],
  registry: TaxonomyRegistry,
  query: LibraryQuery = DEFAULT_LIBRARY_QUERY
): KnowledgeItemWithCards[] {
  const filtered = items.filter((bundle) => matchesQuery(bundle, registry, query));
  const sortMode: LibrarySort = query.sort ?? 'updated_desc';
  return filtered.sort((a, b) => compareLibraryItems(a, b, sortMode));
}

export interface TaxonomyNodeCounts {
  readonly domains: Record<string, number>;
  readonly topics: Record<string, number>;
  readonly subtopics: Record<string, number>;
}

export interface TaxonomySelection {
  readonly domainId: string;
  readonly topicId: string;
  readonly subtopicId: string;
}

/**
 * Pure state-update helper for taxonomy browsing hierarchy.
 * Enforces strict cascading path semantics:
 * - Selecting Domain: sets domainId, clears topicId & subtopicId. If already selected without sub-filter, toggles off.
 * - Selecting Topic: sets parent domainId + topicId, clears subtopicId. If already selected without subtopic, toggles topic & subtopic off.
 * - Selecting Subtopic: sets parent domainId + parent topicId + subtopicId. If already selected, toggles subtopic off.
 */
export function updateTaxonomySelection(
  level: 'domain' | 'topic' | 'subtopic',
  id: string,
  registry: TaxonomyRegistry,
  current: TaxonomySelection
): TaxonomySelection {
  if (level === 'domain') {
    if (current.domainId === id && !current.topicId && !current.subtopicId) {
      return { domainId: '', topicId: '', subtopicId: '' };
    }
    return { domainId: id, topicId: '', subtopicId: '' };
  }

  if (level === 'topic') {
    const topic = registry.topics?.find((t) => t.id === id);
    const domainId = topic?.domainId ?? current.domainId ?? '';
    if (current.topicId === id && !current.subtopicId) {
      return { domainId, topicId: '', subtopicId: '' };
    }
    return { domainId, topicId: id, subtopicId: '' };
  }

  if (level === 'subtopic') {
    const subtopic = registry.subtopics?.find((s) => s.id === id);
    const topic = registry.topics?.find((t) => t.id === subtopic?.topicId);
    const domainId = topic?.domainId ?? current.domainId ?? '';
    const topicId = subtopic?.topicId ?? current.topicId ?? '';
    if (current.subtopicId === id) {
      return { domainId, topicId, subtopicId: '' };
    }
    return { domainId, topicId, subtopicId: id };
  }

  return current;
}

/**
 * Computes contextual item counts for each taxonomy node by reusing queryLibraryItems.
 * Preserves the current status, search text, and card type filters from baseQuery,
 * while substituting each taxonomy node's scope.
 */
export function computeTaxonomyCounts(
  items: KnowledgeItemWithCards[],
  registry: TaxonomyRegistry,
  baseQuery: Pick<LibraryQuery, 'status' | 'searchText' | 'cardTypes'>
): TaxonomyNodeCounts {
  const domainCounts: Record<string, number> = {};
  const topicCounts: Record<string, number> = {};
  const subtopicCounts: Record<string, number> = {};

  const base: LibraryQuery = {
    status: baseQuery.status,
    searchText: baseQuery.searchText,
    cardTypes: baseQuery.cardTypes,
  };

  // Domain counts
  if (registry.domains) {
    for (const d of registry.domains) {
      domainCounts[d.id] = queryLibraryItems(items, registry, {
        ...base,
        domainId: d.id,
        topicId: undefined,
        subtopicId: undefined,
      }).length;
    }
  }

  // Topic counts
  if (registry.topics) {
    for (const t of registry.topics) {
      topicCounts[t.id] = queryLibraryItems(items, registry, {
        ...base,
        domainId: t.domainId,
        topicId: t.id,
        subtopicId: undefined,
      }).length;
    }
  }

  // Subtopic counts
  if (registry.subtopics) {
    for (const s of registry.subtopics) {
      const parentTopic = registry.topics?.find((t) => t.id === s.topicId);
      subtopicCounts[s.id] = queryLibraryItems(items, registry, {
        ...base,
        domainId: parentTopic?.domainId,
        topicId: s.topicId,
        subtopicId: s.id,
      }).length;
    }
  }

  return {
    domains: domainCounts,
    topics: topicCounts,
    subtopics: subtopicCounts,
  };
}

