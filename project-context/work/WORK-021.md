# WORK-021 - Production Baseline and Field Observation Intake

Status: COMPLETE / PROMOTED

Base: `e48c175e281b3a4f4e481905f6561fa56bf71d09`

Type: documentation / governance maintenance

## Objective

Bring the durable project handoff documentation up to the current production baseline and establish a lightweight intake mechanism for bugs, usability problems, minor improvements, and operational observations discovered during normal MindSpark use.

## Production baseline captured

Canonical source:

`e48c175e281b3a4f4e481905f6561fa56bf71d09`

Live GitHub Pages branch:

`b3a6c4448f4a52b7ba7e140275400bf8e1966437`

Live primary application asset:

`assets/index-W4d2R7Dg.js`

Current verified release posture:

- canonical `main == origin/main` was clean before this documentation update;
- MindSpark PWA is live at the canonical GitHub Pages site;
- current configured production PWA artifact verification: 9 / 9 PASS;
- current ordinary web suite baseline: 79 files / 566 tests PASS;
- production Firebase project: `mindspark-b8-test`;
- Google Authentication production sign-in was manually smoke-tested successfully;
- owner-bound Firestore rules and required indexes are deployed;
- Firebase Storage remains undeployed and is not required for normal text/code/math use;
- WORK-020 Backup Due Indicator UX is live;
- the live WORK-020 release uses the due-only compact backup icon;
- no Firebase deployment, Storage deployment, or production-data mutation occurred during the WORK-020 Pages-only release.

## Field-observation intake

A new `project-context/field-observations/` layer records issues noticed during real application use before they necessarily become bounded WORK items.

Observation lifecycle:

`OBSERVED -> CONFIRMED -> PROMOTED_TO_WORK -> RESOLVED`

An observation may instead become `CLOSED` when it is not reproducible, no longer relevant, duplicate, or deliberately declined.

Field observations:

- are orientation and triage records;
- do not themselves authorize implementation;
- do not replace source inspection or reproduction;
- do not consume a WORK number until implementation is actually warranted;
- should link to a WORK item once promoted;
- must preserve evidence and uncertainty explicitly.

## Scope

Documentation/governance only.

No application source, tests, dependencies, Firebase configuration, cloud state, backup format, production data, or deployment behavior is changed.

## Verification

- canonical repository authority checked before editing;
- documentation-only path scope enforced;
- `git diff --check` required;
- final worktree expected clean after commit;
- no push is performed without separate authorization.

## Completion boundary

The documentation catch-up was promoted and synchronized to canonical `main` / `origin/main` at:

`1980e1fdbb9fe91609269b9de8e3ea4c9b1baeb9`

The production handoff and field-observation intake are therefore canonical.

`ACTIVE_WORK` remains `NONE`. WORK-019 remains reserved for the separate DISC-002 MSS-02 browser backup resource-exhaustion work and has not been started.

No application source, tests, dependencies, Firebase configuration, cloud state, production data, or deployment behavior changed as part of WORK-021.

WORK-021 is COMPLETE / PROMOTED.
