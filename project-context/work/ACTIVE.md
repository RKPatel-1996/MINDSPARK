# Active Work

ACTIVE_WORK: WORK-020

Status: IN_PROGRESS / RED ESTABLISHED

Title: Backup Due Indicator UX

Base: `d0768f0d7cc69251615e0bfff25dbbfd9207b45b`

Branch: `task/work-020-backup-due-indicator-ux-v1`

Objective: replace the persistent global off-site backup pill with a compact red due-only icon. No global backup control is rendered while backup status is current.

Permanent RED is established against the unchanged production presentation baseline and the RED tests typecheck successfully.

Production implementation has not begun.

WORK-019 remains reserved for the separate DISC-002 MSS-02 browser backup resource-exhaustion work.

Next: implement the smallest change in `GlobalOffsiteBackupControl.tsx`, then verify focused backup regressions, TypeScript, and full web-release integration before completion review.
