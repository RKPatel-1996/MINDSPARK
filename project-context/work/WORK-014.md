# WORK-014 - Atomic Import Uniqueness

Status: COMPLETE_PENDING_PROMOTION

Base: `3f14ee572167a3357178cf7fd2b075e70e270f8d`

Planned branch: `task/work-014-atomic-import-uniqueness-v1`

Derived from: `DISC-002` MSR-03 and post-WORK-013 revalidation

## Aim

Close the confirmed simultaneous-import race in MindSpark's normal knowledge-import workflow.

The current duplicate rule is based on the normalized fingerprint:

`domainId :: topicId :: subtopicId :: title`

but duplicate detection currently occurs as a read-before-write application check. Two concurrent identical imports can therefore both observe no existing duplicate, generate independent opaque IDs, and persist separate knowledge bundles.

WORK-014 must move authoritative duplicate exclusion to the persistence boundary so simultaneous equivalent imports cannot both become authoritative knowledge.

## Verified starting condition

Current canonical behavior at registration:

1. `computeItemFingerprint()` defines the existing normalized duplicate identity.
2. `inspectImportDraft()` lists current knowledge and performs an application-level duplicate search.
3. `importDraftPayload()` performs that inspection before transforming the draft.
4. `transformDraftToDomain()` generates fresh opaque KnowledgeItem and ReviewCard IDs.
5. normal import then calls `createKnowledgeBundle()` / `createBundle()`.
6. `KnowledgeRepository` has no uniqueness-aware bundle-create contract.
7. Firestore `createBundle()` uses a write batch for item + cards but performs no duplicate-fingerprint precondition.
8. Firestore `createKnowledgeBundle()` delegates directly to `createBundle()`.
9. in-memory bundle creation guards only against duplicate item IDs.
10. no durable fingerprint uniqueness/index authority currently exists.
11. existing tests cover sequential duplicate detection and a duplicate discovered between preview and final import, but not two truly simultaneous identical imports.
12. restore uses a separate ID-preserving preconditioned transaction workflow and must not be silently coupled to normal-import fingerprint semantics.
13. MindSpark uses persistent Firestore local cache and explicit offline/pending-write state; import uniqueness must therefore be designed with the existing offline-first architecture in mind.

## Scope

### A. Persistence-level uniqueness contract

Introduce the smallest repository-level contract necessary to make the existing import fingerprint authoritative at persistence time.

The contract must:

- accept the normalized import fingerprint together with the KnowledgeItem/Card bundle or equivalent authoritative inputs;
- make duplicate exclusion part of the persistence operation rather than relying only on a prior list/read;
- distinguish duplicate rejection from unrelated persistence failure;
- return or expose the existing authoritative KnowledgeItem identity when feasible;
- have equivalent observable semantics in Firestore and in-memory repositories;
- preserve atomic KnowledgeItem + ReviewCard bundle behavior.

The exact persistence mechanism must be justified from current repository and Firestore semantics.

Do not assume that a Firestore transaction is automatically correct if it would unnecessarily break the established offline-first behavior.

### B. Firestore uniqueness authority

Implement a Firestore-safe uniqueness authority for normal imports.

Required properties:

- two competing imports with the same normalized fingerprint cannot both become authoritative knowledge bundles;
- different fingerprints remain independently importable;
- failure/rejection cannot leave a partial KnowledgeItem/Card bundle;
- uniqueness authority is owner-scoped;
- authority survives reloads and multiple devices;
- security rules must enforce any new immutable uniqueness record or collection introduced by the design;
- client-generated opaque KnowledgeItem IDs may remain opaque unless a design change is specifically justified;
- no global cross-user uniqueness is introduced.

If the mechanism introduces a dedicated fingerprint/claim document:

- its identity must be deterministic for the normalized fingerprint without exposing unsafe path characters;
- it must map unambiguously to the authoritative KnowledgeItem;
- it must be immutable or otherwise protected strongly enough that a losing concurrent writer cannot retarget it;
- bundle and claim correctness must be enforced atomically.

### C. In-memory parity

The in-memory repository used by tests and ephemeral development must enforce the same logical duplicate contract.

A true concurrent regression test must demonstrate that two simultaneous equivalent imports result in:

- exactly one authoritative import;
- exactly one duplicate outcome;
- one KnowledgeItem bundle only;
- no duplicate ReviewCard bundle caused by the losing import.

### D. Application behavior

Preserve the existing preview duplicate check as an early UX optimization, but it must no longer be the correctness authority.

Final import must correctly translate persistence-level duplicate rejection into the existing duplicate result/error semantics.

A duplicate detected only at persistence time must:

- not clear or corrupt the user's pending import unexpectedly;
- report the existing authoritative item when the repository contract provides it;
- not trigger a false successful refresh/import state.

