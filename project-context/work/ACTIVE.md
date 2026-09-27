# Active Work

ACTIVE_WORK: WORK-012

Title: Direct Off-site Recovery Points

Status: IN_PROGRESS

Base: `eb9074e760495c3a97257bb420dbfae6af7cfce2`

Planned branch: `task/work-012-automated-offsite-recovery-points-v1`

Derived from: 2026-09-27 durability and disaster-recovery reconnaissance

Current phase: implementation and automated verification are complete through `ad47136`. The direct GitHub Release upload pipeline, SHA-256 verification, newest-30 retention, device-local non-secret configuration, session-only PAT boundary, and Backup settings UI are implemented. Focused WORK-012 verification passed, and `npm run verify:web-release` passed with 493 web tests plus 8 PWA artifact tests. Remaining completion gate: perform one explicitly authorized live integration validation against a dedicated private GitHub backup repository and existing Release, then validate the produced archive through the existing restore inspection workflow.

Scope: reuse the existing validated V1 backup contract and WORK-012 recovery-point service, then let the user explicitly create and upload an off-site recovery point from MindSpark to a dedicated private GitHub repository using a narrowly scoped GitHub credential.

Safety: no automatic restore, production-data mutation, Firebase deployment, Storage enablement, billing activation/change, paid-required Firebase/Google Cloud/GitHub feature, backup-format redesign, encryption layer, or Android/PWA redesign.
