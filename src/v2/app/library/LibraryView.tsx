import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useApplication } from '../../application';
import { Search, Book, AlertTriangle, Archive, Filter, X, Sparkles, Loader2, Edit3, Check, Tag, CheckCircle, RotateCcw } from 'lucide-react';
import { useShortcut } from '../shortcuts/useShortcut';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import type { KnowledgeItemWithCards } from '../../application/types';
import type { KnowledgeItem, KnowledgeStatus } from '../../domain/knowledge';
import type { CardType } from '../../domain/card';
import { validateTaxonomy, type TaxonomyRegistry, type TaxonomyReference } from '../../domain/taxonomy';
import { CANONICAL_TAXONOMY_REGISTRY } from '../../application/canonicalTaxonomy';
import {
  queryLibraryItems,
  computeTaxonomyCounts,
  updateTaxonomySelection,
  type LibraryQuery,
  type LibrarySort,
} from '../../application/libraryQuery';
import { TaxonomyBrowser } from './TaxonomyBrowser';
import { MAX_BULK_LIFECYCLE_ITEMS, type BulkLifecycleErrorCode } from '../../domain/lifecycle';

type StatusTab = 'current' | 'needs_review' | 'archived';

const STATUS_TABS: Array<{ tab: StatusTab; label: string }> = [
  { tab: 'current', label: 'Current' },
  { tab: 'needs_review', label: 'Needs Attention' },
  { tab: 'archived', label: 'Archived' },
];

const CARD_TYPE_OPTIONS: Array<{ type: CardType; label: string }> = [
  { type: 'free_recall', label: 'Free recall' },
  { type: 'flashcard', label: 'Flashcard' },
  { type: 'mcq', label: 'MCQ' },
  { type: 'true_false', label: 'True / False' },
];

const BULK_LIFECYCLE_ERROR_MESSAGES: Record<BulkLifecycleErrorCode, string> = {
  empty_selection: 'Select at least one item before continuing.',
  invalid_item_id: 'One or more selected items are invalid. Refresh and try again.',
  too_many_items: `Select no more than ${MAX_BULK_LIFECYCLE_ITEMS} items at once.`,
  item_not_found: 'One or more selected items are no longer available. Refresh and try again.',
  invalid_transition: 'The selected items cannot be changed from their current status.',
  authentication_required: 'Sign in to perform bulk lifecycle actions.',
  configuration_required: 'Configure cloud persistence before performing bulk lifecycle actions.',
  persistence_failure: 'The bulk lifecycle action could not be saved. Please try again.',
};