### E. Offline characterization

Before choosing the Firestore mechanism, add or run focused characterization sufficient to establish its behavior with MindSpark's persistent local-cache model.

WORK-014 must document whether normal import while fully offline is:

- supported with eventual uniqueness enforcement;
- deliberately blocked pending connectivity;
- or unchanged from the current practical behavior.

Do not silently regress an actually supported offline import workflow.

### F. Verification

Add focused regression coverage for at least:

1. sequential duplicate import remains rejected;
2. case/whitespace normalization remains unchanged;
3. different fingerprint remains accepted;
4. simultaneous identical imports cannot both succeed;
5. losing concurrent import produces the defined duplicate result;
6. no orphan/duplicate cards remain from the losing import;
7. Firestore persistence uses the new authoritative uniqueness mechanism;
8. owner isolation remains intact;
9. security rules protect any new uniqueness authority;
10. existing bundle atomicity remains intact;
11. preview-vs-final-import duplicate race remains handled correctly;
12. restore semantics remain unchanged.

## Acceptance

WORK-014 is complete only when:

- MSR-03 is closed by a persistence-level invariant rather than another application-only precheck;
- exactly one equivalent import can become authoritative under true contention;
- losing contenders are represented as duplicate outcomes rather than successful imports;
- item/card bundle atomicity is preserved;
- the existing fingerprint normalization rule remains stable unless a separately justified migration is required;
- Firestore and in-memory semantics agree;
- owner isolation is preserved;
- restore/import boundaries remain explicit;
- offline behavior is characterized and not silently degraded;
- focused tests pass;
- relevant existing import tests pass;
- repository/persistence tests pass;
- applicable Firestore emulator/rules tests pass if rules or Firestore persistence semantics change;
- `npm run typecheck` passes;
- `npm run verify:web-release` passes;
- `git diff --check` passes.

## Out of scope

Do not expand WORK-014 into:

- MSR-04 query/scaling redesign;
- MSR-08 accessibility work;
- MSR-09 viewport/mobile zoom work;
- MSS-01 source URL protocol hardening;
- MSS-02 archive resource-exhaustion work;
- general KnowledgeItem deduplication or fuzzy matching;
- merging historical duplicates already present in user data;
- changing the existing duplicate fingerprint definition without a demonstrated requirement;
- deterministic replacement of every domain ID;
- backup-format redesign;
- restore identity heuristics;
- ReviewEvent semantics;
- FSRS or scheduler behavior;
- general repository redesign;
- dependency upgrades;
- Firebase deployment;
- production-data mutation;
- Storage enablement;
- billing changes.

## Governance boundary

Live repository state is authoritative.

Registration does not authorize Firebase deployment, production-data mutation, Storage enablement, billing changes, or broad persistence redesign.

Before implementation:

1. create the bounded WORK-014 branch from the verified registration commit;
2. re-read `AGENTS.md`;
3. establish a RED simultaneous-identical-import characterization;
4. characterize the candidate Firestore uniqueness mechanism, including offline implications;
5. choose and document the smallest persistence contract satisfying the acceptance criteria;
6. implement in-memory parity first or alongside Firestore behavior;
7. preserve restore semantics;
8. run focused tests and applicable emulator/rules verification;
9. run the full web-release gate before completion governance.
## Selected uniqueness design

The pre-implementation Firestore emulator characterization confirmed that WORK-014 can close MSR-03 without replacing normal import with an online-only Firestore transaction.

### Authority

Normal-import uniqueness will use an owner-scoped deterministic claim document:

`users/{uid}/knowledgeImportClaims/{claimId}`

where `claimId` is the lowercase hexadecimal SHA-256 digest of the already-normalized import fingerprint.

The existing fingerprint definition remains unchanged:

`domainId :: topicId :: subtopicId :: title`

after the existing trim/lowercase normalization performed by `computeItemFingerprint()`.

The claim document will contain only:

- `id`;
- `knowledgeItemId`;
- `schemaVersion: 1`.

The normalized title/fingerprint will not be duplicated as plaintext in the claim document.

### Repository contract

`KnowledgeRepository` will gain an explicit uniqueness-aware normal-import persistence operation.

Conceptually:

`createUniqueKnowledgeBundle(fingerprint, item, cards)`

returns one of:

- created;
- duplicate with the authoritative existing `knowledgeItemId`.

The existing `createBundle()` / `createKnowledgeBundle()` behavior remains available for workflows that are not governed by normal-import fingerprint uniqueness.

Normal import will use the uniqueness-aware operation as its final correctness authority.

The existing preview/list-based duplicate check remains an early UX optimization only.

### Firestore implementation

The Firestore repository will:

