# Active Work

ACTIVE_WORK: WORK-020

Status: COMPLETE_PENDING_PROMOTION

Title: Backup Due Indicator UX

Base: `d0768f0d7cc69251615e0bfff25dbbfd9207b45b`

Branch: `task/work-020-backup-due-indicator-ux-v1`

Technical implementation: `8fa00e30ae83e73f13ede4d9cfdef46432b4ec76`

The persistent global backup pill has been replaced by a compact red due-only icon. No global backup control is rendered while the last successful backup is less than 24 hours old.

Permanent WORK-020 regressions, the existing backup-status timing contract, TypeScript, and full web-release verification pass.

WORK-019 remains reserved for the separate DISC-002 MSS-02 browser backup resource-exhaustion work.

Next: perform an independent completed-branch review before any promotion to canonical `main`.
