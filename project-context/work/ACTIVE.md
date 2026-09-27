# Active Work

ACTIVE_WORK: WORK-012

Title: Direct Off-site Recovery Points

Status: IN_PROGRESS

Base: `eb9074e760495c3a97257bb420dbfae6af7cfce2`

Planned branch: `task/work-012-automated-offsite-recovery-points-v1`

Derived from: 2026-09-27 durability and disaster-recovery reconnaissance

Current phase: local recovery-point generation is proven and the direct GitHub storage contract is selected: upload timestamped `.mindspark-backup` assets to one long-lived Release in a dedicated private repository. Next implement the GitHub Release gateway locally with mocked HTTP before creating any real repository credential.

Scope: reuse the existing validated V1 backup contract and WORK-012 recovery-point service, then let the user explicitly create and upload an off-site recovery point from MindSpark to a dedicated private GitHub repository using a narrowly scoped GitHub credential.

Safety: no automatic restore, production-data mutation, Firebase deployment, Storage enablement, billing activation/change, paid-required Firebase/Google Cloud/GitHub feature, backup-format redesign, encryption layer, or Android/PWA redesign.
