# Active Work

ACTIVE_WORK: WORK-012

Title: Automated Off-site Recovery Points

Status: REGISTERED / NOT_STARTED

Base: `eb9074e760495c3a97257bb420dbfae6af7cfce2`

Planned branch: `task/work-012-automated-offsite-recovery-points-v1`

Derived from: 2026-09-27 durability and disaster-recovery reconnaissance

Current phase: automatic recovery-point absence has been verified; WORK-012 is registered but implementation has not started.

Scope: add a read-only unattended export path around the existing validated V1 backup contract, then create daily off-site recovery points in a dedicated private GitHub repository with bounded retention and failure detection.

Safety: no automatic restore, production-data mutation, Firebase deployment, Storage enablement, billing change, backup-format redesign, encryption layer, or Android/PWA redesign.