export const LibraryView: React.FC = () => {
  const {
    repos,
    libraryService,
    seedLibrary,
    refreshCount,
    triggerRefresh,
    transitionKnowledgeItemLifecycle,
    bulkTransitionKnowledgeItemStatus,
    isSignedOut,
    isUnconfigured,
    isEphemeralDev,
    isDev,
  } = useApplication();
  const isReadOnly = isSignedOut || (isUnconfigured && !isEphemeralDev);

  const [itemsWithCards, setItemsWithCards] = useState<KnowledgeItemWithCards[]>([]);
  const [loading, setLoading] = useState(true);
  const [registry, setRegistry] = useState<TaxonomyRegistry>(CANONICAL_TAXONOMY_REGISTRY);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusTab, setStatusTab] = useState<StatusTab>('current');
  const [domainFilter, setDomainFilter] = useState<string>('');
  const [topicFilter, setTopicFilter] = useState<string>('');
  const [subtopicFilter, setSubtopicFilter] = useState<string>('');
  const [selectedCardTypes, setSelectedCardTypes] = useState<CardType[]>([]);
  const [sortOption, setSortOption] = useState<LibrarySort>('updated_desc');
  const [showFilters, setShowFilters] = useState(false);

  // Selection Mode State (UI session state only, not persisted)
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkLifecycleError, setBulkLifecycleError] = useState<string | null>(null);
  const [isBulkLifecyclePending, setIsBulkLifecyclePending] = useState(false);
  const bulkOperationInFlightRef = useRef(false);

  // Selected item / edit state
  const [selectedItem, setSelectedItem] = useState<KnowledgeItemWithCards | null>(null);
  const [isSeeding, setIsSeeding] = useState(false);
  const [lifecycleError, setLifecycleError] = useState<string | null>(null);
  const [isSubmittingLifecycle, setIsSubmittingLifecycle] = useState(false);

  // Edit form state
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editExplanation, setEditExplanation] = useState('');
  const [editDomainId, setEditDomainId] = useState('');
  const [editTopicId, setEditTopicId] = useState('');
  const [editSubtopicId, setEditSubtopicId] = useState('');
  const [editTags, setEditTags] = useState<string[]>([]);
  const [editError, setEditError] = useState<string | null>(null);

  useEffect(() => {
    if (repos?.taxonomy) {
      repos.taxonomy.get().then((reg) => {
        if (reg) setRegistry(reg);
      });
    }
  }, [repos]);

  const loadLibrary = useCallback(async () => {
    try {
      setLoading(true);
      const data = await libraryService.listKnowledgeItems();
      setItemsWithCards(data);
    } finally {
      setLoading(false);
    }
  }, [libraryService]);

  useEffect(() => {
    loadLibrary();
  }, [loadLibrary, refreshCount]);

  // Helper name resolvers for human-readable taxonomy display
  const getDomainName = useCallback(
    (domainId: string) => registry.domains?.find((d) => d.id === domainId)?.name ?? domainId,
    [registry.domains]
  );

  const getTopicName = useCallback(
    (topicId: string) => registry.topics?.find((t) => t.id === topicId)?.name ?? topicId,
    [registry.topics]
  );

  const getSubtopicName = useCallback(
    (subtopicId?: string) => {
      if (!subtopicId) return undefined;
      return registry.subtopics?.find((s) => s.id === subtopicId)?.name ?? subtopicId;
    },
    [registry.subtopics]
  );

  // Cascading taxonomy options for filter panel
  const availableFilterTopics = useMemo(() => {
    if (!domainFilter) return registry.topics ?? [];
    return (registry.topics ?? []).filter((t) => t.domainId === domainFilter);
  }, [registry.topics, domainFilter]);

  const availableFilterSubtopics = useMemo(() => {
    if (!topicFilter) {
      if (!domainFilter) return [];
      const domainTopicIds = new Set(
        (registry.topics ?? []).filter((t) => t.domainId === domainFilter).map((t) => t.id)
      );
      return (registry.subtopics ?? []).filter((s) => domainTopicIds.has(s.topicId));
    }
    return (registry.subtopics ?? []).filter((s) => s.topicId === topicFilter);
  }, [registry.subtopics, registry.topics, domainFilter, topicFilter]);

  // Cascading change handlers
  const handleDomainChange = (newDomainId: string) => {
    setDomainFilter(newDomainId);
    if (newDomainId && topicFilter) {
      const currentTopic = registry.topics?.find((t) => t.id === topicFilter);
      if (currentTopic && currentTopic.domainId !== newDomainId) {
        setTopicFilter('');
        setSubtopicFilter('');
      }
    }
  };

  const handleTopicChange = (newTopicId: string) => {
    setTopicFilter(newTopicId);
    if (newTopicId && subtopicFilter) {
      const currentSubtopic = registry.subtopics?.find((s) => s.id === subtopicFilter);
      if (currentSubtopic && currentSubtopic.topicId !== newTopicId) {
        setSubtopicFilter('');
      }
    } else if (!newTopicId) {
      setSubtopicFilter('');
    }
  };

  const handleSubtopicChange = (newSubtopicId: string) => {
    setSubtopicFilter(newSubtopicId);
  };

  const toggleCardType = (type: CardType) => {
    setSelectedCardTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const handleClearFilters = () => {
    setDomainFilter('');
    setTopicFilter('');
    setSubtopicFilter('');
    setSelectedCardTypes([]);
  };

  const hasActiveFilters = Boolean(
    domainFilter || topicFilter || subtopicFilter || selectedCardTypes.length > 0
  );

  const activeFilterCount =
    (domainFilter ? 1 : 0) +
    (topicFilter ? 1 : 0) +
    (subtopicFilter ? 1 : 0) +
    selectedCardTypes.length;

  // Build typed query and pass to queryLibraryItems
  const currentQuery = useMemo<LibraryQuery>(() => {
    return {
      searchText: searchQuery,
      status: statusTab,
      domainId: domainFilter || undefined,
      topicId: topicFilter || undefined,
      subtopicId: subtopicFilter || undefined,
      cardTypes: selectedCardTypes.length > 0 ? selectedCardTypes : undefined,
      sort: sortOption,
    };
  }, [searchQuery, statusTab, domainFilter, topicFilter, subtopicFilter, selectedCardTypes, sortOption]);

  const filteredItems = useMemo(() => {
    return queryLibraryItems(itemsWithCards, registry, currentQuery);
  }, [itemsWithCards, registry, currentQuery]);

  const visibleItemIds = useMemo(
    () => new Set(filteredItems.map((b) => b.item.id)),
    [filteredItems]
  );

  // Automatically prune selected IDs that are no longer present in the active query visible result set
  useEffect(() => {
    setSelectedIds((prev) => {
      if (prev.size === 0) return prev;
      let changed = false;
      const next = new Set<string>();
      for (const id of prev) {
        if (visibleItemIds.has(id)) {
          next.add(id);
        } else {
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [visibleItemIds]);

  const toggleItemSelection = useCallback((itemId: string) => {
    if (isBulkLifecyclePending) return;
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        if (next.size >= MAX_BULK_LIFECYCLE_ITEMS) {
          setBulkLifecycleError(`Select no more than ${MAX_BULK_LIFECYCLE_ITEMS} items at once.`);
          return prev;
        }
        next.add(itemId);
      }
      return next;
    });
  }, [isBulkLifecyclePending]);

  const handleSelectVisible = useCallback(() => {
    if (isBulkLifecyclePending) return;
    if (filteredItems.length > MAX_BULK_LIFECYCLE_ITEMS) {
      setBulkLifecycleError(`Select visible is limited to ${MAX_BULK_LIFECYCLE_ITEMS} items.`);
      return;
    }
    setBulkLifecycleError(null);
    setSelectedIds(new Set(filteredItems.map((b) => b.item.id)));
  }, [filteredItems, isBulkLifecyclePending]);

  const handleEnterSelectMode = useCallback(() => {
    setIsSelecting(true);
    setSelectedIds(new Set());
    setBulkLifecycleError(null);
  }, []);

  const handleCancelSelectMode = useCallback(() => {
    if (isBulkLifecyclePending) return;
    setIsSelecting(false);
    setSelectedIds(new Set());
    setBulkLifecycleError(null);
  }, [isBulkLifecyclePending]);

  const bulkTargetStatus: KnowledgeStatus = statusTab === 'archived' ? 'active' : 'archived';
  const bulkActionLabel = bulkTargetStatus === 'archived' ? 'Archive selected' : 'Restore selected';

  const handleBulkLifecycleAction = useCallback(async () => {
    if (
      isReadOnly ||
      isBulkLifecyclePending ||
      bulkOperationInFlightRef.current ||
      selectedIds.size === 0
    ) {
      return;
    }

    const itemIds = Array.from(selectedIds);
    bulkOperationInFlightRef.current = true;
    setBulkLifecycleError(null);
    setIsBulkLifecyclePending(true);
    try {
      const result = await bulkTransitionKnowledgeItemStatus(itemIds, bulkTargetStatus);
      if ('error' in result) {
        setBulkLifecycleError(BULK_LIFECYCLE_ERROR_MESSAGES[result.error.code]);
        return;
      }

      setSelectedIds(new Set());
      setIsSelecting(false);
      setBulkLifecycleError(null);
    } catch {
      setBulkLifecycleError(BULK_LIFECYCLE_ERROR_MESSAGES.persistence_failure);
    } finally {
      bulkOperationInFlightRef.current = false;
      setIsBulkLifecyclePending(false);
    }
  }, [
    bulkTargetStatus,
    bulkTransitionKnowledgeItemStatus,
    isBulkLifecyclePending,
    isReadOnly,
    selectedIds,
  ]);

  // Contextual taxonomy counts reusing queryLibraryItems semantics
  const taxonomyCounts = useMemo(() => {
    return computeTaxonomyCounts(itemsWithCards, registry, {
      status: statusTab,
      searchText: searchQuery,
      cardTypes: selectedCardTypes.length > 0 ? selectedCardTypes : undefined,
    });
  }, [itemsWithCards, registry, statusTab, searchQuery, selectedCardTypes]);

  // Unified deterministic taxonomy browse handler
  const handleTaxonomyNodeSelect = useCallback(
    (level: 'domain' | 'topic' | 'subtopic', id: string) => {
      const next = updateTaxonomySelection(level, id, registry, {
        domainId: domainFilter,
        topicId: topicFilter,
        subtopicId: subtopicFilter,
      });
      setDomainFilter(next.domainId);
      setTopicFilter(next.topicId);
      setSubtopicFilter(next.subtopicId);
    },
    [registry, domainFilter, topicFilter, subtopicFilter]
  );

  // Keyboard shortcuts
  useShortcut('navigation.search', () => document.getElementById('library-search')?.focus());
  useShortcut('overlay.close', () => {
    setSelectedItem(null);
    setIsEditing(false);
  });

  // Edit taxonomy options
  const availableEditTopics = useMemo(() => {
    return (registry.topics ?? []).filter((t) => t.domainId === editDomainId);
  }, [registry.topics, editDomainId]);

  const availableEditSubtopics = useMemo(() => {
    return (registry.subtopics ?? []).filter((s) => s.topicId === editTopicId);
  }, [registry.subtopics, editTopicId]);

  const toggleTag = (tag: string) => {
    setEditTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleOpenDetail = (bundle: KnowledgeItemWithCards) => {
    setSelectedItem(bundle);
    setIsEditing(false);
    setLifecycleError(null);
    setEditTitle(bundle.item.title);
    setEditContent(bundle.item.content);
    setEditExplanation(bundle.item.explanationMarkdown ?? '');
    setEditDomainId(bundle.item.taxonomy.domainId);
    setEditTopicId(bundle.item.taxonomy.topicId);
    setEditSubtopicId(bundle.item.taxonomy.subtopicId ?? '');
    setEditTags(bundle.item.tags ?? []);
    setEditError(null);
  };

  const handleLifecycleTransition = async (itemId: string, targetStatus: KnowledgeStatus) => {
    setLifecycleError(null);
    setIsSubmittingLifecycle(true);
    try {
      const res = await transitionKnowledgeItemLifecycle(itemId, targetStatus);
      if ('error' in res) {
        setLifecycleError(res.error.message);
      } else {
        if (targetStatus === 'archived' || selectedItem?.item.status === 'archived') {
          setSelectedItem(null);
        } else {
          setSelectedItem((prev) => (prev ? { ...prev, item: res.item } : null));
        }
      }
    } catch (err: unknown) {
      setLifecycleError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsSubmittingLifecycle(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!selectedItem) return;
    setEditError(null);

    if (!editTitle.trim()) {
      setEditError('Title cannot be empty');
      return;
    }
    if (!editContent.trim()) {
      setEditError('Content summary cannot be empty');
      return;
    }
    if (!editDomainId) {
      setEditError('Domain must be selected');
      return;
    }
    if (!editTopicId) {
      setEditError('Topic must be selected');
      return;
    }

    const updatedTaxonomy: TaxonomyReference = {
      domainId: editDomainId,
      topicId: editTopicId,
      subtopicId: editSubtopicId.trim() || undefined,
    };

    const taxValidation = validateTaxonomy(updatedTaxonomy, editTags, registry);
    if (!taxValidation.valid) {
      setEditError(taxValidation.error ?? 'Invalid taxonomy selection');
      return;
    }

    const updated: KnowledgeItem = {
      ...selectedItem.item,
      title: editTitle.trim(),
      content: editContent.trim(),
      explanationMarkdown: editExplanation,
      taxonomy: updatedTaxonomy,
      tags: editTags,
      updatedAt: new Date().toISOString(),
    };

    try {
      const saved = await libraryService.updateKnowledgeItem(updated);
      setSelectedItem({ ...selectedItem, item: saved });
      setIsEditing(false);
      triggerRefresh();
    } catch (err) {
      setEditError(err instanceof Error ? err.message : String(err));
    }
  };

  const handleSeed = async () => {
    setIsSeeding(true);
    try {
      await seedLibrary();
      await loadLibrary();
    } finally {
      setIsSeeding(false);
    }
  };

  if (isSignedOut) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <div className="text-center max-w-md p-8 bg-[var(--surface-color)] border border-[var(--border-color)] rounded-2xl paper-shadow">
          <div className="w-16 h-16 bg-[var(--elevated-color)] border border-[var(--border-color)] rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Book className="w-8 h-8 text-[var(--color-primary)]" />
          </div>
          <h2 className="text-2xl font-semibold mb-2 font-ui">Sign in to access your library</h2>
          <p className="text-sm text-[var(--muted-color)] mb-6 font-content">
            Your knowledge cards, taxonomy, and spaced-repetition history are stored securely in Cloud Firestore. Sign in to access your library.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full content-container pt-safe">
      {/* Header & Controls */}
      <div className="p-4 md:p-6 border-b border-[var(--border-color)] bg-[var(--surface-color)] flex-none">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl md:text-3xl font-semibold font-ui">Library</h1>
            <span
              id="library-result-count"
              className="text-xs px-2.5 py-1 bg-[var(--elevated-color)] border border-[var(--border-color)] rounded-full text-[var(--muted-color)] font-mono"
            >
              {filteredItems.length} {filteredItems.length === 1 ? 'item' : 'items'}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[200px] md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-color)]" />
              <input
                id="library-search"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search knowledge…"
                className="w-full pl-9 pr-8 py-2 bg-[var(--bg-color)] border border-[var(--border-color)] rounded-xl text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] font-ui"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-[var(--muted-color)] hover:text-[var(--text-color)]"
                  aria-label="Clear search text"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Sort Control */}
            <div className="flex items-center">
              <label htmlFor="library-sort" className="sr-only">
                Sort library
              </label>
              <select
                id="library-sort"
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value as LibrarySort)}
                className="px-3 py-2 bg-[var(--bg-color)] border border-[var(--border-color)] hover:border-[var(--muted-color)] rounded-xl text-xs sm:text-sm font-ui text-[var(--text-color)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
              >
                <option value="updated_desc">Updated recently</option>
                <option value="created_desc">Created recently</option>
                <option value="title_asc">Title A–Z</option>
                <option value="title_desc">Title Z–A</option>
              </select>
            </div>

            {/* Filter Toggle */}
            <button
              id="library-filter-toggle"
              onClick={() => setShowFilters(!showFilters)}
              className={`px-3 py-2 border rounded-xl transition-colors font-ui flex items-center gap-2 text-xs sm:text-sm ${
                showFilters || hasActiveFilters
                  ? 'border-[var(--color-primary)] text-[var(--color-primary)] bg-[var(--color-soft-primary)] font-medium'
                  : 'border-[var(--border-color)] hover:border-[var(--muted-color)] text-[var(--muted-color)]'
              }`}
              aria-expanded={showFilters}
            >
              <Filter className="w-4 h-4" />
              <span>Filters</span>
              {activeFilterCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-[var(--color-primary)] text-white text-[10px] font-semibold flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>

            {/* Select / Selection Controls */}
            {isSelecting ? (
              <div
                data-testid="selection-toolbar"
                className="flex items-center gap-2 p-1 px-2.5 bg-[var(--elevated-color)] border border-[var(--border-color)] rounded-xl"
              >
                <span
                  data-testid="selected-count"
                  className="text-xs font-medium font-ui text-[var(--text-strong)]"
                >
                  {selectedIds.size} selected
                </span>
                <button
                  type="button"
                  id="library-select-visible-btn"
                  data-testid="select-visible-btn"
                  onClick={handleSelectVisible}
                  disabled={isBulkLifecyclePending}
                  className="px-2.5 py-1 text-xs font-medium font-ui border border-[var(--border-color)] hover:border-[var(--muted-color)] bg-[var(--bg-color)] text-[var(--text-color)] rounded-lg transition-colors cursor-pointer"
                >
                  Select visible
                </button>

                <button
                  type="button"
                  id="library-bulk-lifecycle-action-btn"
                  data-testid="bulk-lifecycle-action-btn"
                  onClick={handleBulkLifecycleAction}
                  disabled={isReadOnly || isBulkLifecyclePending || selectedIds.size === 0}
                  className="px-2.5 py-1 text-xs font-medium font-ui border border-[var(--border-color)] bg-[var(--bg-color)] text-[var(--text-color)] rounded-lg transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isBulkLifecyclePending ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                  ) : bulkTargetStatus === 'archived' ? (
                    <Archive className="w-3.5 h-3.5" aria-hidden="true" />
                  ) : (
                    <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                  )}
                  {bulkActionLabel}
                </button>

                <button
                  type="button"
                  id="library-cancel-select-btn"
                  data-testid="cancel-select-btn"
                  onClick={handleCancelSelectMode}
                  disabled={isBulkLifecyclePending}
                  className="px-2.5 py-1 text-xs font-medium font-ui border border-[var(--border-color)] text-[var(--muted-color)] hover:text-[var(--text-color)] hover:bg-[var(--bg-color)] rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                id="library-select-mode-toggle"
                data-testid="library-select-mode-btn"
                onClick={handleEnterSelectMode}
                className="px-3 py-2 border border-[var(--border-color)] hover:border-[var(--muted-color)] text-[var(--muted-color)] hover:text-[var(--text-color)] rounded-xl text-xs sm:text-sm font-ui transition-colors cursor-pointer"
              >
                Select
              </button>
            )}
          </div>
        </div>

        {isSelecting && bulkLifecycleError && (
          <p data-testid="bulk-lifecycle-error" role="alert" className="mt-3 text-xs text-[var(--color-danger)] font-ui">
            {bulkLifecycleError}
          </p>
        )}

        {/* Collapsible Filter Panel */}
        {showFilters && (
          <div
            id="library-filter-panel"
            className="mt-4 p-4 border border-[var(--border-color)] bg-[var(--elevated-color)] rounded-xl space-y-4 animate-in fade-in slide-in-from-top-2"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[var(--muted-color)] uppercase tracking-wider font-ui">
                Filter Knowledge
              </span>
              {hasActiveFilters && (
                <button
                  id="library-clear-filters-btn"
                  onClick={handleClearFilters}
                  className="text-xs text-[var(--color-primary)] hover:underline font-ui font-medium cursor-pointer"
                >
                  Clear filters
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Domain */}
              <div>
                <label htmlFor="filter-domain" className="block text-xs font-medium text-[var(--muted-color)] mb-1 font-ui">
                  Domain
                </label>
                <select
                  id="filter-domain"
                  value={domainFilter}
                  onChange={(e) => handleDomainChange(e.target.value)}
                  className="w-full p-2 bg-[var(--bg-color)] border border-[var(--border-color)] rounded-lg text-xs sm:text-sm font-ui"
                >
                  <option value="">All Domains</option>
                  {registry.domains?.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Topic */}
              <div>
                <label htmlFor="filter-topic" className="block text-xs font-medium text-[var(--muted-color)] mb-1 font-ui">
                  Topic
                </label>
                <select
                  id="filter-topic"
                  value={topicFilter}
                  onChange={(e) => handleTopicChange(e.target.value)}
                  className="w-full p-2 bg-[var(--bg-color)] border border-[var(--border-color)] rounded-lg text-xs sm:text-sm font-ui"
                >
                  <option value="">All Topics</option>
                  {availableFilterTopics.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Subtopic */}
              <div>
                <label htmlFor="filter-subtopic" className="block text-xs font-medium text-[var(--muted-color)] mb-1 font-ui">
                  Subtopic
                </label>
                <select
                  id="filter-subtopic"
                  value={subtopicFilter}
                  onChange={(e) => handleSubtopicChange(e.target.value)}
                  className="w-full p-2 bg-[var(--bg-color)] border border-[var(--border-color)] rounded-lg text-xs sm:text-sm font-ui"
                  disabled={availableFilterSubtopics.length === 0}
                >
                  <option value="">All Subtopics</option>
                  {availableFilterSubtopics.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Card Types Multi-Select */}
            <div>
              <label className="block text-xs font-medium text-[var(--muted-color)] mb-1.5 font-ui">
                Card Types
              </label>
              <div className="flex flex-wrap gap-2">
                {CARD_TYPE_OPTIONS.map(({ type, label }) => {
                  const isSelected = selectedCardTypes.includes(type);
                  return (
                    <button
                      type="button"
                      key={type}
                      onClick={() => toggleCardType(type)}
                      className={`px-3 py-1 rounded-lg text-xs font-ui transition-colors border cursor-pointer ${
                        isSelected
                          ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)] font-medium shadow-xs'
                          : 'bg-[var(--bg-color)] text-[var(--muted-color)] border-[var(--border-color)] hover:border-[var(--text-color)]'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Browse by Taxonomy */}
            <div className="pt-3 border-t border-[var(--border-color)]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-[var(--muted-color)] uppercase tracking-wider font-ui">
                  Browse by Taxonomy
                </span>
                {(domainFilter || topicFilter || subtopicFilter) && (
                  <button
                    type="button"
                    id="library-clear-taxonomy-btn"
                    onClick={() => {
                      setDomainFilter('');
                      setTopicFilter('');
                      setSubtopicFilter('');
                    }}
                    className="text-xs text-[var(--color-primary)] hover:underline font-ui font-medium cursor-pointer"
                  >
                    Clear taxonomy
                  </button>
                )}
              </div>
              <TaxonomyBrowser
                registry={registry}
                domainId={domainFilter}
                topicId={topicFilter}
                subtopicId={subtopicFilter}
                counts={taxonomyCounts}
                onSelectNode={handleTaxonomyNodeSelect}
              />
            </div>
          </div>
        )}

        {/* Primary Status Tabs */}
        <div className="flex gap-2 mt-4 overflow-x-auto">
          {STATUS_TABS.map(({ tab, label }) => (
            <button
              key={tab}
              onClick={() => setStatusTab(tab)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium font-ui uppercase tracking-wider transition-colors whitespace-nowrap cursor-pointer ${
                statusTab === tab
                  ? 'bg-[var(--color-action-primary-bg)] text-[var(--color-action-primary-text)]'
                  : 'bg-[var(--bg-color)] text-[var(--muted-color)] hover:text-[var(--text-color)]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Main List */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        {loading ? (
          <div className="flex items-center justify-center p-12 text-[var(--muted-color)]">
            <Loader2 className="w-6 h-6 animate-spin text-[var(--color-primary)] mr-3" />
            <span className="text-sm font-ui">Loading library...</span>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <Book className="w-12 h-12 text-[var(--muted-color)] mb-4 stroke-1" />
            {itemsWithCards.length === 0 ? (
              <>
                <h3 className="text-lg font-medium mb-1 font-ui">No knowledge found</h3>
                <p className="text-sm text-[var(--muted-color)] font-content max-w-sm mb-6">
                  Your library is empty. Seed the standard high-yield library to start learning immediately.
                </p>
                <div className="flex flex-col items-center">
                  <button
                    onClick={handleSeed}
                    disabled={isSeeding || isReadOnly}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-[var(--color-action-primary-bg)] text-[var(--color-action-primary-text)] rounded-xl font-medium font-ui hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    {isSeeding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    {isSeeding ? 'Seeding...' : 'Seed Standard Library (32 items)'}
                  </button>
                  {isReadOnly && (
                    <p className="text-xs text-[var(--muted-color)] mt-3 font-content text-center">
                      {!isDev
                        ? 'Configuration required: Firebase Firestore credentials are not configured. Library seeding is disabled in production builds.'
                        : 'Cloud Firestore is unconfigured. Opt in to Ephemeral Developer Mode in Settings to seed and explore.'}
                    </p>
                  )}
                </div>
              </>
            ) : (
              <>
                <h3 className="text-lg font-medium mb-1 font-ui">No knowledge items match these filters.</h3>
                <p className="text-sm text-[var(--muted-color)] font-content max-w-sm mb-4">
                  {searchQuery
                    ? `No items match the query "${searchQuery}" with the current filter selections.`
                    : 'Try adjusting or clearing your filters to see more knowledge items.'}
                </p>
                {hasActiveFilters && (
                  <button
                    onClick={handleClearFilters}
                    className="px-4 py-2 bg-[var(--color-action-primary-bg)] text-[var(--color-action-primary-text)] rounded-xl text-sm font-medium font-ui hover:opacity-90 transition-opacity cursor-pointer"
                  >
                    Clear filters
                  </button>
                )}
              </>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredItems.map((bundle) => {
              const { item, cards, cardStates } = bundle;
              const primaryCard = cards[0];
              const primaryState = primaryCard ? cardStates[primaryCard.id] : null;
              const isSelected = selectedIds.has(item.id);

              return (
                <div
                  key={item.id}
                  id={`knowledge-item-${item.id}`}
                  data-testid={`knowledge-item-card-${item.id}`}
                  onClick={() => {
                    if (isSelecting) {
                      if (!isBulkLifecyclePending) {
                        toggleItemSelection(item.id);
                      }
                    } else {
                      handleOpenDetail(bundle);
                    }
                  }}
                  role={isSelecting ? 'button' : undefined}
                  aria-selected={isSelecting ? isSelected : undefined}
                  aria-disabled={isSelecting && isBulkLifecyclePending ? true : undefined}
                  aria-label={isSelecting ? `${isSelected ? 'Deselect' : 'Select'} ${item.title}` : undefined}
                  className={`p-5 rounded-xl border transition-all cursor-pointer paper-shadow flex flex-col justify-between group ${
                    isSelected
                      ? 'border-[var(--color-primary)] bg-[var(--color-soft-primary)]'
                      : 'border-[var(--border-color)] bg-[var(--surface-color)] hover:border-[var(--color-primary)]'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2 truncate">
                        {isSelecting && (
                          <input
                            type="checkbox"
                            checked={isSelected}
                            disabled={isBulkLifecyclePending}
                            onClick={(e) => e.stopPropagation()}
                            onChange={() => toggleItemSelection(item.id)}
                            aria-label={`Select ${item.title}`}
                            data-testid={`select-item-checkbox-${item.id}`}
                            className="w-4 h-4 rounded border-[var(--border-color)] text-[var(--color-primary)] focus:ring-[var(--color-primary)] cursor-pointer shrink-0"
                          />
                        )}
                        <span className="text-xs uppercase tracking-wider text-[var(--muted-color)] truncate font-ui">
                          {getDomainName(item.taxonomy.domainId)} › {getTopicName(item.taxonomy.topicId)}
                          {item.taxonomy.subtopicId ? ` › ${getSubtopicName(item.taxonomy.subtopicId)}` : ''}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {item.status === 'needs_review' && (
                          <span className="p-1 text-[var(--color-attention)] bg-[var(--color-soft-attention)] rounded" title="Needs attention">
                            <AlertTriangle className="w-3.5 h-3.5" />
                          </span>
                        )}
                        <span className="text-xs px-2 py-0.5 rounded bg-[var(--elevated-color)] font-mono text-[var(--muted-color)]">
                          {cards.length} {cards.length === 1 ? 'card' : 'cards'}
                        </span>
                      </div>
                    </div>

                    <h3 className="font-semibold font-ui text-[var(--text-strong)] text-base mb-1.5 group-hover:text-[var(--color-primary)] transition-colors">
                      {item.title}
                    </h3>

                    <p className="text-sm text-[var(--muted-color)] font-content line-clamp-2 mb-3">
                      {item.content}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-[var(--border-color)] flex items-center justify-between text-xs font-ui text-[var(--muted-color)]">
                    <span className="font-mono capitalize">
                      {primaryCard ? primaryCard.type.replace('_', ' ') : 'no cards'}
                    </span>
                    {primaryState && (
                      <span className="font-mono">
                        Stage: <strong className="text-[var(--text-color)]">{primaryState.state}</strong>
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Item Detail / Inspector Overlay */}
      {selectedItem && (
        <div data-testid="item-inspector-overlay" className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div data-testid="item-inspector-modal" className="bg-[var(--surface-color)] border border-[var(--border-color)] rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col paper-shadow overflow-hidden">
            <div className="p-4 md:p-6 border-b border-[var(--border-color)] flex items-center justify-between bg-[var(--elevated-color)]">
              <div>
                <span className="text-xs text-[var(--muted-color)] uppercase tracking-wider font-ui">
                  {getDomainName(selectedItem.item.taxonomy.domainId)} › {getTopicName(selectedItem.item.taxonomy.topicId)}
                  {selectedItem.item.taxonomy.subtopicId
                    ? ` › ${getSubtopicName(selectedItem.item.taxonomy.subtopicId)}`
                    : ''}
                </span>
                <h3 className="text-lg font-semibold font-ui mt-0.5">{selectedItem.item.title}</h3>
              </div>
              <div className="flex items-center gap-2">
                {!isReadOnly && (
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className="p-2 text-[var(--muted-color)] hover:text-[var(--text-color)] rounded-lg hover:bg-[var(--surface-color)]"
                    title={isEditing ? 'Cancel Edit' : 'Edit Knowledge Item'}
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => setSelectedItem(null)}
                  className="p-2 text-[var(--muted-color)] hover:text-[var(--text-color)] rounded-lg hover:bg-[var(--surface-color)]"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {lifecycleError && (
              <div
                id="lifecycle-error-banner"
                data-testid="lifecycle-error-banner"
                className="mx-4 md:mx-6 mt-4 p-3 bg-[var(--color-soft-error)] border border-[var(--color-error)] rounded-xl text-xs text-[var(--color-error)] font-ui flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{lifecycleError}</span>
                </div>
                <button onClick={() => setLifecycleError(null)} className="p-1 hover:opacity-75" aria-label="Dismiss error">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            <div className="p-4 md:p-6 overflow-y-auto space-y-6 flex-1">
              {isEditing ? (
                <div className="space-y-4">
                  {editError && (
                    <div className="p-3 bg-[var(--color-soft-error)] border border-[var(--color-error)] rounded-xl text-xs text-[var(--color-error)] font-ui flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>{editError}</span>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--muted-color)] mb-1 font-ui">
                      Title
                    </label>
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="w-full p-2.5 bg-[var(--bg-color)] border border-[var(--border-color)] rounded-lg text-sm font-ui"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--muted-color)] mb-1 font-ui">
                      Content Summary
                    </label>
                    <textarea
                      rows={3}
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="w-full p-2.5 bg-[var(--bg-color)] border border-[var(--border-color)] rounded-lg text-sm font-content"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--muted-color)] mb-1 font-ui">
                      Detailed Explanation (Markdown)
                    </label>
                    <textarea
                      rows={5}
                      value={editExplanation}
                      onChange={(e) => setEditExplanation(e.target.value)}
                      className="w-full p-2.5 bg-[var(--bg-color)] border border-[var(--border-color)] rounded-lg text-sm font-mono"
                    />
                  </div>

                  {/* Controlled Taxonomy - Human Readable Names Only */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-[var(--elevated-color)] rounded-xl border border-[var(--border-color)]">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--muted-color)] mb-1 font-ui">
                        Domain
                      </label>
                      <select
                        value={editDomainId}
                        onChange={(e) => {
                          const newDomain = e.target.value;
                          setEditDomainId(newDomain);
                          const matchingTopics = (registry.topics ?? []).filter((t) => t.domainId === newDomain);
                          setEditTopicId(matchingTopics[0]?.id ?? '');
                          setEditSubtopicId('');
                        }}
                        className="w-full p-2 bg-[var(--bg-color)] border border-[var(--border-color)] rounded-lg text-sm font-ui"
                      >
                        {registry.domains?.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--muted-color)] mb-1 font-ui">
                        Topic
                      </label>
                      <select
                        value={editTopicId}
                        onChange={(e) => {
                          setEditTopicId(e.target.value);
                          setEditSubtopicId('');
                        }}
                        className="w-full p-2 bg-[var(--bg-color)] border border-[var(--border-color)] rounded-lg text-sm font-ui"
                      >
                        {availableEditTopics.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--muted-color)] mb-1 font-ui">
                        Optional Subtopic
                      </label>
                      <select
                        value={editSubtopicId}
                        onChange={(e) => setEditSubtopicId(e.target.value)}
                        className="w-full p-2 bg-[var(--bg-color)] border border-[var(--border-color)] rounded-lg text-sm font-ui"
                      >
                        <option value="">None (Top-level topic)</option>
                        {availableEditSubtopics.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Controlled Tags */}
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--muted-color)] mb-2 font-ui flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5" /> Controlled Tags
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {registry.allowedTags?.map((tag) => {
                        const isSelected = editTags.includes(tag);
                        return (
                          <button
                            type="button"
                            key={tag}
                            onClick={() => toggleTag(tag)}
                            className={`px-3 py-1 rounded-full text-xs font-mono transition-colors border ${
                              isSelected
                                ? 'bg-[var(--color-soft-primary)] text-[var(--text-strong)] border-[var(--color-primary)] font-semibold shadow-xs'
                                : 'bg-[var(--bg-color)] text-[var(--muted-color)] border-[var(--border-color)] hover:border-[var(--text-color)]'
                            }`}
                          >
                            #{tag}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <button
                      onClick={handleSaveEdit}
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-[var(--color-action-primary-bg)] text-[var(--color-action-primary-text)] rounded-xl font-medium font-ui hover:opacity-90 transition-opacity"
                    >
                      <Check className="w-4 h-4" />
                      Save Changes
                    </button>
                    <button
                      onClick={() => {
                        setIsEditing(false);
                        setEditError(null);
                      }}
                      className="px-4 py-2.5 border border-[var(--border-color)] text-[var(--muted-color)] rounded-xl font-medium font-ui hover:bg-[var(--surface-color)]"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div>
                    <h4 className="text-xs font-semibold text-[var(--muted-color)] uppercase tracking-wider mb-2 font-ui">
                      Knowledge Summary
                    </h4>
                    <p className="text-base font-content leading-relaxed text-[var(--text-color)]">
                      {selectedItem.item.content}
                    </p>
                  </div>

                  {selectedItem.item.explanationMarkdown && (
                    <div>
                      <h4 className="text-xs font-semibold text-[var(--muted-color)] uppercase tracking-wider mb-2 font-ui">
                        Full Explanation
                      </h4>
                      <div className="p-4 rounded-xl bg-[var(--bg-color)] border border-[var(--border-color)] text-sm font-content leading-relaxed">
                        <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
                          {selectedItem.item.explanationMarkdown}
                        </ReactMarkdown>
                      </div>
                    </div>
                  )}

                  <div>
                    <h4 className="text-xs font-semibold text-[var(--muted-color)] uppercase tracking-wider mb-3 font-ui">
                      Review Cards ({selectedItem.cards.length})
                    </h4>
                    <div className="space-y-3">
                      {selectedItem.cards.map((card, idx) => (
                        <div
                          key={card.id}
                          className="p-4 rounded-xl border border-[var(--border-color)] bg-[var(--elevated-color)]"
                        >
                          <div className="flex items-center justify-between text-xs font-mono uppercase text-[var(--muted-color)] mb-2">
                            <span>
                              Card {idx + 1}: {card.type.replace('_', ' ')}
                            </span>
                            {selectedItem.cardStates[card.id] && (
                              <span>
                                Stage: {selectedItem.cardStates[card.id].state} | Reps: {selectedItem.cardStates[card.id].reps}
                              </span>
                            )}
                          </div>
                          <div className="text-sm font-medium font-content">
                            {card.type === 'free_recall' && card.prompt}
                            {card.type === 'flashcard' && `Front: ${card.front}`}
                            {card.type === 'mcq' && card.question}
                            {card.type === 'true_false' && card.statement}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            {!isReadOnly && (
              <div className="p-4 md:p-6 border-t border-[var(--border-color)] bg-[var(--bg-color)] flex items-center justify-between">
                {selectedItem.item.status === 'active' && (
                  <>
                    <button
                      id="action-mark-needs-attention"
                      onClick={() => handleLifecycleTransition(selectedItem.item.id, 'needs_review')}
                      disabled={isSubmittingLifecycle}
                      className="px-4 py-2 rounded-lg text-sm font-medium border border-[var(--border-color)] text-[var(--text-color)] hover:bg-[var(--surface-color)] transition-colors font-ui flex items-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      <AlertTriangle className="w-4 h-4 text-[var(--color-attention)]" />
                      Mark needs attention
                    </button>
                    <button
                      id="action-archive"
                      onClick={() => handleLifecycleTransition(selectedItem.item.id, 'archived')}
                      disabled={isSubmittingLifecycle}
                      className="px-4 py-2 rounded-lg text-sm font-medium text-[var(--color-error)] hover:bg-[var(--color-soft-error)] border border-transparent hover:border-[var(--color-error)] transition-colors font-ui flex items-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      <Archive className="w-4 h-4" />
                      Archive
                    </button>
                  </>
                )}

                {selectedItem.item.status === 'needs_review' && (
                  <>
                    <button
                      id="action-mark-resolved"
                      onClick={() => handleLifecycleTransition(selectedItem.item.id, 'active')}
                      disabled={isSubmittingLifecycle}
                      className="px-4 py-2 rounded-lg text-sm font-medium border border-[var(--color-attention)] text-[var(--color-attention)] bg-[var(--color-soft-attention)] hover:opacity-90 transition-opacity font-ui flex items-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Mark resolved
                    </button>
                    <button
                      id="action-archive"
                      onClick={() => handleLifecycleTransition(selectedItem.item.id, 'archived')}
                      disabled={isSubmittingLifecycle}
                      className="px-4 py-2 rounded-lg text-sm font-medium text-[var(--color-error)] hover:bg-[var(--color-soft-error)] border border-transparent hover:border-[var(--color-error)] transition-colors font-ui flex items-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      <Archive className="w-4 h-4" />
                      Archive
                    </button>
                  </>
                )}

                {selectedItem.item.status === 'archived' && (
                  <div className="flex items-center justify-between w-full">
                    <span className="text-xs text-[var(--muted-color)] font-ui italic">
                      Archived knowledge item
                    </span>
                    <button
                      id="action-restore"
                      onClick={() => handleLifecycleTransition(selectedItem.item.id, 'active')}
                      disabled={isSubmittingLifecycle}
                      className="px-4 py-2 rounded-lg text-sm font-medium bg-[var(--color-action-primary-bg)] text-[var(--color-action-primary-text)] hover:opacity-90 transition-opacity font-ui flex items-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Restore
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
