# Active Work

ACTIVE_WORK: WORK-017

Title: Viewport User-Scaling Accessibility

Status: COMPLETE_PENDING_PROMOTION

Base: `67dac991cab3c793dd952c4bacb49f1e07998944`

Planned branch: `task/work-017-viewport-scaling-v1`

Derived from: `DISC-002` MSR-09

Current phase: WORK-017 implementation and independent completed-implementation review are complete. Source, fresh-build artifact, typecheck, full web-release, and bounded-diff evidence pass. Status is COMPLETE_PENDING_PROMOTION; the next boundary is an independent completed-branch review before any canonical promotion.

Scope: restore user-controlled browser zoom by establishing an explicit accessibility-safe viewport metadata contract while preserving responsive device-width behavior and the existing PWA release contract.

Safety: no Firebase deployment, production cloud mutation, persisted-data migration, MSR-08 work, MSS-02 work, broad responsive redesign, Storage enablement, billing change, or unrelated accessibility redesign.
