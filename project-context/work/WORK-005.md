# WORK-005 - B8 Stage 2 Core Cloud Readiness

Status: ACTIVE

## Aim

Verify MindSpark core cloud operation on Firebase Spark using Authentication + Firestore.

## Core scope

- Firebase Authentication
- Cloud Firestore
- single-owner Firestore rules
- browser/PWA persistence
- cross-owner rejection
- current text/code/math workflows

## Separate optional scope

Firebase Storage and legacy-media workflows are optional and are not prerequisites for core MindSpark operation.

## Safety

Target project: `mindspark-b8-test`

No Storage enablement.
No billing changes.
Cloud mutations and deployments require explicit authorization.

## Verified implementation

- Spark-compatible Firestore-only production preflight added.
- Firestore-only emulator rule verification path added.
- Existing Storage-aware production paths retained separately for legacy-media validation.
- Normal application composition does not require Firebase Storage.
- Local Firebase configuration keeps Storage disabled by omitting the Storage bucket setting.
- Implementation checkpoint: `1a3063d` (`feat(firebase): add Spark core deployment path`).

## Verified cloud evidence

- Google Authentication provider enabled.
- One controlled owner account successfully authenticated.
- Generated owner-bound Firestore rules verified locally and deployed only to `mindspark-b8-test`.
- One controlled KnowledgeItem plus one review card successfully persisted to real Cloud Firestore.
- Firestore console inspection confirmed the durable owner-scoped KnowledgeItem.
- Required `reviewEvents` composite indexes already existed in `firestore.indexes.json`; they were deployed after explicit authorization.
- After index build completion, a hard reload successfully read the cloud item back into Library.
- Library displayed 1 item / 1 card and Review loaded the corresponding card with synced state.
- Firebase Storage remained disabled and untouched.
- No billing changes were made.

## Cloud-read defect discovered and repaired

The first real cloud reload exposed two independent issues:

1. Library could begin a read before authenticated repository bootstrap completed.
2. Required Firestore composite indexes existed in Git but had not yet been deployed.

The index deployment resolved the Firestore query prerequisite.

Library now waits for authoritative bootstrap where required and prevents stale asynchronous loads from overwriting newer repository results, while preserving the existing unconfigured/read-only path.

Repair checkpoint:

`8aa3d7a` - `fix(library): wait for bootstrap before cloud reads`

Regression coverage:

- bootstrap/stale-load regression: PASS
- unconfigured/ephemeral gating: PASS
- full `verify:web-release`: PASS
- ordinary suite: 58 files / 433 tests PASS
- PWA artifact verification: 7 / 7 PASS
- `git diff --check`: PASS

## Remaining core acceptance

WORK-005 is not complete yet.

Still requiring explicit validation:

- real cross-owner Firestore rejection
- browser persistence / offline / reconnect behavior
- installed-PWA Firestore workflow
- text-only/current backup and restore against the controlled cloud environment

Any additional cloud mutation, second-user creation, restore execution, or deployment remains subject to explicit authorization.
