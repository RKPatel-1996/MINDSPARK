# MindSpark agent workflow infrastructure

This directory is the machine-readable boundary for task contracts, independent verification results, and minimum verification evidence. Product code must not interpret these files.

## Authority

1. Human: product intent.
2. ChatGPT/orchestrator: contract semantics and task packet.
3. Script: mechanical prefill and validation only.
4. Coding agent: implementation within the contract.
5. Independent verifier: judgment and risk/evidence escalation.
6. Automation: merge after all required approvals and green evidence.

The schemas, this policy, and `verify-map.yml` define semantics. A task packet supplies values only; it cannot add fields or redefine those semantics. A verifier may raise `effective_risk`, require additional evidence, or reject a change. It may not expand product acceptance criteria, allowed paths, or product scope. High-risk work, including Normal work escalated to High, requires human approval before work continues.

`verify-map.yml` is a minimum-evidence map. All matching areas contribute requirements. Path-derived rules never cap semantic review, and line-count or file-count thresholds are not governance rules.

## Packets and validation

- `schemas/task-contract.schema.json`: closed task packet contract.
- `schemas/verifier-result.schema.json`: closed independent-verifier result.
- `schemas/verify-map.schema.json`: structure and authority invariants for the verification map.
- `templates/task-contract.template.yml`: concise orchestrator template.
- `examples/`: validating example packets.

The `contract_hash` is lowercase SHA-256 over the exact UTF-8 bytes of the task contract packet.

```bash
npm run validate:workflow
node workflow/scripts/validate.mjs contract path/to/task.yml
node workflow/scripts/validate.mjs result path/to/result.yml
node workflow/scripts/validate.mjs map workflow/verify-map.yml
```

## Reject protocol

- Type A — targeted defect: stay on the same branch, create a correction commit, and rerun the failed evidence plus its affected dependency set.
- Type B — contract or scope violation: remove or revert the offending scope; return to orchestration for a revised contract when the requested work itself must change.
- Type C — architectural discovery: freeze the branch, do not fix forward, and re-plan, usually from clean `main`.

Never commit red. After two rejected verification cycles for the same slice, stop and re-plan. If green cannot be reached without widening scope, classify the outcome as Type C.
## Verified merge automation

Prerequisites: use a dedicated clean worktree with local `main`, `origin/main`, and the accepted feature branch available. The verifier-result packet must validate, say `ACCEPT`, and exactly match the supplied contract hash, base SHA, and feature SHA. High effective risk also requires `--human-approval-reference`.

Dry-run fetches and validates evidence/refs without switching branches, merging, running gates, or pushing:

```bash
npm run workflow:merge -- --dry-run --feature-branch task/example --feature-head <sha> --expected-base <main-sha> --contract-hash <sha256> --verifier-result <result.yml> --gate verify:web-release
```

Actual integration requires the explicit `--execute` mode:

```bash
npm run workflow:merge -- --execute --feature-branch task/example --feature-head <sha> --expected-base <main-sha> --contract-hash <sha256> --verifier-result <result.yml> --gate verify:web-release
```

The tool accepts package-script gate names only. It updates and merges with `--ff-only`, pushes only `main:main`, and never uses force. Any ambiguity stops. A failed pre-push gate restores local `main` to the fetched `origin/main` and leaves the feature branch intact. A post-push problem never rewrites history; correct it from a new hotfix branch.