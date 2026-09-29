# Active Work

ACTIVE_WORK: WORK-020

Status: REGISTERED

Title: Backup Due Indicator UX

Base: `c3bfc7d76be6b9a7ea60d7df1d053255aae0564e`

Planned branch: `task/work-020-backup-due-indicator-ux-v1`

Boundary: governance registration only. No WORK-020 production implementation has begun.

Objective: replace the persistent global off-site backup pill with a small red due-only indicator. The indicator is visible when no successful backup exists or when the last successful backup is at least 24 hours old, and is absent while backup status is current.

WORK-019 remains reserved for the separate DISC-002 MSS-02 browser backup resource-exhaustion work.

Next: synchronize this registration to `origin/main` after explicit authorization, then create the WORK-020 task branch and establish permanent RED tests before production-source changes.
