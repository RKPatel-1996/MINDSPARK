# Active Work

ACTIVE_WORK: WORK-011

Title: ReviewEvent Firestore Rule Parity

Status: IN_PROGRESS

Base: `904d6a3d9cd2842af1c8a8638180538948f6f3ba`

Planned branch: `task/work-011-review-event-rule-parity-v1`

Derived from: `GAP-005`

Current phase: implementation preflight is complete. Domain, DTO, restore, persistence, and Firestore-rule representations have been compared; RED security-rule characterization is next.

Scope: bring ReviewEvent Firestore create validation into feasible, representation-aware parity with the domain contract while preserving normal review, restore, owner isolation, and append-only semantics.

Safety: no deployment, cloud mutation, Storage enablement, billing change, scheduler redesign, ReviewEvent migration, or unrelated security work.