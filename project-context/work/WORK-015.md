# WORK-015 - ReviewEvent History Query Scaling

Status: REGISTERED / NOT_STARTED

Base: `b5279fc3a21ce6ff6d120180bb497994bee2f629`

Planned branch: `task/work-015-reviewevent-query-scaling-v1`

Derived from: `DISC-002` MSR-04 and post-WORK-014 candidate reconnaissance

## Problem

Current application services repeatedly obtain ReviewEvent history one card at a time.

Confirmed current callers include:

- Library aggregation paths that request ReviewEvent history for each card;
- Insights aggregation paths that request ReviewEvent history for each card;
- Review routing/context paths that request history for individual candidate cards.

The Firestore repository currently exposes `listForCard(cardId)` as the primary card-history read primitive. When higher-level workflows iterate over many cards, this produces query amplification whose remote-query count scales with the number of cards examined.

This is a performance and scaling defect, not evidence that ReviewEvent chronology or persistence correctness is wrong.

## Objective

Replace avoidable per-card ReviewEvent history query amplification with a bounded history-retrieval contract suitable for multi-card application workflows.

The solution must preserve ReviewEvent correctness while reducing the number of persistence reads required by Review, Library, and Insights workloads.

## Required invariants

1. ReviewEvent evidence remains immutable.
2. Existing ReviewEvent chronology semantics remain deterministic.
3. Per-card history ordering remains equivalent to the current repository contract.
4. Owner isolation remains unchanged.
5. Pending/failed ReviewEvent application semantics remain correct.
6. Review scheduling behavior must not change merely because event retrieval is batched or grouped differently.
7. Library and Insights outputs must remain behaviorally equivalent.
8. Backup/export/restore behavior must remain unchanged.
9. In-memory and Firestore repository behavior must remain semantically aligned.
10. Offline/cache behavior must be characterized before implementation assumptions are frozen.
11. The design must avoid replacing O(cards) queries with an unbounded owner-wide read whose cost merely moves elsewhere.
12. Any Firestore query/index requirement must be explicit and locally verified before deployment is considered.

## Design questions to resolve before implementation

- What exact chronology and tie-breaking contract does `ReviewEventRepository.listForCard()` guarantee?
- Which Review, Library, and Insights workflows require histories for multiple cards simultaneously?
- Can those workflows share one bounded multi-card repository primitive?
- What practical Firestore query fan-in limits apply to the chosen design?
- Should retrieval use chunked multi-card queries, an owner-scoped time window, a derived materialized structure, or another bounded strategy?
- How should local pending/failed ReviewEvents be overlaid on batched repository results in ReviewService?
- Which existing Firestore indexes are sufficient and which, if any, would need a repository change?
- How will query-count regression tests prove that the N+1 pattern is actually removed?

No implementation strategy is authorized by registration alone.

## Acceptance boundary

WORK-015 may be considered complete only when:

- a focused RED characterization demonstrates the current query amplification;
- the chosen repository/application design has an explicit bounded-query contract;
- Library no longer performs one persistent ReviewEvent history query per card for its aggregate workflow;
- Insights no longer performs one persistent ReviewEvent history query per card for its aggregate workflow;
- applicable Review routing/context paths are converted where doing so preserves ReviewService pending/failed-event authority;
- per-card chronology remains equivalent to the existing contract;
- in-memory parity is covered;
- Firestore emulator coverage verifies the new retrieval behavior;
- query-count/scaling regression coverage proves the improvement rather than merely testing returned values;
- existing review, library, insights, backup, restore, and security-rule regressions remain green;
- full web-release verification passes.

## Explicitly out of scope

- changing FSRS mathematics or scheduling policy;
- changing ReviewEvent schema or historical ReviewEvents;
- deleting, compacting, or rewriting existing ReviewEvents;
- changing ReviewEvent immutability/security semantics unless a query-only index/rule dependency is independently demonstrated;
- WORK-014 import uniqueness behavior;
- MSR-08 Library accessibility work;
- MSR-09 viewport/mobile zoom work;
- MSS-01 source URL protocol hardening;
- MSS-02 browser backup resource-exhaustion work;
- backup/restore redesign;
- Firebase production deployment;
- billing, Storage enablement, or other cloud-product changes.

## Safety

Repository and emulator work may proceed only after the bounded design is understood.

No Firebase deployment, production-data mutation, billing change, Storage enablement, historical migration, ReviewEvent rewrite, or unrelated persistence redesign is authorized by this work item.

## Initial next step

Start the governed task branch and perform read-only reconnaissance of:

- ReviewEvent repository interfaces and implementations;
- Firestore `listForCard()` query shape and ordering;
- ReviewService history-overlay semantics;
- Library and Insights aggregation loops;
- existing indexes and emulator tests;
- current query-count observability available in tests.

Stop at the design boundary before implementation.
