# WORK-014 - Atomic Import Uniqueness

Status: IN_PROGRESS

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
