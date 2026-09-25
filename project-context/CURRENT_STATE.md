# MindSpark — Current State

> Status of this file at bootstrap: **LAST_KNOWN / REQUIRES LIVE RECONCILIATION**.
> Do not treat commit hashes or branch state below as current until WORK-001 verifies the local repository.

## Project identity

- Project: MindSpark V2
- Canonical repository path: `D:\Home\rohit\Documents\WebProjects\MINDSPARK_RECOVERED`
- Intended canonical branch: `main`
- Product: offline-first personal knowledge catalog + spaced-repetition PWA

## Last-known canonical baseline

- Last-known repaired canonical baseline: `main == origin/main == bc9fe9c11dae0ff91ef5cf5f21ca948d0ab07d2d`
- Last-known baseline working tree: clean
- Last-known baseline verification: `verify:web-release` passed before push

These values are orientation only until reverified live.

## Major completed work known before bootstrap

- Backup/restore B2–B7 implementation sequence completed and merged.
- B8 Stage 1 controlled local/emulator testing completed and accepted.
- Baseline dependency/esbuild repair completed after B8 Stage 1.
- PWA/release verification uses the repository's `verify:web-release` gate.
- Existing repository-native `AGENTS.md` / governed review workflow exists and must be preserved.

## Known pending/reconciliation items

1. Verify current `main`, `origin/main`, working-tree cleanliness, remotes, and recent history.
2. Reconcile the workflow-infrastructure branch whose last-known rebased HEAD was `caa7266cd196399d14b35c2358e5587f5634e80e`; determine whether it was later merged/superseded.
3. Reconcile `task/text-code-math-content-v1`; it was last known as a dirty/pending branch based on an older B8 baseline and must not be assumed current.
4. Confirm whether any later commits after the repaired baseline changed canonical state.
5. Update this file only after live verification.

## Cloud/Firebase boundary

- Disposable cloud test project: `mindspark-b8-test`.
- B8 Stage 2 cloud/state-shaping testing was not authorized at the last checkpoint.
- Billing/backend synchronization and explicit cloud authorization were still gating conditions.
- A cleared billing warning alone does not authorize deployment or state-shaping tests.

Treat this boundary as active until live project records establish a newer authorized state.

## Uploaded snapshot note

The ChatGPT Project currently contains an uploaded `remix_-remix_-mindspark(1).zip`. It is an AI Studio-style source snapshot and must not be promoted to canonical authority merely because it is attached here. The local canonical Git repository remains the authority.

## Active work

See `work/ACTIVE.md`.
