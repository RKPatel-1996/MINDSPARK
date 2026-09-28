# Active Work

ACTIVE_WORK: WORK-014

Title: Atomic Import Uniqueness

Status: COMPLETE_PENDING_PROMOTION

Base: `3f14ee572167a3357178cf7fd2b075e70e270f8d`

Planned branch: `task/work-014-atomic-import-uniqueness-v1`

Derived from: `DISC-002` MSR-03 and post-WORK-013 revalidation

Current phase: WORK-014 is COMPLETE_PENDING_PROMOTION after the independent-review claim-lifecycle correction. Fingerprint-changing edits now migrate claim authority atomically, legacy no-claim items have a server-verified recovery path, emulator/rules verification passed, and the full web-release gate passed.

Scope: establish owner-scoped persistence-level uniqueness for the existing normalized import fingerprint, preserve item/card atomicity, retain preview duplicate detection as UX only, and add true simultaneous-import regression coverage.

Safety: no Firebase deployment, production-data mutation, Storage enablement, billing change, historical-data deduplication, restore redesign, fingerprint-rule migration, MSR-04/MSR-08/MSR-09 work, or unrelated persistence redesign.
