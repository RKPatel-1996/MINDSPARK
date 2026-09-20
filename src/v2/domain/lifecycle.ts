import type { KnowledgeStatus, KnowledgeItem } from './knowledge';
import { isValidId } from './id';

export const MAX_BULK_LIFECYCLE_ITEMS = 100;

/**
 * Result of a single Library selection toggle. This is intentionally separate
 * from persistence validation: the Library already supplies IDs from its
 * rendered result set, and this helper owns only the capped selection state.
 */
export type BulkSelectionToggleResult =
  | { accepted: true; selection: Set<string> }
  | { accepted: false; selection: ReadonlySet<string> };

/**
 * Pure capped selection transition used by the Library select-mode UI.
 *
 * A selected item is always removable, including when the cap has been
 * reached. An unselected item is accepted only while the selection remains at
 * or below MAX_BULK_LIFECYCLE_ITEMS.
 */
export function toggleBulkSelection(
  currentSelection: ReadonlySet<string>,
  itemId: string,
): BulkSelectionToggleResult {
  if (currentSelection.has(itemId)) {
    const selection = new Set(currentSelection);
    selection.delete(itemId);
    return { accepted: true, selection };
  }

  if (currentSelection.size >= MAX_BULK_LIFECYCLE_ITEMS) {
    return { accepted: false, selection: currentSelection };
  }

  const selection = new Set(currentSelection);
  selection.add(itemId);
  return { accepted: true, selection };
}

export type BulkLifecycleErrorCode =
  | 'empty_selection'
  | 'invalid_item_id'
  | 'too_many_items'
  | 'item_not_found'
  | 'invalid_transition'
  | 'authentication_required'
  | 'configuration_required'
  | 'persistence_failure';

export interface BulkLifecycleErrorDetails {
  readonly itemId?: string;
  readonly from?: KnowledgeStatus;
  readonly to?: KnowledgeStatus;
}

/** Stable typed failure shared by bulk lifecycle domain, service, and repositories. */
export class BulkLifecycleError extends Error {
  readonly code: BulkLifecycleErrorCode;
  readonly itemId?: string;
  readonly from?: KnowledgeStatus;
  readonly to?: KnowledgeStatus;

  constructor(code: BulkLifecycleErrorCode, message: string, details: BulkLifecycleErrorDetails = {}) {
    super(message);
    this.name = 'BulkLifecycleError';
    this.code = code;
    this.itemId = details.itemId;
    this.from = details.from;
    this.to = details.to;
  }
}

export type BulkLifecycleResult =
  | { success: true; items: KnowledgeItem[] }
  | { success: false; error: BulkLifecycleError };

/**
 * Pure normalization boundary for atomic bulk lifecycle operations.
 * IDs retain first-occurrence order after trimming and deterministic de-duplication.
 */
export function normalizeBulkLifecycleItemIds(itemIds: readonly unknown[]): string[] {
  if (!Array.isArray(itemIds) || itemIds.length === 0) {
    throw new BulkLifecycleError('empty_selection', 'Select at least one KnowledgeItem.');
  }

  const normalized: string[] = [];
  const seen = new Set<string>();

  for (const rawId of itemIds) {
    if (typeof rawId !== 'string') {
      throw new BulkLifecycleError('invalid_item_id', 'Every KnowledgeItem ID must be a valid opaque UUID.');
    }

    const itemId = rawId.trim();
    if (!itemId || !isValidId(itemId)) {
      throw new BulkLifecycleError(
        'invalid_item_id',
        `KnowledgeItem ID "${itemId}" is not a valid opaque UUID.`,
        itemId ? { itemId } : {}
      );
    }

    if (!seen.has(itemId)) {
      seen.add(itemId);
      normalized.push(itemId);
      if (normalized.length > MAX_BULK_LIFECYCLE_ITEMS) {
        throw new BulkLifecycleError(
          'too_many_items',
          `Bulk lifecycle operations are limited to ${MAX_BULK_LIFECYCLE_ITEMS} unique KnowledgeItems.`
        );
      }
    }
  }

  if (normalized.length === 0) {
    throw new BulkLifecycleError('empty_selection', 'Select at least one KnowledgeItem.');
  }

  return normalized;
}

