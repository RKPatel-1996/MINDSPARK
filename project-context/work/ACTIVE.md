# ACTIVE WORK

ACTIVE_WORK: WORK-015

Title: ReviewEvent History Query Scaling

Status: COMPLETE_PENDING_PROMOTION

Base: `b5279fc3a21ce6ff6d120180bb497994bee2f629`

Planned branch: `task/work-015-reviewevent-query-scaling-v1`

Derived from: `DISC-002` MSR-04 and post-WORK-014 candidate reconnaissance

Current phase: WORK-015 is COMPLETE_PENDING_PROMOTION on `task/work-015-reviewevent-query-scaling-v1`. Bounded multi-card repository retrieval and Library/Insights/Review routing are implemented; focused scaling, local emulator/rules, and full web-release verification pass. Independent completed-branch review is the next boundary.

Scope: remove avoidable per-card ReviewEvent history query amplification from multi-card Review, Library, and Insights workflows while preserving chronology, ReviewService pending/failed-event authority, offline behavior, and existing backup/restore semantics.

Safety: no Firebase deployment, production-data mutation, billing change, Storage enablement, ReviewEvent history rewrite, MSR-08/MSR-09/MSS-01/MSS-02 work, or unrelated persistence redesign.
