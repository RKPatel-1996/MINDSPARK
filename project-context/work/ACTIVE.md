# Active Work

ACTIVE_WORK: WORK-012

Title: Direct Off-site Recovery Points

Status: IN_PROGRESS

Base: `eb9074e760495c3a97257bb420dbfae6af7cfce2`

Planned branch: `task/work-012-automated-offsite-recovery-points-v1`

Derived from: 2026-09-27 durability and disaster-recovery reconnaissance

Current phase: local recovery-point generation, GitHub Release transport, and direct off-site application composition are implemented and locally verified. Next implement the fixed-count retention rule: after a successful upload, keep the newest 30 MindSpark backup assets and delete only older MindSpark backup assets.

Scope: reuse the existing validated V1 backup contract and WORK-012 recovery-point service, then let the user explicitly create and upload an off-site recovery point from MindSpark to a dedicated private GitHub repository using a narrowly scoped GitHub credential.

Safety: no automatic restore, production-data mutation, Firebase deployment, Storage enablement, billing activation/change, paid-required Firebase/Google Cloud/GitHub feature, backup-format redesign, encryption layer, or Android/PWA redesign.
