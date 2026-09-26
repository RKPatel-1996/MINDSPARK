# WORK-007 - Canonical Documentation Reconciliation + Capability Audit

Status: COMPLETE_PENDING_PROMOTION

Base: `9c91d6ea9779a27db59b6e840eb3c85e38228eb9`

Branch: `task/work-007-doc-reconciliation-v1`

## Aim

Reconcile MindSpark's authoritative current-reference documentation with canonical source and the verified state established through WORK-003 to WORK-006, while performing a bounded capability audit to identify genuine remaining product or technical gaps.

This work is documentation and audit only. It does not implement new product behavior.

## Scope A - Import contract reconciliation

Reconcile `docs/MINDSPARK_IMPORT_FORMAT.md` with canonical import and domain source.

Required corrections include:

- document all five supported review-card types:
  - `free_recall`
  - `flashcard`
  - `mcq`
  - `true_false`
  - `cloze`
- add the canonical Cloze draft shape and constraints;
- document optional ordered content blocks:
  - `text`
  - `code`
  - `math`
- ensure KnowledgeItem draft fields match the strict current schema;
- ensure examples and prose no longer state that only four card types exist;
- preserve strict-schema, taxonomy, controlled-tag, MCQ, and forbidden-field rules.

Source/schema authority must remain the implementation in `src/v2`, not older documentation.

## Scope B - Persistence and reconciliation documentation

Reconcile `docs/MINDSPARK_V2_PERSISTENCE.md` with current implemented behavior.

Required corrections include:

- remove stale wording that describes deterministic reconciliation as merely future work;
- preserve the event-sourced authority model;
- preserve immutable `ReviewEvent` semantics;
- accurately describe current deterministic reconciliation and replay;
- preserve scheduler-parameter-set and device-identity invariants.

## Scope C - Backup, B8, Firebase, and Storage posture

Reconcile current-reference documentation with verified WORK-005 state.

Required handling:

- current documentation must no longer claim that core browser/PWA cloud validation is still blocked or pending when WORK-005 verified it;
- document that core current operation uses Firebase Authentication + Firestore;
- document that Firebase Storage is disabled/optional for legacy media-bearing workflows and is not required for normal current text/code/math operation;
- preserve the distinction between core cloud readiness and optional media/Storage work;
- do not imply that public application deployment occurred when it did not.

Historical evidence must remain historical:

- `docs/MINDSPARK_B8_STAGE1_EVIDENCE.md` must not have its original Stage-1 observations rewritten as though later evidence existed at that time;
- instead, add an explicit later-status/supersession note pointing readers to the subsequent verified state.

## Scope D - README and deployment consistency

Review current-reference sections in:

- `README.md`
- `DEPLOYMENT.md`
- relevant architecture/persistence/import/backup documentation

Ensure they consistently describe:

- current core Firebase posture;
- optional legacy media support;
- current PWA/offline behavior;
- current verification/deployment boundaries;
- current source-of-truth hierarchy.

Do not broaden this into general prose rewriting.

## Scope E - Bounded capability audit

Inspect canonical source and authoritative documentation for genuine remaining gaps.

The audit must distinguish:

1. implemented capabilities with stale documentation;
2. intentionally deferred/non-priority capabilities;
3. historical limitations already superseded;
4. genuine unresolved product or technical gaps.

For each durable unresolved finding:

- create or update an appropriate `project-context/gaps/GAP-###.md` record;
- state evidence, impact, and proposed handling;
- do not implement the gap inside WORK-007.

Specific candidate to assess:

- production web bundle size / absence of deliberate application code splitting.

If confirmed as a genuine current technical gap, record it for later governed work rather than solving it in WORK-007.

## Acceptance

WORK-007 is complete only when:

- authoritative current-reference docs agree with canonical source on supported import shapes;
- all five review card types, including Cloze, are documented;
- ordered text/code/math blocks are documented;
- persistence documentation no longer calls implemented reconciliation future work;
- current backup/cloud documentation reflects verified WORK-005 core cloud status;
- historical B8 Stage-1 evidence remains historically accurate and clearly superseded where appropriate;
- README and deployment documentation are mutually consistent with current core/optional-media posture;
- the bounded capability audit is completed;
- genuine unresolved findings are recorded as durable GAP records;
- no unsupported product claims are introduced;
- documentation diffs pass `git diff --check`.

## Constraints

- Documentation and audit only.
- No product implementation.
- No dependency changes.
- No Firebase rules changes.
- No Firestore data mutation.
- No Firebase Storage enablement.
- No billing changes.
- No deployment.
- No FSRS or scheduler-semantic changes.
- Do not rewrite historical evidence to make old checkpoints appear current.
- Live source, schemas, tests, and canonical Git outrank stale documentation.

## Completion evidence

WORK-007 completed its registered documentation-reconciliation and bounded-audit scope on the feature branch.

Documentation reconciliation completed:

- AI import documentation now reflects the strict current schema;
- all five review-card types, including `cloze`, are documented;
- ordered `text`, `code`, and `math` content blocks are documented;
- persistence documentation describes reconciliation as implemented rather than future work;
- current cloud documentation reflects the verified Authentication + Firestore core path;
- Firebase Storage is documented as disabled/optional for legacy-media workflows rather than a core requirement;
- historical B8 Stage-1 evidence remains historically intact with an explicit later-status note;
- README, deployment, backup, persistence, and import documentation are mutually reconciled.

Capability audit findings:

- `GAP-002` - oversized single production JavaScript bundle - OPEN;
- `GAP-003` - production dependency security findings - OPEN;
- optional Firebase Storage / legacy media remains intentionally deferred and was not promoted as a current priority gap.

Measured GAP-002 baseline:

- production JavaScript bundle: approximately 1,930.59 kB minified;
- gzip size: approximately 527.27 kB;
- PWA precache: approximately 2,386.22 KiB;
- no deliberate application-level route/view lazy loading or manual chunk strategy was found.

Measured GAP-003 baseline:

- full npm audit: 15 findings - 9 moderate, 6 high, 0 critical;
- production-only npm audit: 5 findings - 2 moderate, 3 high, 0 critical;
- affected direct production dependencies include `react-router-dom` and `fflate`;
- no package upgrades or audit fixes were performed in WORK-007.

Final verification:

- scope boundary: PASS - documentation/project-context only;
- stale import-contract check: PASS;
- stale persistence check: PASS;
- stale current-cloud-status check: PASS;
- historical Stage-1 supersession note: PRESENT;
- TypeScript: PASS;
- ordinary Vitest suite: 62 files / 451 tests PASS;
- production build: PASS;
- PWA build-artifact suite: 7 / 7 PASS;
- `git diff --check`: PASS;
- final tracked worktree: CLEAN.

No product implementation, dependency change, Firebase mutation, Storage enablement, billing change, scheduler change, or deployment was performed.

Promotion to canonical `main` remains pending.
