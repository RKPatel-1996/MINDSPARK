# Active Work

ACTIVE_WORK: WORK-012

Title: Direct Off-site Recovery Points

Status: IN_PROGRESS

Base: `eb9074e760495c3a97257bb420dbfae6af7cfce2`

Branch: `task/work-012-automated-offsite-recovery-points-v1`

Derived from: 2026-09-27 durability and disaster-recovery reconnaissance

Current phase: the direct off-site recovery architecture is implemented and live storage has been verified. MindSpark now generates the existing validated V1 `.mindspark-backup`, computes SHA-256, commits the recovery point through the GitHub Contents API into private `RKPatel-1996/MINDSPARK_BACKUPS/recovery-points/`, reads the committed bytes back for SHA-256 verification, and applies newest-30 active-file retention. The PAT is supported by encrypted device-local IndexedDB persistence with an application-memory plaintext cache and memory-only fallback.

Live integration checkpoint: `mindspark-2026-09-27T15-42-48-246Z.mindspark-backup` was successfully stored on 2026-09-27. The superseded GitHub Release-asset path was retired after browser CORS blocked `uploads.github.com`.

Remaining completion gates:

1. validate the GitHub-produced recovery archive through the existing restore inspection workflow without destructive production restore;
2. run final `npm run verify:web-release`;
3. align final governance/status;
4. perform bounded completion review before promotion.

Scope: reuse the existing validated V1 backup/restore contract and authenticated application repositories to create explicit off-site recovery points in the dedicated private GitHub backup repository.

Safety: no automatic restore, production-data mutation, Firebase deployment, Storage enablement solely for WORK-012, billing activation/change, paid-required Firebase/Google Cloud feature, backup-format redesign, scheduler/FSRS changes, or unrelated GitHub automation.
