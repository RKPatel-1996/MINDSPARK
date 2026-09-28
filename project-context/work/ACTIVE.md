# Active Work

ACTIVE_WORK: WORK-016

Title: Source URL Protocol Hardening

Status: COMPLETE_PENDING_PROMOTION

Base: `cd31db21174f3a833873ea33e9fa0e21c192a7b8`

Planned branch: `task/work-016-source-url-protocol-hardening-v1`

Derived from: `DISC-002` MSS-01 and post-WORK-015 candidate revalidation

Current phase: WORK-016 implementation is technically complete at `8fad43ac427d8be468874917ae906c6dcd65d6b3` and is COMPLETE_PENDING_PROMOTION. Completed implementation review, 8-file/80-test contract regression, full 79-file/558-test web-release suite, fresh production PWA build, and 8/8 PWA artifact verification passed. Independent completed-branch review is required before promotion.

Scope: constrain user-controlled structured KnowledgeItem source URLs to an explicit safe web-protocol contract across authoritative validation and rendering while preserving valid source links and existing backup/restore semantics.

Safety: no Firebase deployment, production cloud mutation, persisted-data migration, backup-format redesign, MSR-08/MSR-09/MSS-02 work, Storage enablement, billing change, or unrelated security redesign.
