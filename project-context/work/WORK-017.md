# WORK-017 - Viewport User-Scaling Accessibility

Status: REGISTERED / NOT_STARTED

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
