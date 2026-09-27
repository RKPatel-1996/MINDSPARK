# WORK-010 - Durable Review Submission Acknowledgement

Status: COMPLETE / PROMOTED

Base: `c604f96811e01e86c7549a2d49914358336f32e5`

Branch: `task/work-010-durable-review-persistence-v1`

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

## Verified implementation outcome

The task-branch implementation preserves provisional offline-first review submission while preventing a later terminal repository rejection from silently discarding the completed review.

Implemented contract:

- Firestore ReviewEvent sync observation retains the payload of locally pending ReviewEvents and reports an event through `SyncMetadata.rejectedEvents` when a previously pending immutable event disappears after terminal rejection;
- `ReviewService` retains rejected ReviewEvents in its pending overlay and exposes them as failed submissions instead of deleting them;
- retry reuses the exact immutable ReviewEvent and event ID rather than running review scheduling/submission again;
- concurrent repeated retry activation for the same failed event is suppressed;
- failed state is cleared only after the retry append succeeds;
- `ReviewView` gives failed durable persistence precedence over later queue/focus progression and exposes a direct `Retry saving review` recovery action;
- normal `submitReview()` remains provisional and does not wait indefinitely for server acknowledgement, preserving Firestore offline queued-write behavior;
- scheduler and reconciliation semantics were not changed.

### Verification evidence

Targeted Review UI safety regression:

- `ReviewSubmissionSafetyUI.test.tsx`: 7 / 7 PASS;
- includes the real late-failure sequence: provisional submission -> UI advances -> repository append rejects -> recovery UI appears -> exact event is retried.

ReviewService regression:

- `phase3b1Regression.test.ts`: 16 / 16 PASS;
- terminal rejection retains the event;
- rapid duplicate retry activation produces only one retry append;
- successful retry leaves exactly one ReviewEvent with the original event ID.

Firestore repository emulator regression:

- `firestoreRepositories.test.ts`: 9 / 9 PASS;
- reconstructed repository observes the locally queued event from Firestore cache;
- terminal rules rejection rolls the queued event back;
- `observeSyncState()` directly reports the exact rejected ReviewEvent through `rejectedEvents`.

Canonical web-release-equivalent gate on the WORK-010 task branch:

- TypeScript: PASS;
- ordinary Vitest suite: 63 files / 458 tests PASS;
- production Vite build: PASS;
- PWA build-artifact suite: 8 / 8 PASS;
- `npm run verify:web-release`: PASS;
- `git diff --check`: PASS.

No deployment, billing change, Storage enablement, production cloud mutation, GAP-005 rule hardening, or unrelated feature work occurred.

### Acceptance assessment

All WORK-010 implementation and task-branch verification conditions are satisfied.

WORK-010 is therefore COMPLETE on `task/work-010-durable-review-persistence-v1`.

Canonical promotion and canonical reverification are complete.

## Canonical promotion and reverification

WORK-010 was fast-forward promoted to canonical local `main` at:

`0d198d42cd0849388384a8b27c9b6bb273e43106`

Canonical reverification passed:

- Firestore ReviewEvent repository emulator suite: 9 / 9 PASS;
- TypeScript: PASS;
- ordinary Vitest suite: 63 files / 458 tests PASS;
- production Vite build: PASS;
- PWA build-artifact suite: 8 / 8 PASS;
- `npm run verify:web-release`: PASS;
- `git diff --check`: PASS;
- canonical worktree remained clean.

The expected emulator `PERMISSION_DENIED` output occurred only in the deliberate terminal-rejection characterization test and did not represent a failed gate.

WORK-010 is COMPLETE / PROMOTED.

`GAP-004` is canonically RESOLVED. Remote synchronization remains a separate Git step.