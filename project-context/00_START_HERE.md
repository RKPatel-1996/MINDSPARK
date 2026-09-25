# MindSpark — Start Here

## Purpose

This directory is the durable project-management and session-handoff layer for MindSpark V2.
It exists to make each new ChatGPT/Codex session cheap to onboard while keeping the repository itself authoritative.

## Authority order

For project-specific facts, use this order:

1. **Live canonical local repository evidence** — Git branch/HEAD/status, tracked source, tests, build output.
2. **Existing authoritative MindSpark documentation** — architecture, persistence, import, deployment, backup/restore contracts, repository `AGENTS.md`.
3. **Accepted project-context records** — current WORK item, discoveries, flows, gaps, ADR-style decisions.
4. **ChatGPT Project context / prior chats / memory** — orientation only.
5. **Old exports, ZIPs, AI Studio snapshots, copied worktrees** — evidence only after identity and freshness are verified.

A lower level must never silently override a higher level.

## Session onboarding

At the start of substantive work:

1. Read repository `AGENTS.md`.
2. Read this file.
3. Read `CURRENT_STATE.md`.
4. Read `work/ACTIVE.md` and the referenced WORK file.
5. Verify live Git state before making `CURRENT` or `VERIFIED` claims.
6. Load only the subsystem documents required by the active work.

## Evidence labels

- `VERIFIED_LIVE` — checked in the current session against live repository/tool evidence.
- `LAST_KNOWN` — previously verified, but not yet rechecked in the current session.
- `INFERRED` — reasoned from evidence; not directly observed.
- `UNVERIFIED` — reported or remembered but requires checking.
- `BLOCKED` — cannot proceed until a stated dependency/authorization is satisfied.

## Work discipline

Every substantial task should have one bounded `WORK-###.md` record. `work/ACTIVE.md` points to the single current item. Completed work moves to `history/` or is marked complete and replaced deliberately.

Do not use `CURRENT_STATE.md` as a substitute for `git status`, `git rev-parse`, tests, or authoritative subsystem documents. It is a concise handoff snapshot and must be corrected whenever live evidence differs.
