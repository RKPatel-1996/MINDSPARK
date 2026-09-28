# ACTIVE WORK

ACTIVE_WORK: WORK-015

Title: ReviewEvent History Query Scaling

Status: IN_PROGRESS

Base: `b5279fc3a21ce6ff6d120180bb497994bee2f629`

Planned branch: `task/work-015-reviewevent-query-scaling-v1`

Derived from: `DISC-002` MSR-04 and post-WORK-014 candidate reconnaissance

Current phase: WORK-015 is IN_PROGRESS on `task/work-015-reviewevent-query-scaling-v1`. The selected design is a bounded `listForCards()` repository primitive backed by conservative 10-card Firestore `in` query chunks; RED query-amplification characterization and emulator query-shape proof are the next boundary before production implementation.

Scope: remove avoidable per-card ReviewEvent history query amplification from multi-card Review, Library, and Insights workflows while preserving chronology, ReviewService pending/failed-event authority, offline behavior, and existing backup/restore semantics.

Safety: no Firebase deployment, production-data mutation, billing change, Storage enablement, ReviewEvent history rewrite, MSR-08/MSR-09/MSS-01/MSS-02 work, or unrelated persistence redesign.
