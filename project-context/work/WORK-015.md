# WORK-015 - ReviewEvent History Query Scaling

Status: IN_PROGRESS

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

## Start checkpoint

WORK-015 started from canonical registration head:

`772fd9eceb191ec62a8be54aa37385b2d1d2c246`

Task branch:

`task/work-015-reviewevent-query-scaling-v1`

The first phase is read-only query-contract reconnaissance.

No batching mechanism, new repository API, Firestore query shape, index change, cache architecture, or application implementation is selected by this checkpoint.

The design boundary remains:

1. establish exact current per-card chronology semantics;
2. identify every multi-card workflow producing query amplification;
3. understand ReviewService pending/failed-event overlays;
4. characterize Firestore query/index/offline constraints;
5. determine how query-count improvement can be measured deterministically;
6. stop before implementation until the bounded replacement contract is selected.

## Selected multi-card retrieval design

The read-only query-contract reconnaissance established the following current behavior:

- `ReviewEventRepository.listForCard(cardId)` is the persistent single-card history primitive;
- Firestore orders card history by `reviewTimestamp ASC`, then immutable ReviewEvent `id ASC`;
- the in-memory repository implements the same ordering;
- Library aggregate loading calls `listForCard()` once for each card;
- Insights aggregate loading calls `listForCard()` once for each active card;
- `ReviewService.syncDayContext()` calls card history once per card;
- `ReviewService.getNextReview()` subsequently calls card history again for candidate reconciliation;
- ReviewService overlays in-process pending ReviewEvents on repository history;
- backup/snapshot/restore uses the separate owner-wide `list()` contract and must remain unchanged;
- the existing Firestore composite index already covers `cardId`, `reviewTimestamp`, and `id`.

### Repository contract

Add a bounded multi-card history primitive:

`listForCards(cardIds: readonly string[]): Promise<Map<string, ReviewEvent[]>>`

Required semantics:

1. duplicate input card IDs are deduplicated before persistence work;
2. every requested card ID is represented in the returned map, including cards with zero events;
3. each card history preserves exact repository chronology:
   `reviewTimestamp ASC`, then event `id ASC`;
4. the input array is never mutated;
5. empty input performs zero persistence queries;
6. `listForCard()` remains available for true single-card workflows and compatibility;
7. `list()` remains unchanged for complete backup/snapshot workflows.

### Firestore strategy

The Firestore implementation will use bounded chunked `in` queries over `cardId`.

Conservative query chunk size:

`10` unique card IDs per Firestore query.

For each chunk:

- filter with `where('cardId', 'in', chunk)`;
- order by `reviewTimestamp ASC`;
- then order by immutable event `id ASC`;
- group the returned globally ordered events by `cardId`.

Because a given card ID appears in exactly one deduplicated chunk, all events for that card come from one query and preserve the existing per-card chronology directly.

Physical persistent query count therefore scales as:

`ceil(uniqueCardIds / 10)`

with zero queries for empty input.

The design deliberately does NOT replace per-card queries with an unbounded owner-wide ReviewEvent scan.

### Index position

The existing production index:

- `cardId ASC`
- `reviewTimestamp ASC`
- `id ASC`

matches the intended multi-card query shape.

No index mutation is selected at this checkpoint.

The emulator must characterize the actual multi-card query before implementation is accepted. If the current index/query assumption fails, implementation must stop and the design must be revised rather than silently changing deployment configuration.

### Application routing

Library:

- `listKnowledgeItems()` performs one logical `listForCards()` request for its complete card set;
- `getKnowledgeItem()` performs one logical `listForCards()` request for that item's card set;
- reconciliation behavior and error reporting remain unchanged.

Insights:

- `getInsights()` performs one logical `listForCards()` request for active cards;
- stage, retrievability, reviewed-today, and weak-area calculations remain unchanged.

Review:

- add a multi-card ReviewService history helper that obtains repository histories through `listForCards()`;
- overlay the existing in-process `pendingEvents` by immutable event ID;
- preserve current pending-write authority;
- preserve failed-event handling;
- preserve deterministic history ordering;
- `getNextReview()` loads multi-card history once and reuses the same histories for both current-day context derivation and candidate reconciliation;
- direct `syncDayContext()` performs one logical multi-card history load when invoked independently;
- existing active-card live observation through `observeForCard()` remains unchanged;
- true single-card `getEventsForCard()` remains available.

This avoids the current duplicate history traversal inside `getNextReview()`.

### Query-scaling verification

Regression coverage must prove both logical and physical scaling properties.

Application-level tests:

- Library aggregate loading must call `listForCards()` once and must not call `listForCard()` per card;
- Insights aggregate loading must call `listForCards()` once and must not call `listForCard()` per card;
- `ReviewService.getNextReview()` must perform one logical multi-card history load for all candidate/day-context work;
- direct `syncDayContext()` must perform one logical multi-card history load.

Repository-level tests:

- empty IDs -> zero chunks;
- 1..10 unique IDs -> one chunk;
- 11..20 unique IDs -> two chunks;
- duplicates do not increase chunk count;
- Firestore emulator proves multi-card retrieval and per-card chronology;
- cards with no events are returned with empty histories;
- in-memory implementation has equivalent grouped-history behavior.

The chunking transformation will be isolated in deterministic code so its query-count scaling can be tested without relying on opaque emulator network counters.

### Explicit non-goals

This design does not authorize:

- an owner-wide history read for normal Review/Library/Insights aggregation;
- ReviewEvent schema changes;
- historical event migration or compaction;
- scheduling-policy or FSRS changes;
- changes to `observeForCard()`;
- backup/restore changes;
- production Firestore deployment;
- security-rule changes unless later evidence proves they are necessary;
- unrelated Firestore index changes.

The next boundary is RED characterization plus Firestore-emulator query-shape proof. Production implementation starts only after those characterizations support this design.
