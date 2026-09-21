---
name: mindspark-review-merge
description: Review a completed MindSpark task branch against its stated scope, merge it into main when it passes, run final web verification, and report Git evidence.
---

# MindSpark Review and Merge

Use this skill when a completed MindSpark feature or task branch needs bounded
review and, if accepted, merge into `main`. Do not use it to implement the
feature, broaden its scope, or perform a release/deployment.

## Required inputs

- Feature or task branch.
- Expected commit, when known.
- Expected task scope and any required verification evidence.

If an input needed to determine scope is unavailable, inspect the branch and
ask only if the missing information prevents a safe review.

## Workflow

1. Confirm the repository root, current branch and HEAD, and a clean working
   tree.
2. Confirm the feature branch exists and contains the expected commit when one
   was supplied.
3. Compare the branch with `main`. Read only changed files and their direct
   contracts or tests; use `AGENTS.md` for repository-wide guidance.
4. Decide whether the diff matches the stated scope, preserves relevant
   contracts, and excludes unrelated or premature work.
5. If review fails, stop without merging and report the exact findings.
6. If it passes, switch to `main`, reconfirm it is clean, and merge normally
   without rewriting history.
7. Run `npm run verify:web-release` as the normal final web gate.
8. Report the new `main` HEAD, final clean status, release-gate result, and
   confirmation that the feature branch remains. Do not push or delete a
   branch unless explicitly requested.

Use live Git evidence and concise reporting. Review judgment remains required:
this skill does not treat a successful test run as proof that an out-of-scope
change is acceptable.
