import type { KnowledgeStatus, KnowledgeItem } from './knowledge';

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
