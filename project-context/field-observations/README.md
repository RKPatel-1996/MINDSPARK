# MindSpark Field Observations

## Purpose

This directory is the lightweight intake layer for issues discovered while actually using MindSpark.

Use it for:

- minor UI annoyances;
- responsive-layout problems;
- accessibility observations;
- unexpected but non-destructive behavior;
- small workflow friction;
- performance observations;
- production-only behavior worth investigating;
- improvement ideas that may or may not justify implementation.

Do not immediately create a bounded WORK item for every observation.

## Authority

A field observation is not proof of a defect.

Before calling an observation confirmed, verify it against the current application, current source, tests, logs, or reproducible behavior as appropriate.

Live repository evidence and direct runtime evidence outrank this registry.

## Lifecycle

### OBSERVED

Reported or noticed during normal use.

The behavior has not yet been independently reproduced or source-confirmed.

### CONFIRMED

Current evidence establishes that the behavior exists and is relevant.

Confirmation should identify the affected surface and the evidence used.

### PROMOTED_TO_WORK

The observation has been scoped into a bounded `WORK-###` item.

The WORK record becomes the implementation authority.

The observation remains as provenance and links to the WORK item.

### RESOLVED

The linked repair has been completed/promoted and, where relevant, deployed or manually verified.

### CLOSED

No implementation is planned.

Examples:

- not reproducible;
- duplicate;
- obsolete after another change;
- expected behavior;
- deliberately declined.

## Rules

1. Do not silently turn an observation into implementation.
2. Do not label an item CONFIRMED from memory alone.
3. One observation can remain OBSERVED while more evidence is gathered.
4. Prefer a concise observation over creating a premature architectural task.
5. When implementation becomes appropriate, create one bounded WORK item and link it from the registry.
6. Cloud/Firebase mutations, deployments, pushes, destructive actions, and production-data operations retain their normal explicit-authorization requirements.
7. Keep user-reported wording separate from verified technical conclusions when they differ.

## Identifier format

Use sequential identifiers:

`FO-001`, `FO-002`, `FO-003`, ...

Do not reuse identifiers.

## Minimum record

Each entry should contain:

- ID;
- date first observed;
- status;
- affected surface;
- concise observation;
- evidence / reproduction state;
- linked WORK item if any;
- resolution or next investigation step.

## New-session usage

If `work/ACTIVE.md` reports `ACTIVE_WORK: NONE`, a future chat may inspect this registry for a small confirmed item to investigate.

Do not select or implement an item automatically merely because it exists. The user's current request remains authoritative.
