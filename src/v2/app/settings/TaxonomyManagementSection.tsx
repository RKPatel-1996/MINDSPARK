import React, { useState, useEffect, useCallback } from 'react';
import { useApplication } from '../../application';
import type { TaxonomyRegistry, TaxonomyDomain, TaxonomyTopic, TaxonomySubtopic } from '../../domain/taxonomy';
import {
  isDuplicateTaxonomyError,
  isTaxonomyParentNotFoundError,
  isTaxonomyNodeNotFoundError,
  isTaxonomyError,
} from '../../application/taxonomyService';
import { CANONICAL_TAXONOMY_REGISTRY } from '../../application/canonicalTaxonomy';
import {
  FolderTree,
  ChevronRight,
  ChevronDown,
  Plus,
  Pencil,
  Loader2,
  AlertTriangle,
  Lock,
} from 'lucide-react';

/**
 * Formats typed Task-4 taxonomy errors into user-friendly messages
 * strictly inspecting typed error properties without parsing err.message.
 */
export function formatTaxonomyError(err: unknown): string {
  if (isDuplicateTaxonomyError(err)) {
    if (err.scope === 'tag') {
      return `Tag "${err.nameValue}" already exists.`;
    }
    if (err.parentId) {
      return `A ${err.scope} named "${err.nameValue}" already exists under this parent.`;
    }
    return `A ${err.scope} named "${err.nameValue}" already exists.`;
  }
  if (isTaxonomyParentNotFoundError(err)) {
    return `Parent ${err.parentType} could not be found.`;
  }
  if (isTaxonomyNodeNotFoundError(err)) {
    return `The selected ${err.nodeType} could not be found.`;
  }
  if (isTaxonomyError(err)) {
    if (err.code === 'invalid_input') {
      return 'Please enter a valid, non-empty name containing alphanumeric characters.';
    }
    return 'Taxonomy operation failed.';
  }
  return 'An unexpected error occurred while updating taxonomy.';
}

export type ActiveEditor =
  | { type: 'add_domain' }
  | { type: 'add_topic'; domainId: string; parentName: string }
  | { type: 'add_subtopic'; topicId: string; parentName: string }
  | { type: 'rename_domain'; id: string; currentName: string }
  | { type: 'rename_topic'; id: string; currentName: string }
  | { type: 'rename_subtopic'; id: string; currentName: string }
  | { type: 'add_tag' }
  | null;

export interface TaxonomyManagementSectionProps {
  defaultExpanded?: boolean;
}

