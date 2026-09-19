import React, { useState, useEffect } from 'react';
import { ChevronRight, Folder, FolderOpen, Tag } from 'lucide-react';
import type { TaxonomyRegistry } from '../../domain/taxonomy';
import type { TaxonomyNodeCounts } from '../../application/libraryQuery';

export interface TaxonomyBrowserProps {
  registry: TaxonomyRegistry;
  domainId: string;
  topicId: string;
  subtopicId: string;
  counts: TaxonomyNodeCounts;
  onSelectNode: (level: 'domain' | 'topic' | 'subtopic', id: string) => void;
}

export const TaxonomyBrowser: React.FC<TaxonomyBrowserProps> = ({
  registry,
  domainId,
  topicId,
  subtopicId,
  counts,
  onSelectNode,
}) => {
  // Session-only expansion state; initially keeps active path expanded
  const [expandedDomains, setExpandedDomains] = useState<Set<string>>(() => {
    const initial = new Set<string>();
    if (domainId) initial.add(domainId);
    return initial;
  });

  const [expandedTopics, setExpandedTopics] = useState<Set<string>>(() => {
    const initial = new Set<string>();
    if (topicId) initial.add(topicId);
    return initial;
  });

  // Ensure current active selection path is expanded whenever filter state changes
  useEffect(() => {
    if (domainId) {
      setExpandedDomains((prev) => (prev.has(domainId) ? prev : new Set(prev).add(domainId)));
    }
    if (topicId) {
      setExpandedTopics((prev) => (prev.has(topicId) ? prev : new Set(prev).add(topicId)));
    }
  }, [domainId, topicId]);

  const toggleDomain = (id: string) => {
    setExpandedDomains((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleTopic = (id: string) => {
    setExpandedTopics((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const domains = registry.domains ?? [];
  const topics = registry.topics ?? [];
  const subtopics = registry.subtopics ?? [];

  if (domains.length === 0) {
    return null;
  }

  return (
    <nav
      id="library-taxonomy-browser"
      aria-label="Taxonomy hierarchy"
      className="text-xs font-ui space-y-1 select-none"
    >
      {domains.map((domain) => {
        const domainTopics = topics.filter((t) => t.domainId === domain.id);
        const isExpanded = expandedDomains.has(domain.id);
        const isSelected = domainId === domain.id && !topicId && !subtopicId;
        const isParentOfSelected = domainId === domain.id && (Boolean(topicId) || Boolean(subtopicId));
        const domainCount = counts.domains[domain.id] ?? 0;

        return (
          <div key={domain.id} className="rounded-lg">
            {/* Domain Node Row */}
            <div
              className={`flex items-center justify-between group rounded-lg px-2 py-1.5 transition-colors ${
                isSelected
                  ? 'bg-[var(--color-primary)] text-white font-medium shadow-xs'
                  : isParentOfSelected
                  ? 'bg-[var(--color-soft-primary)] text-[var(--color-primary)] font-medium'
                  : 'hover:bg-[var(--border-color)]/30 text-[var(--text-color)]'
              }`}
            >
              <div className="flex items-center gap-1 min-w-0 flex-1">
                {domainTopics.length > 0 ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleDomain(domain.id);
                    }}
                    aria-expanded={isExpanded}
                    aria-label={isExpanded ? `Collapse ${domain.name}` : `Expand ${domain.name}`}
                    className={`p-1 rounded-sm cursor-pointer transition-colors ${
                      isSelected
                        ? 'text-white hover:bg-white/20'
                        : 'text-[var(--muted-color)] hover:text-[var(--text-color)]'
                    }`}
                  >
                    <ChevronRight
                      className={`w-3.5 h-3.5 transition-transform duration-150 ${
                        isExpanded ? 'rotate-90' : ''
                      }`}
                    />
                  </button>
                ) : (
                  <span className="w-5" />
                )}

                <button
                  type="button"
                  onClick={() => {
                    onSelectNode('domain', domain.id);
                    if (!isExpanded && domainTopics.length > 0) {
                      toggleDomain(domain.id);
                    }
                  }}
                  aria-current={isSelected ? 'true' : undefined}
                  aria-label={`${domain.name}, ${domainCount} items`}
                  className="flex items-center gap-1.5 min-w-0 flex-1 text-left cursor-pointer focus:outline-none focus-visible:underline truncate"
                >
                  {isExpanded ? (
                    <FolderOpen className="w-3.5 h-3.5 shrink-0 opacity-70" />
                  ) : (
                    <Folder className="w-3.5 h-3.5 shrink-0 opacity-70" />
                  )}
                  <span className="truncate">{domain.name}</span>
                </button>
              </div>

              <span
                className={`ml-2 text-[11px] font-mono px-1.5 py-0.5 rounded-full shrink-0 ${
                  isSelected
                    ? 'bg-white/20 text-white font-semibold'
                    : 'text-[var(--muted-color)] bg-[var(--bg-color)]/60'
                }`}
              >
                {domainCount}
              </span>
            </div>

            {/* Nested Topics */}
            {isExpanded && domainTopics.length > 0 && (
              <div className="ml-3 pl-2.5 border-l border-[var(--border-color)]/60 space-y-0.5 mt-0.5 mb-1">
                {domainTopics.map((topic) => {
                  const topicSubtopics = subtopics.filter((s) => s.topicId === topic.id);
                  const isTopicExpanded = expandedTopics.has(topic.id);
                  const isTopicSelected = topicId === topic.id && !subtopicId;
                  const isTopicParentOfSelected = topicId === topic.id && Boolean(subtopicId);
                  const topicCount = counts.topics[topic.id] ?? 0;

                  return (
                    <div key={topic.id}>
                      {/* Topic Node Row */}
                      <div
                        className={`flex items-center justify-between group rounded-md px-2 py-1 transition-colors ${
                          isTopicSelected
                            ? 'bg-[var(--color-primary)] text-white font-medium shadow-xs'
                            : isTopicParentOfSelected
                            ? 'bg-[var(--color-soft-primary)] text-[var(--color-primary)] font-medium'
                            : 'hover:bg-[var(--border-color)]/30 text-[var(--text-color)]'
                        }`}
                      >
                        <div className="flex items-center gap-1 min-w-0 flex-1">
                          {topicSubtopics.length > 0 ? (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleTopic(topic.id);
                              }}
                              aria-expanded={isTopicExpanded}
                              aria-label={isTopicExpanded ? `Collapse ${topic.name}` : `Expand ${topic.name}`}
                              className={`p-1 rounded-sm cursor-pointer transition-colors ${
                                isTopicSelected
                                  ? 'text-white hover:bg-white/20'
                                  : 'text-[var(--muted-color)] hover:text-[var(--text-color)]'
                              }`}
                            >
                              <ChevronRight
                                className={`w-3 h-3 transition-transform duration-150 ${
                                  isTopicExpanded ? 'rotate-90' : ''
                                }`}
                              />
                            </button>
                          ) : (
                            <span className="w-5" />
                          )}

                          <button
                            type="button"
                            onClick={() => {
                              onSelectNode('topic', topic.id);
                              if (!isTopicExpanded && topicSubtopics.length > 0) {
                                toggleTopic(topic.id);
                              }
                            }}
                            aria-current={isTopicSelected ? 'true' : undefined}
                            aria-label={`${topic.name}, ${topicCount} items`}
                            className="flex items-center gap-1.5 min-w-0 flex-1 text-left cursor-pointer focus:outline-none focus-visible:underline truncate"
                          >
                            <span className="truncate">{topic.name}</span>
                          </button>
                        </div>

                        <span
                          className={`ml-2 text-[10px] font-mono px-1.5 py-0.2 rounded-full shrink-0 ${
                            isTopicSelected
                              ? 'bg-white/20 text-white font-semibold'
                              : 'text-[var(--muted-color)] bg-[var(--bg-color)]/60'
                          }`}
                        >
                          {topicCount}
                        </span>
                      </div>

                      {/* Nested Subtopics */}
                      {isTopicExpanded && topicSubtopics.length > 0 && (
                        <div className="ml-3 pl-2.5 border-l border-[var(--border-color)]/60 space-y-0.5 mt-0.5 mb-1">
                          {topicSubtopics.map((subtopic) => {
                            const isSubtopicSelected = subtopicId === subtopic.id;
                            const subtopicCount = counts.subtopics[subtopic.id] ?? 0;

                            return (
                              <div
                                key={subtopic.id}
                                className={`flex items-center justify-between group rounded-md px-2 py-1 transition-colors ${
                                  isSubtopicSelected
                                    ? 'bg-[var(--color-primary)] text-white font-medium shadow-xs'
                                    : 'hover:bg-[var(--border-color)]/30 text-[var(--text-color)]'
                                }`}
                              >
                                <button
                                  type="button"
                                  onClick={() => onSelectNode('subtopic', subtopic.id)}
                                  aria-current={isSubtopicSelected ? 'true' : undefined}
                                  aria-label={`${subtopic.name}, ${subtopicCount} items`}
                                  className="flex items-center gap-1.5 min-w-0 flex-1 text-left cursor-pointer focus:outline-none focus-visible:underline truncate pl-5"
                                >
                                  <Tag className="w-3 h-3 shrink-0 opacity-60" />
                                  <span className="truncate">{subtopic.name}</span>
                                </button>

                                <span
                                  className={`ml-2 text-[10px] font-mono px-1.5 py-0.2 rounded-full shrink-0 ${
                                    isSubtopicSelected
                                      ? 'bg-white/20 text-white font-semibold'
                                      : 'text-[var(--muted-color)] bg-[var(--bg-color)]/60'
                                  }`}
                                >
                                  {subtopicCount}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );
};
