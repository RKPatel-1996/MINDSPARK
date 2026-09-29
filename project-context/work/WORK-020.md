# WORK-020 - Backup Due Indicator UX

Status: REGISTERED

Base: `c3bfc7d76be6b9a7ea60d7df1d053255aae0564e`

Planned branch: `task/work-020-backup-due-indicator-ux-v1`

Derived from: production responsive smoke observation after the 2026-09-28 MindSpark web release.

## Problem

The global off-site backup control is currently rendered as a persistent floating pill.

On narrow/mobile layouts the floating control can overlap primary application controls, including Review actions.

Reconnaissance confirmed that the backup-status engine already provides the required durable timing behavior:

- no recorded successful backup is treated as due;
- a successful backup becomes due exactly 24 hours after its recorded success timestamp;
- successful-backup state is stored device-locally;
- backup-status changes emit the existing `mindspark:offsite-backup-status` event;
- `GlobalOffsiteBackupControl` already refreshes from that event and schedules the 24-hour transition.

The defect is therefore confined to presentation and global-control visibility rather than backup execution or status persistence.

## Objective

Replace the persistent global backup pill with a minimal due-only indicator that never occupies persistent screen space when backup status is current.

## Required behavior

- if no successful off-site backup has ever been recorded on the device, the global backup indicator is visible immediately;
- if the last successful backup is at least 24 hours old, the global backup indicator is visible;
- if the last successful backup is less than 24 hours old, no global backup control is rendered;
- the due indicator is a small red backup/cloud-style icon suitable for both mobile and desktop layouts;
- the global control does not render the current persistent `Backup due` text pill;
- the global control does not render a persistent `Backup now` state while backup is current;
- activating the due indicator preserves the existing backup operation;
- when no GitHub backup credential is available, activation preserves the existing route to Backup settings;
- a fully successful backup immediately causes the due indicator to disappear;
- a successful upload with retention-cleanup warning continues to count as a successful recovery point and therefore causes the due indicator to disappear;
- a failed backup that did not create a successful recovery point leaves the due indicator visible;
- the existing 24-hour due threshold remains authoritative;
- existing backup engine, GitHub connection, credential handling, retention behavior, timestamp persistence, and status-event behavior remain unchanged.

## Verification contract

Permanent regression coverage must demonstrate:

1. no prior successful backup renders the due-only global indicator;
2. a backup older than 24 hours renders the due-only indicator;
3. a backup newer than 24 hours renders no global backup control;
4. the due indicator exposes an accessible name and remains operable on pointer/touch;
5. successful backup immediately removes the global indicator;
6. retention-cleanup warning after successful upload also removes the global indicator;
7. failed backup without a successful recovery point leaves the indicator visible;
8. missing PAT preserves direct navigation to Backup settings;
9. the existing off-site backup status tests continue to establish the exact 24-hour boundary and same-page status notification;
10. TypeScript and full `verify:web-release` pass.

## Out of scope

- WORK-019 / DISC-002 MSS-02 browser backup/archive resource-exhaustion work;
- changes to the `.mindspark-backup` archive format;
- changes to GitHub backup retention or credential storage;
- automatic background backup;
- changing the 24-hour threshold;
- synchronizing last-success status between devices;
- redesign of the Settings backup surface;
- Firebase rules, Firestore schema, Storage enablement, billing, or production-data changes;
- unrelated responsive-layout changes.

## Current boundary

Registration only. No WORK-020 production implementation has begun.

The production release that exposed this responsive issue remains deployed. Firestore rules and indexes are live on `mindspark-b8-test`; Firebase Storage remains undeployed and is not required for the current text/code/math core workflow.

WORK-019 remains reserved for the separate MSS-02 browser backup resource-exhaustion work.

Next: push this governance registration to canonical `origin/main` after explicit authorization, create `task/work-020-backup-due-indicator-ux-v1`, establish permanent RED tests against the unchanged presentation baseline, then implement the smallest UI-only change.
## Start and permanent RED checkpoint

WORK-020 has started on `task/work-020-backup-due-indicator-ux-v1`.

Current phase: `IN_PROGRESS / RED ESTABLISHED`.

Permanent regression coverage was established before production-source modification.

RED authority:

- `GlobalOffsiteBackupControl.tsx` remains unchanged from the registered WORK-020 baseline;
- no-success and >=24-hour-due states must retain an accessible due action while removing the persistent visible text pill;
- the due action must become a compact red icon-only global control;
- a successful backup must remove the global backup action immediately;
- a successful upload with retention-cleanup warning must also remove the global action because a durable recovery point was created;
- a recent successful backup must render no global backup action;
- failed backup must leave the due action available;
- missing-PAT routing to Backup settings remains preserved;
- the focused permanent WORK-020 suite fails against the unchanged production presentation baseline as expected;
- the new RED tests typecheck successfully.

No backup engine, status persistence, archive format, credential handling, Firebase, production data, or deployment behavior has been modified.

WORK-019 / DISC-002 MSS-02 remains separate and unconsumed.

Next: implement the smallest production-only presentation change in `GlobalOffsiteBackupControl.tsx`, then run the permanent WORK-020 suite and broader backup/release regressions.
## Completion checkpoint

WORK-020 implementation is complete on the bounded task branch.

Technical implementation commit:

`8fa00e30ae83e73f13ede4d9cfdef46432b4ec76`

Verified behavior:

- no recorded successful backup renders a compact red icon-only global backup action;
- a backup at least 24 hours old renders the same due-only action;
- a recent successful backup renders no global backup action;
- the persistent visible `Backup due` / `Backup now` pill is removed;
- the due action retains an accessible name while remaining icon-only;
- successful backup removes the global due action immediately;
- successful recovery-point upload with retention-cleanup warning also removes the due action;
- failed backup without a successful recovery point leaves the due action available;
- missing-PAT activation continues to route to Backup settings;
- the existing 24-hour status threshold and same-page status notification contract remain unchanged.

Verification:

- permanent WORK-020 backup-control regression suite: PASS;
- off-site backup status contract suite: PASS;
- TypeScript typecheck: PASS;
- full `verify:web-release`: PASS;
- implementation scope remained limited to `GlobalOffsiteBackupControl.tsx`.

Status: `COMPLETE_PENDING_PROMOTION`.

No task-branch push, Firebase deployment, cloud mutation, production-data change, archive-format change, or WORK-019 / MSS-02 implementation occurred.

Next boundary: independent completed-branch review. Canonical `main` must not change without explicit promotion authorization.