export const TaxonomyManagementSection: React.FC<TaxonomyManagementSectionProps> = ({
  defaultExpanded = false,
}) => {
  const {
    taxonomyService,
    isSignedOut,
    isUnconfigured,
    isEphemeralDev,
    refreshCount,
    triggerRefresh,
  } = useApplication();

  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [registry, setRegistry] = useState<TaxonomyRegistry | null>(null);
  const [loading, setLoading] = useState(false);

  // Active inline editor state
  const [activeEditor, setActiveEditor] = useState<ActiveEditor>(null);
  const [inputValue, setInputValue] = useState('');
  const [editorError, setEditorError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isMutationDisabled = isSignedOut || (isUnconfigured && !isEphemeralDev);

  // Fetch registry whenever expanded or when refreshCount changes
  const loadRegistry = useCallback(async () => {
    setLoading(true);
    try {
      const reg = await taxonomyService.getRegistry();
      setRegistry(reg);
    } catch {
      // In unconfigured or signed-out states, fall back to canonical taxonomy for read-only view
      setRegistry(CANONICAL_TAXONOMY_REGISTRY);
    } finally {
      setLoading(false);
    }
  }, [taxonomyService]);

  useEffect(() => {
    if (isExpanded) {
      loadRegistry();
    }
  }, [isExpanded, loadRegistry, refreshCount]);

  const handleCancelEditor = () => {
    setActiveEditor(null);
    setInputValue('');
    setEditorError(null);
  };

  const handleStartAddDomain = () => {
    if (isMutationDisabled) return;
    setActiveEditor({ type: 'add_domain' });
    setInputValue('');
    setEditorError(null);
  };

  const handleStartAddTopic = (domain: TaxonomyDomain) => {
    if (isMutationDisabled) return;
    setActiveEditor({ type: 'add_topic', domainId: domain.id, parentName: domain.name });
    setInputValue('');
    setEditorError(null);
  };

  const handleStartAddSubtopic = (topic: TaxonomyTopic) => {
    if (isMutationDisabled) return;
    setActiveEditor({ type: 'add_subtopic', topicId: topic.id, parentName: topic.name });
    setInputValue('');
    setEditorError(null);
  };

  const handleStartRenameDomain = (domain: TaxonomyDomain) => {
    if (isMutationDisabled) return;
    setActiveEditor({ type: 'rename_domain', id: domain.id, currentName: domain.name });
    setInputValue(domain.name);
    setEditorError(null);
  };

  const handleStartRenameTopic = (topic: TaxonomyTopic) => {
    if (isMutationDisabled) return;
    setActiveEditor({ type: 'rename_topic', id: topic.id, currentName: topic.name });
    setInputValue(topic.name);
    setEditorError(null);
  };

  const handleStartRenameSubtopic = (subtopic: TaxonomySubtopic) => {
    if (isMutationDisabled) return;
    setActiveEditor({ type: 'rename_subtopic', id: subtopic.id, currentName: subtopic.name });
    setInputValue(subtopic.name);
    setEditorError(null);
  };

  const handleStartAddTag = () => {
    if (isMutationDisabled) return;
    setActiveEditor({ type: 'add_tag' });
    setInputValue('');
    setEditorError(null);
  };

  const handleSubmitEditor = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!activeEditor || isSubmitting || isMutationDisabled) return;

    const trimmed = inputValue.trim();
    if (!trimmed) {
      setEditorError('Please enter a valid name.');
      return;
    }

    setIsSubmitting(true);
    setEditorError(null);

    try {
      switch (activeEditor.type) {
        case 'add_domain':
          await taxonomyService.addDomain({ name: trimmed });
          break;
        case 'add_topic':
          await taxonomyService.addTopic({ domainId: activeEditor.domainId, name: trimmed });
          break;
        case 'add_subtopic':
          await taxonomyService.addSubtopic({ topicId: activeEditor.topicId, name: trimmed });
          break;
        case 'rename_domain':
          await taxonomyService.renameDomain(activeEditor.id, trimmed);
          break;
        case 'rename_topic':
          await taxonomyService.renameTopic(activeEditor.id, trimmed);
          break;
        case 'rename_subtopic':
          await taxonomyService.renameSubtopic(activeEditor.id, trimmed);
          break;
        case 'add_tag':
          await taxonomyService.addTag(trimmed);
          break;
      }

      // Immediately display the persisted registry returned by the mutation
      const updatedRegistry = await taxonomyService.getRegistry();
      setRegistry(updatedRegistry);
      setActiveEditor(null);
      setInputValue('');
      setEditorError(null);
      triggerRefresh();
    } catch (err: unknown) {
      // Preserve editor state and user input on error without optimistic mutation
      setEditorError(formatTaxonomyError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderInlineEditor = (
    title: string,
    confirmLabel: 'Add' | 'Save',
    placeholder: string,
    inputAriaLabel: string
  ) => (
    <form
      onSubmit={handleSubmitEditor}
      className="p-3 my-2 bg-[var(--elevated-color)] border border-[var(--border-color)] rounded-xl space-y-2.5"
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          handleCancelEditor();
        }
      }}
    >
      <div className="flex items-center justify-between text-xs font-semibold font-ui text-[var(--text-color)]">
        <span>{title}</span>
        <span className="text-[10px] text-[var(--muted-color)] font-normal">Esc to cancel</span>
      </div>

      <div>
        <input
          autoFocus
          type="text"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            setEditorError(null);
          }}
          placeholder={placeholder}
          aria-label={inputAriaLabel}
          disabled={isSubmitting}
          className="w-full px-3 py-1.5 bg-[var(--bg-color)] border border-[var(--border-color)] rounded-lg text-xs font-ui text-[var(--text-color)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] disabled:opacity-50"
        />
      </div>

      {editorError && (
        <div
          role="alert"
          className="p-2 bg-[var(--color-soft-error)] text-[var(--color-error)] rounded-lg text-xs font-ui flex items-center gap-1.5"
        >
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          <span>{editorError}</span>
        </div>
      )}

      <div className="flex items-center justify-end gap-2 pt-1 font-ui">
        <button
          type="button"
          onClick={handleCancelEditor}
          disabled={isSubmitting}
          className="px-3 py-1 rounded-lg border border-[var(--border-color)] text-xs font-medium text-[var(--muted-color)] hover:text-[var(--text-color)] hover:bg-[var(--surface-color)] transition-colors disabled:opacity-40"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting || !inputValue.trim()}
          className="inline-flex items-center gap-1.5 px-3 py-1 bg-[var(--color-action-primary-bg)] text-[var(--color-action-primary-text)] rounded-lg text-xs font-medium hover:opacity-90 transition-opacity disabled:opacity-40"
        >
          {isSubmitting && <Loader2 className="w-3 h-3 animate-spin" />}
          <span>{confirmLabel}</span>
        </button>
      </div>
    </form>
  );

  return (
    <div className="bg-[var(--surface-color)] border border-[var(--border-color)] rounded-xl p-6 paper-shadow space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-lg font-ui mb-1">Knowledge Organization</h3>
          <p className="text-sm text-[var(--muted-color)] font-content">
            Curate the controlled hierarchy (domain, topic, subtopic) and controlled tags.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsExpanded((prev) => !prev)}
          aria-expanded={isExpanded}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold font-ui border border-[var(--border-color)] bg-[var(--elevated-color)] text-[var(--text-color)] hover:bg-[var(--surface-color)] transition-colors"
        >
          <FolderTree className="w-3.5 h-3.5 text-[var(--muted-color)]" />
          <span>{isExpanded ? 'Hide Taxonomy' : 'Manage Taxonomy'}</span>
          {isExpanded ? (
            <ChevronDown className="w-3.5 h-3.5 text-[var(--muted-color)]" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5 text-[var(--muted-color)]" />
          )}
        </button>
      </div>

      {isExpanded && (
        <div className="space-y-6 pt-2 border-t border-[var(--border-color)] animate-in fade-in duration-200">
          {/* Read-only / unconfigured status banner */}
          {isMutationDisabled && (
            <div
              className="p-3.5 bg-[var(--color-soft-warning)] text-[var(--color-warning)] rounded-xl border border-[var(--color-warning)] text-xs flex items-center gap-2.5 font-ui"
              role="status"
            >
              <Lock className="w-4 h-4 shrink-0 text-amber-600" />
              <span>
                {isSignedOut ? (
                  <>
                    <strong>Authentication required:</strong> Sign in to add or rename taxonomy items and tags.
                  </>
                ) : (
                  <>
                    <strong>Configuration required:</strong> Firebase Firestore is not configured. Cloud persistence is unavailable and taxonomy mutations are disabled in this state.
                  </>
                )}
              </span>
            </div>
          )}

          {/* Loading state */}
          {loading && !registry && (
            <div className="flex items-center gap-2 text-xs text-[var(--muted-color)] py-4 font-ui">
              <Loader2 className="w-4 h-4 animate-spin text-[var(--color-primary)]" />
              <span>Loading taxonomy registry...</span>
            </div>
          )}

          {/* Controlled Taxonomy Hierarchy */}
          {registry && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-[var(--border-color)]">
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-color)] font-ui">
                    Taxonomy Hierarchy
                  </h4>
                  <p className="text-[11px] text-[var(--muted-color)] font-content mt-0.5">
                    Structured classification for knowledge cards and active recall sessions.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleStartAddDomain}
                  disabled={isMutationDisabled}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium font-ui border border-[var(--border-color)] bg-[var(--elevated-color)] text-[var(--text-color)] hover:bg-[var(--surface-color)] transition-colors disabled:opacity-40"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Domain</span>
                </button>
              </div>

              {/* Add Domain Top-Level Editor */}
              {activeEditor?.type === 'add_domain' &&
                renderInlineEditor('Add Domain', 'Add', 'Domain name (e.g. Cognitive Science)', 'Domain name')}

              {/* Domains Tree */}
              <div className="space-y-4" data-testid="taxonomy-tree">
                {registry.domains.length === 0 ? (
                  <p className="text-xs text-[var(--muted-color)] italic font-content py-2">
                    No taxonomy domains registered.
                  </p>
                ) : (
                  registry.domains.map((domain) => {
                    const domainTopics = registry.topics.filter((t) => t.domainId === domain.id);
                    const isRenamingDomain =
                      activeEditor?.type === 'rename_domain' && activeEditor.id === domain.id;
                    const isAddingTopic =
                      activeEditor?.type === 'add_topic' && activeEditor.domainId === domain.id;

                    return (
                      <div
                        key={domain.id}
                        className="bg-[var(--surface-color)] border border-[var(--border-color)] rounded-xl p-4 space-y-3"
                      >
                        {/* Domain Row */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-[var(--color-primary)] shrink-0" />
                            <span className="font-semibold text-sm font-ui text-[var(--text-color)]">
                              {domain.name}
                            </span>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleStartRenameDomain(domain)}
                              disabled={isMutationDisabled}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium font-ui text-[var(--muted-color)] hover:text-[var(--text-color)] hover:bg-[var(--elevated-color)] transition-colors disabled:opacity-40"
                            >
                              <Pencil className="w-3 h-3" />
                              <span>Rename</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleStartAddTopic(domain)}
                              disabled={isMutationDisabled}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium font-ui text-[var(--muted-color)] hover:text-[var(--text-color)] hover:bg-[var(--elevated-color)] transition-colors disabled:opacity-40"
                            >
                              <Plus className="w-3 h-3" />
                              <span>Add Topic</span>
                            </button>
                          </div>
                        </div>

                        {/* Rename Domain Inline Editor */}
                        {isRenamingDomain &&
                          renderInlineEditor(
                            `Rename domain "${domain.name}"`,
                            'Save',
                            'New domain name',
                            'Domain name'
                          )}

                        {/* Add Topic Inline Editor */}
                        {isAddingTopic &&
                          renderInlineEditor(
                            `Add topic to "${domain.name}"`,
                            'Add',
                            'Topic name (e.g. Memory Systems)',
                            'Topic name'
                          )}

                        {/* Topics List */}
                        {domainTopics.length > 0 && (
                          <div className="pl-4 ml-1 border-l-2 border-[var(--border-color)] space-y-2.5">
                            {domainTopics.map((topic) => {
                              const topicSubtopics = registry.subtopics.filter(
                                (s) => s.topicId === topic.id
                              );
                              const isRenamingTopic =
                                activeEditor?.type === 'rename_topic' && activeEditor.id === topic.id;
                              const isAddingSubtopic =
                                activeEditor?.type === 'add_subtopic' && activeEditor.topicId === topic.id;

                              return (
                                <div key={topic.id} className="space-y-2">
                                  {/* Topic Row */}
                                  <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--muted-color)] shrink-0" />
                                      <span className="font-medium text-xs font-ui text-[var(--text-color)]">
                                        {topic.name}
                                      </span>
                                    </div>

                                    <div className="flex items-center gap-1">
                                      <button
                                        type="button"
                                        onClick={() => handleStartRenameTopic(topic)}
                                        disabled={isMutationDisabled}
                                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium font-ui text-[var(--muted-color)] hover:text-[var(--text-color)] hover:bg-[var(--elevated-color)] transition-colors disabled:opacity-40"
                                      >
                                        <Pencil className="w-2.5 h-2.5" />
                                        <span>Rename</span>
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleStartAddSubtopic(topic)}
                                        disabled={isMutationDisabled}
                                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium font-ui text-[var(--muted-color)] hover:text-[var(--text-color)] hover:bg-[var(--elevated-color)] transition-colors disabled:opacity-40"
                                      >
                                        <Plus className="w-2.5 h-2.5" />
                                        <span>Add Subtopic</span>
                                      </button>
                                    </div>
                                  </div>

                                  {/* Rename Topic Inline Editor */}
                                  {isRenamingTopic &&
                                    renderInlineEditor(
                                      `Rename topic "${topic.name}"`,
                                      'Save',
                                      'New topic name',
                                      'Topic name'
                                    )}

                                  {/* Add Subtopic Inline Editor */}
                                  {isAddingSubtopic &&
                                    renderInlineEditor(
                                      `Add subtopic to "${topic.name}"`,
                                      'Add',
                                      'Subtopic name (e.g. Working Memory)',
                                      'Subtopic name'
                                    )}

                                  {/* Subtopics List */}
                                  {topicSubtopics.length > 0 && (
                                    <div className="pl-4 ml-1 border-l border-[var(--border-color)] space-y-1.5">
                                      {topicSubtopics.map((subtopic) => {
                                        const isRenamingSubtopic =
                                          activeEditor?.type === 'rename_subtopic' &&
                                          activeEditor.id === subtopic.id;

                                        return (
                                          <div key={subtopic.id} className="space-y-1.5">
                                            {/* Subtopic Row */}
                                            <div className="flex items-center justify-between gap-2">
                                              <div className="flex items-center gap-1.5">
                                                <span className="text-[var(--muted-color)] text-[10px]">
                                                  &rarr;
                                                </span>
                                                <span className="text-xs font-content text-[var(--muted-color)]">
                                                  {subtopic.name}
                                                </span>
                                              </div>

                                              <button
                                                type="button"
                                                onClick={() => handleStartRenameSubtopic(subtopic)}
                                                disabled={isMutationDisabled}
                                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium font-ui text-[var(--muted-color)] hover:text-[var(--text-color)] hover:bg-[var(--elevated-color)] transition-colors disabled:opacity-40"
                                              >
                                                <Pencil className="w-2.5 h-2.5" />
                                                <span>Rename</span>
                                              </button>
                                            </div>

                                            {/* Rename Subtopic Inline Editor */}
                                            {isRenamingSubtopic &&
                                              renderInlineEditor(
                                                `Rename subtopic "${subtopic.name}"`,
                                                'Save',
                                                'New subtopic name',
                                                'Subtopic name'
                                              )}
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
                  })
                )}
              </div>

              {/* Controlled Tags Section */}
              <div className="pt-6 border-t border-[var(--border-color)] space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-semibold font-ui text-[var(--text-color)]">
                      Controlled Tags
                    </h4>
                    <p className="text-xs text-[var(--muted-color)] font-content">
                      Standard tags available for card categorization and import validation.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleStartAddTag}
                    disabled={isMutationDisabled}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium font-ui border border-[var(--border-color)] bg-[var(--elevated-color)] text-[var(--text-color)] hover:bg-[var(--surface-color)] transition-colors disabled:opacity-40"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Tag</span>
                  </button>
                </div>

                {/* Add Tag Inline Editor */}
                {activeEditor?.type === 'add_tag' &&
                  renderInlineEditor('Add Tag', 'Add', 'Tag name (e.g. machine-learning)', 'Tag name')}

                {/* Read-only tag chips */}
                <div className="flex flex-wrap gap-2 pt-1" data-testid="controlled-tags-list">
                  {registry.allowedTags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2.5 py-1 rounded-lg text-xs font-mono bg-[var(--elevated-color)] border border-[var(--border-color)] text-[var(--text-color)]"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
