# Active Work

ACTIVE_WORK: WORK-011

Title: ReviewEvent Firestore Rule Parity

Status: REGISTERED / NOT_STARTED

Base: `5d3e108a9e6975e2b43724025fa9e19b2ab2a476`

Planned branch: `task/work-011-review-event-rule-parity-v1`

Derived from: `GAP-005`

Current phase: GAP-005 has been reverified against the canonical ReviewEvent domain schema and authoritative `firestore.rules.template`; WORK-011 is registered but implementation has not started.

Scope: bring ReviewEvent Firestore create validation into feasible, representation-aware parity with the domain contract while preserving normal review, restore, owner isolation, and append-only semantics.

Safety: no deployment, cloud mutation, Storage enablement, billing change, scheduler redesign, ReviewEvent migration, or unrelated security work.