# WORK-013 - Application Runtime Resilience Hardening

Status: REGISTERED / NOT_STARTED

Base: `30af8a220d249f1a958f2373f07aa7dae73e838c`

Planned branch: `task/work-013-application-runtime-resilience-v1`

Derived from: post-WORK-012 runtime-resilience reconnaissance and `DISC-002` findings MSR-05, MSR-06, and MSR-07

## Aim

Harden MindSpark's application/service lifecycle against three confirmed runtime-resilience defects without redesigning persistence, review semantics, scheduling semantics, or application architecture.

The bounded target is:

1. dispose replaced or unmounted `ReviewService` instances correctly;
2. invalidate the long-lived scheduler-parameter cache after successful restore;
3. make repository bootstrap failure explicit and recoverable rather than leaving the application indefinitely unbootstrapped.

## Verified starting condition

Read-only reconnaissance on canonical `main` at `30af8a220d249f1a958f2373f07aa7dae73e838c` confirmed:

### MSR-05 - ReviewService lifecycle cleanup

- `ApplicationProvider` constructs `ReviewService` from the current repository authority.
- A new service is constructed when the repository instance changes.
- `ReviewService.destroy()` already unsubscribes repository sync observation, active-card observation, and service listeners.
- `ApplicationProvider` currently unsubscribes its own `onSyncStateChange()` listener but does not call `reviewService.destroy()` when the service is replaced or the provider unmounts.
- Existing tests exercise explicit manual `ReviewService.destroy()` calls, confirming that disposal is an intentional service lifecycle contract.

### MSR-06 - scheduler parameter cache invalidation

- `ReviewService` maintains `cachedParameterSets`.
- Once populated, `getParameterSetsDict()` returns the cached dictionary rather than rereading the repository.
- Successful backup restore can insert scheduler parameter sets.
- The restore UI currently calls `triggerRefresh()` after successful restore.
- That refresh does not invalidate the existing `ReviewService` scheduler-parameter cache.

### MSR-07 - bootstrap failure recovery

- `ApplicationProvider` tracks `isBootstrapped`.
- `bootstrapUserRepositories(repos)` currently has a success continuation but no explicit rejection state.
- No application-level bootstrap error contract or retry operation exists.
- Consumers therefore distinguish bootstrap success from not-yet-bootstrapped state, but not transient bootstrap failure from ordinary startup.

## Scope

### A. ReviewService ownership and disposal

Implement the smallest provider lifecycle correction that ensures:

- every provider-owned `ReviewService` is destroyed when its authority is replaced;
- provider unmount disposes the active service;
- no stale repository listener survives service replacement;
- normal current sync-state observation remains unchanged.

The fix must preserve the existing `ReviewService.destroy()` contract rather than duplicating its cleanup logic in React components.

### B. Scheduler parameter cache invalidation

Add the smallest explicit `ReviewService` cache invalidation contract needed after authoritative scheduler-parameter mutation.

Required behavior:

- successful restore invalidates scheduler-parameter cache before subsequent review scheduling depends on restored state;
- failed or rejected restore does not falsely imply successful state refresh;
- cache invalidation must not erase unrelated ReviewService state unless explicitly justified;
- `resetSession()` must not silently acquire broader semantics merely for convenience.

### C. Bootstrap failure and retry

Add an explicit bootstrap failure/recovery contract to `ApplicationProvider`.

Required behavior:

- bootstrap rejection is represented as an application state rather than an unhandled or indefinitely ambiguous startup;
- stale bootstrap success or failure from an obsolete repository/auth authority cannot overwrite current authority state;
- a retry operation can rerun bootstrap against the current repository authority;
- successful retry returns the provider to the normal bootstrapped state;
- authority changes clear obsolete bootstrap failure state appropriately;
- existing signed-out, unconfigured, and ephemeral-development gating semantics remain intact.

### D. Focused verification

Add regression tests that demonstrate:

- provider replacement/unmount disposes the correct `ReviewService`;
- stale services do not retain active lifecycle authority;
- scheduler-parameter cache is invalidated after successful restore;
- failed restore does not incorrectly invalidate/advance success state where inappropriate;
- bootstrap rejection produces the explicit error state;
- bootstrap retry succeeds against current authority;
- stale asynchronous bootstrap completion/rejection cannot overwrite newer authority.

## Acceptance

WORK-013 is complete only when:

- MSR-05 provider-owned ReviewService lifecycle cleanup is implemented and covered by regression tests;
- MSR-06 scheduler parameter cache invalidation after successful restore is implemented and covered by regression tests;
- MSR-07 bootstrap failure/retry state is implemented and covered by regression tests;
- repository/auth authority changes remain race-safe;
- review submission behavior from WORK-010 remains unchanged;
- ReviewEvent persistence/rule semantics from WORK-011 remain unchanged;
- backup/restore correctness from WORK-012 remains unchanged;
- offline-first Firestore behavior remains unchanged;
- FSRS and scheduler calculations remain unchanged;
- focused WORK-013 tests pass;
- relevant existing application/provider/restore/review tests pass;
- `npm run typecheck` passes;
- `npm run verify:web-release` passes;
- `git diff --check` passes.

## Out of scope

Do not expand WORK-013 into:

- MSR-03 atomic import uniqueness;
- MSS-01 source URL protocol hardening;
- Review/Library/Insights query-scaling redesign;
- Library/mobile accessibility closure;
- TypeScript strictness migration;
- CI or release-contract expansion;
- dependency remediation;
- backup-format redesign;
- general `ApplicationContext` architecture redesign;
- FSRS or scheduler-semantic changes;
- ReviewEvent schema or security-rule changes;
- Firebase deployment;
- production Firestore mutation;
- Firebase Storage enablement;
- billing changes;
- GitHub backup architecture changes.

Those remain separate candidates for later bounded work.

## Governance boundary

Live repository state is authoritative.

Registration of WORK-013 does not authorize Firebase deployment, production-data mutation, Storage enablement, billing changes, dependency upgrades, or unrelated architecture work.

Before implementation:

1. create the bounded WORK-013 branch from the verified registration commit;
2. re-read `AGENTS.md`;
3. establish focused RED characterization for each surviving MSR-05/MSR-06/MSR-07 defect where practical;
4. fix one lifecycle boundary at a time;
5. preserve current repository/auth authority semantics;
6. run focused regression verification before combining the three corrections;
7. run the full web-release gate before completion governance.
