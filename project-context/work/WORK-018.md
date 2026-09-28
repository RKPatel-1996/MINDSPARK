# WORK-018 - Library Keyboard and Inspector Accessibility

Status: IN_PROGRESS

Base: `a4aa2c3d1f344609db8c10c37e8705d2992de872`

Planned branch: `task/work-018-library-keyboard-accessibility-v1`

Derived from: `DISC-002` MSR-08

## Problem

The Library item-card and inspector interaction path does not currently provide an equivalent keyboard and screen-reader contract to its mouse interaction contract.

Reconnaissance confirmed:

- normal Library item cards are clickable `div` elements but outside Select mode expose no button role;
- normal cards expose no keyboard tab stop and no Enter/Space activation handler;
- Select mode adds partial button/selection semantics but does not establish one explicit keyboard activation contract shared with normal mode;
- the item inspector is visually modal but does not expose the corresponding dialog semantics;
- opening and closing the inspector has no explicit focus-entry/focus-restoration contract;
- existing Library tests establish mouse activation and inspector visibility but do not permanently enforce the missing keyboard/focus behavior.

## Objective

Establish one explicit, tested accessibility contract for Library item activation and the item inspector without redesigning the Library UI.

## Required behavior

- every interactive Library item card is keyboard reachable;
- normal-mode cards expose appropriate interactive semantics and an accessible name;
- Enter and Space activate the same normal-mode item-opening behavior as pointer activation;
- Select-mode keyboard activation toggles selection without opening the inspector and preserves the existing pending-operation safety boundary;
- the item inspector exposes modal dialog semantics and an accessible label/title relationship;
- opening the inspector moves focus into the inspector;
- closing the inspector through its Close control or the existing Escape path restores focus to the originating Library card when that card remains available;
- visible keyboard focus remains observable;
- existing pointer behavior, selection behavior, lifecycle behavior, filters, and responsive layout remain unchanged.

## Verification contract

Permanent regression coverage must demonstrate:

1. normal card keyboard focusability and semantics;
2. Enter activation opens the inspector;
3. Space activation opens the inspector without unintended page-style activation behavior;
4. Select-mode Enter/Space toggles selection rather than opening the inspector;
5. inspector dialog semantics;
6. focus entry on inspector open;
7. focus restoration to the originating card after close;
8. Escape closure preserves the same focus-restoration contract;
9. existing Select-mode and lifecycle regressions remain green;
10. full `verify:web-release` passes.

## Out of scope

- MSS-02 backup/archive resource-exhaustion work;
- broad Library visual redesign;
- taxonomy keyboard redesign;
- Import-dialog redesign;
- application-wide dialog framework replacement;
- unrelated WCAG remediation;
- Firebase rules, Storage, deployment, billing, or production-data changes.

## Current boundary

Registration only. No production implementation has begun.

Next: create the task branch, freeze the minimal interaction/focus design against current LibraryView structure, establish permanent RED tests, then implement the smallest production change.
## Start and reconnaissance checkpoint

WORK-018 has started on `task/work-018-library-keyboard-accessibility-v1`.

Current phase: `IN_PROGRESS / RECONNAISSANCE`.

The registered MSR-08 boundary remains unchanged. Before permanent RED is committed, the exact current implementation and test harness will be inspected to freeze:

- card semantic element/role strategy;
- normal-mode Enter and Space activation behavior;
- Select-mode Enter and Space behavior;
- inspector dialog naming semantics;
- focus target on inspector open;
- originating-card focus restoration on Close and Escape;
- behavior when the originating card is no longer rendered;
- smallest permanent regression-test surface.

No production implementation is authorized by this checkpoint.

MSS-02 remains separate and unconsumed.
## Frozen interaction and focus design

Reconnaissance completed against the unchanged WORK-018 baseline.

A proposed replacement of the existing Select-mode native checkbox was rejected during pre-freeze compatibility checking because existing Select-mode and bulk-action regressions explicitly depend on that element's native `HTMLInputElement`, `checked`, and `disabled` behavior.

The bounded production design is therefore frozen as follows.

### Normal-mode Library card

- the visual card container exposes `role="button"`;
- it exposes `tabIndex={0}`;
- its accessible name is `Open <item title>`;
- Enter performs the same open action as pointer activation;
- Space performs the same open action and prevents page-scroll default behavior;
- an explicit `focus-visible` treatment uses existing theme tokens.

### Select-mode Library card

- the existing native `input type="checkbox"` remains authoritative for keyboard and screen-reader selection;
- its existing test ID, checked state, disabled state, label, click behavior, and bulk-action contract are preserved;
- the outer card remains a pointer convenience for toggling selection;
- the outer card is not independently placed in the keyboard tab order;
- the outer card does not claim button or checkbox semantics that duplicate the native control;
- pending bulk operations continue to prevent selection mutation.

### Item inspector

- the inspector exposes `role="dialog"`;
- it exposes `aria-modal="true"`;
- the visible item title receives a stable ID;
- the dialog is named through `aria-labelledby`;
- opening an item moves focus to the always-present Close button.

### Closure and focus restoration

- the originating item ID is retained when an inspector is opened;
- explicit Close and the existing Escape / `overlay.close` path use one inspector-close operation;
- after closure, focus returns to the originating Library card when that card is still rendered;
- if lifecycle or query state means the originating card is no longer rendered, restoration safely performs no focus action.

This WORK item does not introduce an application-wide dialog framework, generalized focus trap, Library redesign, taxonomy redesign, Import-dialog redesign, MSS-02 work, Firebase deployment, or unrelated accessibility remediation.

Permanent RED must establish the missing normal-card keyboard semantics, Select-mode preservation boundary, inspector dialog semantics, focus entry, and Close/Escape focus restoration before production source changes.
## Permanent RED checkpoint

Permanent WORK-018 accessibility regressions were added after the revised interaction/focus design freeze and before any production-source modification.

RED authority:

- production `LibraryView.tsx` remained unchanged;
- normal Library cards fail the required button/tab-stop/keyboard-open contract;
- the item inspector fails the required labelled modal-dialog and focus-entry contract;
- Close and Escape fail the required originating-card focus-restoration contract;
- Select mode preserves its existing native checkbox requirement while the outer card currently exposes duplicate interactive semantics that the frozen contract removes;
- the permanent targeted WORK-018 tests fail against the unchanged production baseline as expected;
- the added RED tests typecheck successfully.

Status: `IN_PROGRESS / RED ESTABLISHED`.

Next: implement the smallest production change satisfying this frozen contract while preserving all existing Select-mode and bulk-action checkbox regressions.
