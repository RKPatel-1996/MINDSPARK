# Active Work

ACTIVE_WORK: WORK-012

Title: Automated Off-site Recovery Points

Status: IN_PROGRESS

Base: `eb9074e760495c3a97257bb420dbfae6af7cfce2`

Planned branch: `task/work-012-automated-offsite-recovery-points-v1`

Derived from: 2026-09-27 durability and disaster-recovery reconnaissance

Current phase: WORK-012 implementation has started on its bounded task branch. The first implementation phase is the local read-only headless backup-source contract and controlled-data export path; no external GitHub or Google Cloud configuration is authorized yet.

Scope: add a read-only unattended export path around the existing validated V1 backup contract, then create daily off-site recovery points in a dedicated private GitHub repository with bounded retention and failure detection.

Safety: no automatic restore, production-data mutation, Firebase deployment, Storage enablement, billing activation/change, paid-required Firebase/Google Cloud/GitHub feature, backup-format redesign, encryption layer, or Android/PWA redesign.
