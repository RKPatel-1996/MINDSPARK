# Active Work

ACTIVE_WORK: WORK-013

Title: Application Runtime Resilience Hardening

Status: REGISTERED / NOT_STARTED

Base: `30af8a220d249f1a958f2373f07aa7dae73e838c`

Planned branch: `task/work-013-application-runtime-resilience-v1`

Derived from: post-WORK-012 runtime-resilience reconnaissance and `DISC-002` findings MSR-05, MSR-06, and MSR-07

Current phase: MSR-05, MSR-06, and MSR-07 have been revalidated against current canonical source; WORK-013 is registered but implementation has not started.

Scope: harden provider-owned ReviewService disposal, scheduler-parameter cache invalidation after successful restore, and bootstrap failure/retry behavior without changing persistence, FSRS, ReviewEvent, or backup semantics.

Safety: no Firebase deployment, production-data mutation, Storage enablement, billing change, dependency migration, general ApplicationContext redesign, MSR-03 import-uniqueness work, MSS-01 URL-protocol work, or unrelated resilience work.