1. derive the deterministic SHA-256 claim ID from the normalized fingerprint;
2. prepare the claim document;
3. atomically write the claim, KnowledgeItem, and all ReviewCards in one Firestore write batch;
4. rely on create-only immutable security rules for the claim authority;
5. on a rejected competing claim, read the existing authoritative claim;
6. return a duplicate result only when the corresponding claim exists and identifies the authoritative KnowledgeItem;
7. rethrow unrelated persistence/rules failures rather than misclassifying them as duplicates.

A losing competing batch must leave no KnowledgeItem or ReviewCard residue.

### Security rules

`knowledgeImportClaims` will be owner-scoped.

Rules will permit owner reads and valid creates only.

Updates and deletes will be denied.

Claim creation will validate:

- the claim document ID and stored `id` agree;
- the ID uses the selected SHA-256 claim format;
- `knowledgeItemId` is an opaque UUID;
- `schemaVersion == 1`;
- only the expected fields are present.

Where supported cleanly by the existing rules architecture, the rule should additionally require the referenced KnowledgeItem to exist in the atomic post-write state.

### In-memory parity

The in-memory repository will maintain equivalent claim authority and return the same created/duplicate result contract.

Claim acquisition plus KnowledgeItem/Card insertion must behave atomically from the perspective of concurrent callers.

Rollback behavior must preserve the existing bundle-atomicity guarantee.

### Application behavior

`importDraftPayload()` will preserve its current inspection/preflight behavior.

After transformation it will call the uniqueness-aware persistence operation.

A persistence-level duplicate will be translated into the existing `ImportDraftResult` duplicate shape, including the authoritative existing KnowledgeItem ID.

`ApplicationContext` therefore keeps its existing `DuplicateImportError` behavior and does not refresh/report a successful import for the losing contender.

### Offline contract

Emulator characterization established:

- a unique atomic claim/item/card batch submitted while offline remains unsettled until reconnect and then succeeds;
- a conflicting claim batch submitted while offline remains unsettled until reconnect, then rejects;
- the rejected losing bundle is rolled back atomically;
- a normal import therefore must not report authoritative success while its uniqueness claim is still unresolved offline.

This preserves the current practical awaited-write semantics rather than introducing an online-only transaction requirement.

### Characterization evidence

RED application-level checkpoint:

`f57efe855b7bbf1495f3eb669445910ceacae620`

The deterministic simultaneous-import regression produced two successful imports under the old implementation, confirming MSR-03.

A temporary Firestore-emulator characterization then passed 3 / 3 tests covering:

1. concurrent same create-only claim -> exactly one complete winning bundle;
2. unique offline claim batch -> pending until reconnect, then complete;
3. conflicting offline claim batch -> pending until reconnect, then rejected with complete losing-bundle rollback.

The temporary characterization file was removed after execution and the repository returned to a clean state.

### Implementation order

1. add the deterministic import-claim ID utility;
2. add the repository result/operation contract;
3. implement in-memory uniqueness parity and turn the RED test GREEN;
4. implement Firestore claim-batch persistence;
5. add `knowledgeImportClaims` security rules;
6. add focused Firestore/rules contention and owner-isolation tests;
7. route normal import through the new persistence authority;
8. verify preview/final-race behavior and application duplicate translation;
9. verify restore behavior remains unchanged;
10. run focused tests, emulator/rules tests, typecheck, full web-release verification, and `git diff --check`.

## Completion checkpoint

Implementation checkpoint:

`bd91c863a6424fa3f75e6643c4144886adc9d28f`

Verified completion state:

- persistence-level normal-import uniqueness is mandatory across all repository adapters;
- the prior non-unique normal-import fallback has been removed;
- in-memory and Firestore implementations enforce the same created/duplicate contract;
- Firestore uses an owner-scoped deterministic SHA-256 claim written atomically with the KnowledgeItem/Card bundle;
- claim security rules are create-only, immutable, owner-scoped, shape-validated, and require the referenced KnowledgeItem in the atomic post-write state;
- simultaneous equivalent imports resolve to exactly one authoritative bundle;
- losing contenders return the authoritative existing KnowledgeItem identity;
- losing Firestore bundles leave no item/card residue;
- offline unique imports remain pending until reconnect and then complete;
- offline conflicting imports remain pending until reconnect, then reject and roll back;
- restore remains architecturally separate from normal-import claim semantics;
- existing backup/restore emulator regressions remain covered by the Firebase verification gate;
- focused import/adapter regressions passed;
- TypeScript typecheck passed;
- Firebase/Storage emulator and security-rules verification passed;
- full `npm run verify:web-release` passed;
- `git diff --check` passed;
- implementation worktree was clean after verification.

No Firebase deployment, production-data mutation, Storage enablement, billing change, or task-branch push occurred.

WORK-014 is complete on the task branch and awaits independent review before promotion to canonical `main`.
