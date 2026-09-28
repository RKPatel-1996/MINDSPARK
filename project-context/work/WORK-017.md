# WORK-017 - Viewport User-Scaling Accessibility

Status: COMPLETE_PENDING_PROMOTION

Base: `67dac991cab3c793dd952c4bacb49f1e07998944`

Planned branch: `task/work-017-viewport-scaling-v1`

Derived from: `DISC-002` MSR-09

## Problem

Canonical `index.html` currently declares:

`width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no`

The `maximum-scale=1.0` and `user-scalable=no` directives disable normal browser pinch/user zoom on mobile-capable clients.

DISC-002 records this as MSR-09: mobile viewport metadata disables user scaling.

## Current evidence

Post-WORK-016 canonical revalidation confirmed that the restrictive viewport declaration remains present in `index.html`.

This is a confirmed current defect rather than a historical-only finding.

No implementation change has yet been authorized by WORK-017.

## Bounded objective

Establish and verify an accessibility-safe viewport metadata contract that:

- preserves responsive device-width behavior;
- preserves the intended initial scale;
- does not disable user zoom;
- does not introduce an artificial maximum zoom restriction;
- remains compatible with the existing PWA build and installability contract.

## Required reconnaissance

Before production mutation:

- confirm every authoritative viewport declaration in the repository;
- identify existing tests or build-artifact checks coupled to viewport metadata;
- confirm whether PWA/mobile configuration duplicates or overrides the HTML viewport contract;
- characterize the current declaration with a permanent RED regression;
- verify the smallest valid replacement contract before implementation.

## Expected implementation boundary

The anticipated implementation is intentionally narrow.

Likely affected production surface:

- `index.html`.

Tests may be added or updated as required to make the viewport accessibility contract permanent.

The exact production diff is not frozen until reconnaissance and RED characterization complete.

## Acceptance contract

WORK-017 may be considered technically complete only when evidence demonstrates that:

- the canonical viewport declaration retains `width=device-width`;
- the canonical viewport declaration retains an appropriate initial scale;
- `user-scalable=no` is absent;
- no `maximum-scale=1` or equivalent one-times zoom cap remains;
- no duplicate authoritative viewport declaration reintroduces zoom blocking;
- relevant viewport/PWA tests pass;
- `npm run verify:web-release` passes;
- the production PWA build and artifact verification pass;
- no unrelated responsive-layout redesign is introduced.

## Out of scope

Do not expand WORK-017 into:

- MSR-08 Library keyboard/modal/focus accessibility closure;
- MSS-02 backup resource-exhaustion profiling or redesign;
- general responsive-layout redesign;
- typography redesign;
- touch-target redesign;
- global accessibility remediation unrelated to viewport zoom;
- navigation redesign;
- PWA manifest redesign unless reconnaissance proves a direct viewport dependency;
- Firebase rules or indexes;
- persisted-data migration;
- backup/restore changes;
- production Firebase deployment;
- Storage enablement;
- billing changes.

## Safety

This is a local source, test, and build-verification work item.

No Firebase deployment, production-data mutation, billing change, Storage enablement, migration, task-branch push, or unrelated cloud mutation is authorized.

## Registration boundary

WORK-017 is registered but implementation has not started.

The next boundary is to create `task/work-017-viewport-scaling-v1`, record the start checkpoint, and perform focused read-only reconnaissance before establishing permanent RED evidence.

## Start checkpoint

WORK-017 has started on `task/work-017-viewport-scaling-v1`.

Current phase: RECONNAISSANCE.

Before permanent RED characterization or production modification, the task will verify:

- every authoritative viewport declaration;
- whether PWA/mobile configuration duplicates or overrides viewport behavior;
- existing viewport/build-artifact test authority;
- the exact current zoom-blocking contract;
- the smallest accessibility-safe replacement contract.

No production viewport mutation is authorized at this checkpoint.

No Firebase deployment, production-data mutation, Storage enablement, billing change, or task-branch push is authorized.

## Frozen viewport contract

Focused reconnaissance established the following WORK-017 implementation contract.

### Authority

The canonical browser viewport declaration is the single `<meta name="viewport">` entry in repository-root `index.html`.

The Android `viewportWidth` and `viewportHeight` values found under launcher vector-drawable resources are graphics coordinate-system attributes and are not browser viewport policy.

No PWA manifest, Vite PWA configuration, React runtime surface, or other tracked browser source duplicates or overrides the HTML viewport declaration.

### Required viewport behavior

The canonical source viewport contract must:

- contain exactly one browser viewport declaration;
- retain `width=device-width`;
- retain `initial-scale=1.0`;
- omit the `user-scalable` directive;
- omit the `maximum-scale` directive.

