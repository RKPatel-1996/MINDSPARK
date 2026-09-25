# WORK-001 — Repository-State Reconciliation and Governance Onboarding

## Aim

Establish a live, verified canonical MindSpark baseline and reconcile the new `project-context/` management layer with the actual repository without changing product behavior.

## Scope

Read-only repository inspection plus updates to governance/context documentation needed to record verified state.

## Required checks

1. Confirm repository root and remotes.
2. Record current branch, HEAD, `origin/main`, ahead/behind, and working-tree status.
3. Read current repository `AGENTS.md` and preserve its existing rules.
4. Identify top-level architecture and authoritative subsystem documents.
5. Read `package.json` and record available test/build/release verification commands.
6. Inspect recent Git history and local/remote branches relevant to unfinished work.
7. Reconcile at minimum:
   - repaired canonical baseline;
   - B8 Stage 1 / B8 Stage 2 boundary;
   - workflow-infrastructure branch;
   - `task/text-code-math-content-v1`;
   - any later canonical commits.
8. Update `project-context/CURRENT_STATE.md` from `LAST_KNOWN` to current evidence.
9. Record any material discrepancies as `discoveries/DISC-###.md` or `gaps/GAP-###.md` rather than repairing them.
10. Stop after onboarding/reconciliation.

## Explicit exclusions

- no feature implementation;
- no broad refactor;
- no dependency upgrade unless required solely to read/verify state and separately authorized;
- no branch merge/rebase/reset;
- no deployment;
- no Firebase/cloud state shaping;
- no rewriting or replacing the existing `AGENTS.md` beyond the bounded project-context routing block.

## Completion evidence

Report:

- verified repository/worktree state;
- branch + exact HEAD;
- origin/main relation;
- governance structure status;
- technology stack / major components;
- authoritative docs discovered;
- available test/build/verification commands;
- relevant unfinished branches/tasks;
- blockers and authorization boundaries;
- recommended next WORK item.

## Completion boundary

End with a state equivalent to:

```text
Management foundation: READY
Repository baseline: VERIFIED
WORK-001: COMPLETE
No product repairs started.
Next proposed work: <one bounded item>
```
