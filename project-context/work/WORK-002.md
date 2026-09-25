# WORK-002 — Promote Governance Foundation to Canonical Main

Status: PROPOSED / NOT STARTED

## Aim

Make the verified governance/navigation layer part of canonical `main` while preserving every unfinished product worktree and branch unchanged.

## Intended scope

- verify canonical `main` and `origin/main`;
- verify governance branch contains only governance/onboarding changes;
- integrate governance changes into `main`;
- run documentation/diff integrity checks;
- verify resulting canonical Git state.

## Explicit exclusions

- no application-source changes;
- no text/code/math reconciliation;
- no workflow-infrastructure merge;
- no deployment;
- no Firebase/cloud changes;
- no worktree cleanup.

## Start boundary

Do not start until the WORK-001 closure commit has been reviewed.