The intended canonical content is therefore:

`width=device-width, initial-scale=1.0`

This removes the current browser zoom prohibition without redesigning responsive layout behavior.

### Build contract

The fresh production build must preserve the same accessibility-safe viewport semantics in generated `dist/index.html`.

Existing PWA manifest, installability, service-worker, relative-base, and artifact contracts remain unchanged.

### Permanent RED authority

Permanent RED characterization will extend:

- `src/v2/__tests__/pwaManifest.test.ts` for source `index.html`;
- `src/v2/__tests__/pwaBuildArtifacts.test.ts` for fresh generated `dist/index.html`.

Both contracts must prove:

- exactly one viewport meta tag;
- `width=device-width`;
- `initial-scale=1.0`;
- no `user-scalable` directive;
- no `maximum-scale` directive.

The source regression must fail against the current canonical declaration before production implementation.

A fresh PWA build-artifact verification must independently fail against the same current declaration before production implementation.

### Expected production boundary

If permanent RED confirms the reconnaissance, the expected production mutation is limited to the viewport-content line in repository-root `index.html`.

No manifest change, Vite configuration change, React change, Android-native change, Firebase change, responsive-layout redesign, or unrelated accessibility modification is authorized.

## Permanent RED checkpoint

Design-contract checkpoint:

`c4228c3598e2147abf471596aa325074c947477e`

Permanent RED test checkpoint:

`6e3a396dfbdbcf7b8d2cf528db87001722fe5884`

RED evidence:

- TypeScript typecheck passed with the permanent regressions present;
- source pwaManifest.test.ts failed specifically on the new user-scaling viewport contract against the current index.html;
- a fresh production PWA build completed and the new pwaBuildArtifacts.test.ts viewport contract failed against generated dist/index.html;
- the current failure is therefore demonstrated both at source authority and built-artifact authority;
- index.html remained unchanged while RED evidence was established;
- no manifest, Vite, React, Android-native, Firebase, or other production source was modified.

The frozen production implementation boundary is now one viewport-content change in repository-root index.html.

The required target content is:

`width=device-width, initial-scale=1.0`

The next boundary is the minimal production implementation followed by targeted GREEN, fresh-build artifact GREEN, and full web-release verification.

## Completion checkpoint

WORK-017 implementation is technically complete.

Implementation commit:

`0c8c79e39c6179e14d86e6722bb58d4348cf0e0d`

Completed behavior:

- repository-root `index.html` remains the sole browser viewport authority;
- viewport content is now `width=device-width, initial-scale=1.0`;
- `user-scalable` is absent;
- `maximum-scale` is absent;
- no PWA manifest, Vite configuration, React runtime, Android-native, Firebase, responsive-layout, or unrelated accessibility behavior was changed.

Permanent contract evidence:

- source `pwaManifest.test.ts` verifies exactly one viewport declaration, preserves `width=device-width` and `initial-scale=1.0`, and rejects `user-scalable` and `maximum-scale`;
- fresh-build `pwaBuildArtifacts.test.ts` verifies the same contract in generated `dist/index.html`;
- permanent RED was demonstrated against both source and fresh production-build output before implementation;
- targeted source GREEN: 1 file / 3 tests PASS;
- fresh-build artifact GREEN: 1 file / 9 tests PASS;
- full ordinary web-release suite: 79 files / 559 tests PASS;
- full `verify:web-release`: PASS;
- production PWA build and service-worker generation: PASS.

Independent completed-implementation review:

- complete five-commit bounded branch reviewed from canonical base `5ab58e5639a54fb9b6420895910f4fad54c1c4ae` through implementation head `0c8c79e39c6179e14d86e6722bb58d4348cf0e0d`;
- whole-branch topology and diff checks: PASS;
- implementation commit confirmed as `index.html` only, 1 insertion / 1 deletion;
- single browser viewport authority confirmed;
- permanent source and build regressions confirmed;
- independent source contract: 1 file / 3 tests PASS;
- independent TypeScript typecheck: PASS;
- independent fresh production build: PASS;
- independent artifact contract: 1 file / 9 tests PASS;
- built `dist/index.html` confirmed to preserve the unrestricted viewport contract;
- no substantive blocker remains.

No Firebase deployment, production cloud mutation, persisted-data migration, Storage enablement, billing change, responsive-layout redesign, task-branch push, or unrelated accessibility work occurred.

Status is `COMPLETE_PENDING_PROMOTION`.

The next required boundary is an independent completed-branch review of the full WORK-017 change set and completion governance evidence before any promotion to canonical `main`.
