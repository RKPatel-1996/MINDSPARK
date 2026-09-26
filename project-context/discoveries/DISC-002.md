# DISC-002 - Post-Hardening Read-Only Repository Review

Date: 2026-09-26

Status: VERIFIED_REVIEW

Authority reviewed:

- branch: `main`;
- canonical HEAD: `2483a5cb05c32ab2e19f0723ac01d43a1a5f66b7`;
- `main == origin/main`;
- worktree clean.

## Aim

Record the read-only post-hardening review performed after WORK-009 so later sessions can distinguish confirmed release risks from architectural debt, suspected operational risks, and deferred improvements.

The review made no repository edits, commits, Firebase mutations, deployments, Storage changes, or billing changes.

Local review verification included:

- `git diff --check`: PASS;
- `npm run typecheck`: PASS;
- ordinary Vitest suite: 63 files / 456 tests PASS.

The review deliberately did not rerun generated-output or emulator workflows because its mode was read-only.

## Confirmed High findings

### MSR-01 - Review submission can be lost after UI advancement

`ReviewService.submitReview()` starts repository append persistence without awaiting its terminal result. The method can return success and allow Review UI advancement before a later repository rejection removes the pending event.

Risk:

- an answer can disappear after the UI has discarded its retry state;
- durable review history can diverge from what the user believes was recorded.

Primary evidence:

- `src/v2/application/reviewService.ts`;
- `src/v2/app/review/ReviewView.tsx`;
- existing UI failure tests mock service rejection and do not exercise the actual delayed repository-failure path.

Disposition:

- durable release blocker;
- tracked as `GAP-004`;
- next bounded work: `WORK-010`.

### MSR-02 - Firestore immutable ReviewEvent rules are weaker than the domain schema

Firestore create rules validate several ReviewEvent fields structurally but do not enforce the full application-domain enum, scheduler-metadata, numeric-bound, schema-version, and objective-correctness invariants.

Risk:

- an authenticated owner client can create malformed immutable evidence;
- malformed append-only evidence cannot later be updated or deleted;
- reconciliation can fail closed when reading such history.

Primary evidence:

- `firestore.rules.template`;
- `src/v2/domain/event.ts`;
- `src/v2/persistence/firebase/__tests__/firestore.rules.test.ts`.

Disposition:

- durable release blocker;
- tracked as `GAP-005`;
- intended next correction after WORK-010, subject to fresh registration.

## Confirmed Medium findings

The review also confirmed:

- `MSR-03` - simultaneous identical imports can race past duplicate detection;
- `MSR-04` - Review, Library, and Insights perform per-card ReviewEvent history queries that scale poorly;
- `MSR-05` - `ReviewService.destroy()` is not called by `ApplicationProvider`, permitting listener leakage across service/provider lifecycle changes;
- `MSR-06` - long-lived scheduler parameter-set cache is not explicitly invalidated after backup restore;
- `MSR-07` - repository bootstrap rejection has no explicit recovery/error state and can leave Library waiting indefinitely;
- `MSR-08` - Library item activation and modal/focus behavior have confirmed keyboard/screen-reader accessibility defects;
- `MSR-09` - mobile viewport metadata disables user scaling.

These findings remain durable review evidence. They are not automatically active WORK items.

## Suspected runtime risks

### MSS-01 - User-controlled source links

Source URL validation accepts general URL schemes and direct source links are rendered into `href`.

Required follow-up:

- constrain allowed source protocols, preferably to explicit web protocols;
- add schema/rendering tests.

Runtime exploitability was not fully exercised during the read-only review.

### MSS-02 - Browser backup resource exhaustion

Backup archives may expand synchronously to a large declared limit using `unzipSync()`.

Required follow-up:

- device/runtime profiling or tighter browser-safe limits;
- potentially asynchronous/streaming processing if justified.

The operational impact remains unverified.

## Testing and release-contract gaps

The review recorded:

- `MSG-01` - Firebase rules are not part of the normal CI release gate;
- `MSG-02` - review-failure tests do not exercise the actual delayed repository failure;
- `MSG-03` - no simultaneous duplicate-import commit test;
- `MSG-04` - TypeScript strictness is currently disabled;
- `MSG-05` - no automated full accessibility/keyboard audit;
- `MSG-06` - installed-PWA/offline/Auth/reconnect boundaries remain manual/environmental;
- `MSG-07` - dependency audit is not part of the automated release contract.

## Architecture and documentation debt

Observed architecture debt includes:

- implicit invalidation through `ApplicationContext` and global refresh state;
- one-shot reads for several multi-device mutable domains;
- an unused synchronization watermark API while production paths scan histories per card;
- duplicated source rendering between Review and Library;
- service construction with listener side effects.

Documentation debt includes:

- architecture documentation still listing only four card types despite Cloze support;
- historical production-UI prohibition presented as active guidance;
- persistence documentation describing a device collection that current production code does not use.

## Areas reviewed without significant findings

The review found no significant defect in:

- FSRS core and deterministic reconciliation;
- review routing policy;
- backup/restore correctness;
- text/code/math preservation;
- five-card-type import validation;
- lifecycle transaction consistency;
- owner isolation;
- PWA artifact contract;
- tracked secret/configuration hygiene.

## Post-review correction queue

Only one bounded WORK item may be active.

Registered now:

1. `WORK-010` - Durable Review Submission Acknowledgement (`GAP-004`).

Expected later candidates, to be freshly registered after prior work is closed:

2. immutable ReviewEvent rule hardening (`GAP-005`);
3. runtime resilience: service cleanup, restore cache invalidation, bootstrap failure recovery, and safe source protocols;
4. first production release readiness and deployment verification.

Additional deferred candidates:

- atomic import uniqueness;
- Review/Library/Insights query scaling;
- Library/mobile accessibility closure;
- release-contract and CI expansion;
- authoritative documentation reconciliation.

Do not interpret this queue as already-authorized implementation work.

## Release interpretation

The application is close to personal-use release, but the two confirmed High data-integrity findings must be resolved before normal production use.

After those High findings are closed, remaining runtime-resilience issues should be triaged before the first controlled production deployment.