export type LifecycleAction =
  | 'mark_needs_attention'
  | 'mark_resolved'
  | 'archive'
  | 'restore';

export interface AllowedLifecycleTransition {
  readonly from: KnowledgeStatus;
  readonly to: KnowledgeStatus;
  readonly action: LifecycleAction;
  readonly label: string;
}

/**
 * Authoritative list of allowed KnowledgeItem lifecycle transitions:
 * - active -> needs_review (Mark needs attention)
 * - active -> archived (Archive)
 * - needs_review -> active (Mark resolved)
 * - needs_review -> archived (Archive)
 * - archived -> active (Restore)
 *
 * All other transitions (including archived -> needs_review, self-transitions,
 * and permanent deletion) are strictly rejected.
 */
export const ALLOWED_LIFECYCLE_TRANSITIONS: readonly AllowedLifecycleTransition[] = [
  { from: 'active', to: 'needs_review', action: 'mark_needs_attention', label: 'Mark needs attention' },
  { from: 'active', to: 'archived', action: 'archive', label: 'Archive' },
  { from: 'needs_review', to: 'active', action: 'mark_resolved', label: 'Mark resolved' },
  { from: 'needs_review', to: 'archived', action: 'archive', label: 'Archive' },
  { from: 'archived', to: 'active', action: 'restore', label: 'Restore' },
] as const;

export type LifecycleTransitionError =
  | { type: 'invalid_transition'; from: KnowledgeStatus; to: KnowledgeStatus; message: string }
  | { type: 'item_not_found'; itemId: string; message: string }
  | { type: 'persistence_failure'; message: string };

export type LifecycleTransitionValidation =
  | { valid: true; action: LifecycleAction; label: string }
  | { valid: false; error: LifecycleTransitionError };

export type LifecycleTransitionResult =
  | { success: true; item: KnowledgeItem; action: LifecycleAction }
  | { success: false; error: LifecycleTransitionError };

/**
 * Pure predicate checking whether a transition between two statuses is allowed.
 */
export function isAllowedLifecycleTransition(from: KnowledgeStatus, to: KnowledgeStatus): boolean {
  return ALLOWED_LIFECYCLE_TRANSITIONS.some((t) => t.from === from && t.to === to);
}

/**
 * Validates a requested lifecycle transition and produces either typed validation success
 * or a typed/discriminated LifecycleTransitionError.
 */
export function validateLifecycleTransition(
  from: KnowledgeStatus,
  to: KnowledgeStatus
): LifecycleTransitionValidation {
  const match = ALLOWED_LIFECYCLE_TRANSITIONS.find((t) => t.from === from && t.to === to);
  if (!match) {
    return {
      valid: false,
      error: {
        type: 'invalid_transition',
        from,
        to,
        message: `Lifecycle transition from "${from}" to "${to}" is not allowed.`,
      },
    };
  }
  return {
    valid: true,
    action: match.action,
    label: match.label,
  };
}

/**
 * Convenience alias for validateLifecycleTransition matching prompt naming.
 */
export function transitionKnowledgeItemStatus(
  currentStatus: KnowledgeStatus,
  requestedStatus: KnowledgeStatus
): LifecycleTransitionValidation {
  return validateLifecycleTransition(currentStatus, requestedStatus);
}

/**
 * Returns the allowed target transitions and actions for a given status.
 */
export function getAllowedActionsForStatus(status: KnowledgeStatus): readonly AllowedLifecycleTransition[] {
  return ALLOWED_LIFECYCLE_TRANSITIONS.filter((t) => t.from === status);
}
