# Active Work

ACTIVE_WORK: WORK-016

Title: Source URL Protocol Hardening

Status: REGISTERED / NOT_STARTED

Base: `cd31db21174f3a833873ea33e9fa0e21c192a7b8`

Planned branch: `task/work-016-source-url-protocol-hardening-v1`

Derived from: `DISC-002` MSS-01 and post-WORK-015 candidate revalidation

Current phase: WORK-016 is registered but implementation has not started. Focused read-only reconnaissance must establish the structured source URL protocol contract, rendering boundary, import/backup implications, and legacy persisted-data behavior before production changes.

Scope: constrain user-controlled structured KnowledgeItem source URLs to an explicit safe web-protocol contract across authoritative validation and rendering while preserving valid source links and existing backup/restore semantics.

Safety: no Firebase deployment, production cloud mutation, persisted-data migration, backup-format redesign, MSR-08/MSR-09/MSS-02 work, Storage enablement, billing change, or unrelated security redesign.
