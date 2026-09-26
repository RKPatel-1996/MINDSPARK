# WORK-010 - Durable Review Submission Acknowledgement

Status: REGISTERED / NOT_STARTED

Base: `2483a5cb05c32ab2e19f0723ac01d43a1a5f66b7`

Planned branch: `task/work-010-durable-review-persistence-v1`

Derived from: `GAP-004`

## Aim

Prevent Review UI progression from silently outliving failed ReviewEvent persistence while preserving MindSpark's offline-first behavior and duplicate-submission protection.

## Verified starting defect

The post-hardening read-only review confirmed that `ReviewService.submitReview()` can return before the repository append reaches its terminal result.

The UI advances after the returned service promise resolves.

A later repository failure can therefore remove the pending event after the direct answer/retry state has already been discarded.

See:

- `project-context/discoveries/DISC-002.md`;
- `project-context/gaps/GAP-004.md`;
- `src/v2/application/reviewService.ts`;
- `src/v2/app/review/ReviewView.tsx`.

## Scope

Investigate and implement the smallest reliable acknowledgement contract across:

- `ReviewService` submission semantics;
- ReviewEvent repository persistence behavior;
- pending ReviewEvent overlay;
- Review UI advancement;
- recoverable retry/error state;
- integration coverage using the real repository-failure path.

The implementation must explicitly account for Firestore offline queued-write behavior rather than simply making the UI block indefinitely on network availability.

## Acceptance

WORK-010 is complete only when:

- a terminal repository rejection cannot silently lose a review after the UI advances;
- the user retains a clear recoverable retry/error path when durable submission fails;
- offline-first review remains usable under the agreed persistence acknowledgement model;
- rapid/repeated activation still cannot create duplicate ReviewEvents;
- scheduler/reconciliation semantics remain unchanged;
- objective and subjective review flows remain correct;
- targeted service/UI/integration regression tests pass;
- ordinary release tests pass;
- relevant Firebase emulator tests pass if repository behavior is exercised;
- `npm run verify:web-release` passes;
- `git diff --check` passes;
- no deployment, billing, Storage enablement, or unrelated cloud mutation occurs.

## Out of scope

Do not expand WORK-010 into:

- `GAP-005` Firestore ReviewEvent schema-rule hardening;
- concurrent import uniqueness;
- Review/Library query scaling;
- general provider lifecycle refactoring unless strictly necessary for this defect;
- accessibility closure;
- TypeScript strictness migration;
- production deployment;
- unrelated feature work.

## Governance boundary

Live repository state is authoritative.

Before implementation:

1. verify canonical `main`, HEAD, `origin/main`, and clean status;
2. create the planned bounded feature branch/worktree from the registered base or the freshly verified canonical successor if governance registration advances `main`;
3. re-read `AGENTS.md`;
4. inspect the exact current ReviewService, repository, and Review UI behavior before choosing persistence semantics.

Do not assume the read-only review's proposed remediation mechanism is necessarily the final implementation design. Preserve the confirmed defect and acceptance boundary; choose the smallest correct solution from current source evidence.