# MindSpark Codex Guidance

## Authority

- Git-tracked source and tests are authoritative. The modern application is under `src/v2`.
- Old ZIP exports and AI Studio workspace state are not authoritative.
- Do not edit generated outputs such as `dist/`, `.generated/`, or generated Android assets unless the task explicitly requires generated-output work.

## Scope Tasks Before Reading

For bounded work, identify the relevant subsystem first. Do not rediscover the entire repository.

- Search exact symbols before broad concepts; prefer `rg` scoped to relevant directories and file types.
- Read bounded ranges around matching symbols, then expand only when a dependency requires it.
- Avoid broad searches for generic terms such as `item`, `card`, `state`, or `data` unless narrower searches fail.
- Do not read lockfiles, seed datasets, generated files, Android generated artifacts, or unrelated large documents unless directly relevant.

## Route to Existing Authorities

| Need | Read |
| --- | --- |
| General project workflow | `README.md` |
| Architecture, domain, application, or UI boundaries | `docs/MINDSPARK_V2_ARCHITECTURE.md` |
| Persistence, Firebase, or reconciliation | `docs/MINDSPARK_V2_PERSISTENCE.md` |
| Import format or import behavior | `docs/MINDSPARK_IMPORT_FORMAT.md` |
| Release or deployment | `DEPLOYMENT.md` |
| Verification commands | `package.json` |
| CI web-release gate | `.github/workflows/web-release-verification.yml` |
| Production preflight | `scripts/preflight-production.mjs` |
| PWA artifact verification | `scripts/test-pwa-build.mjs` |

Do not load all of these documents for every task.

## Implementation Workflow

1. Check the current branch, HEAD, and working-tree status.
2. Inspect only the relevant subsystem and locate the smallest safe boundary.
3. Read affected source, direct interfaces, and nearest relevant tests.
4. Implement only the requested change.
5. Run targeted tests while iterating, inspect the diff, then run the appropriate final gate.

Do not run a broad repository audit for ordinary bounded work.

## Verification Ladder

During implementation, run exact Vitest files where possible:

```bash
npx vitest run <exact-test-path>
```

For the final web integration gate, use:

```bash
npm run verify:web-release
```

Do not automatically run `npm run typecheck`, `npm test`, and `npm run verify:web-release` consecutively: the release command already performs overlapping checks. Run separate typecheck or full-suite commands only to investigate a failure, when independently required by the task, or when the release gate is not appropriate.

## Firebase

- Run repository-defined Firebase emulator and security tests when work touches Firebase repositories, Firestore/Storage rules, persistence behavior, or Firebase-relevant reconciliation.
- Do not run emulator suites for unrelated UI or domain work.
- For Firebase failures, inspect existing debug logs only as needed; do not preload them.

## Release and Git

- Do not deploy unless explicitly instructed. Follow `DEPLOYMENT.md` and do not bypass production preflight.
- Do not create wrappers around existing release commands merely to shorten them.
- Use a task branch for implementation. Do not merge to `main`, push, or rewrite history unless explicitly instructed.
- Prefer live Git evidence over duplicate project-state files. Normal inspection is usually limited to:

```bash
git status --short
git branch --show-current
git rev-parse HEAD
git log --oneline -5
```

Use deeper history only when the task requires it.

## Progressive Disclosure

1. **Level 1:** this file, the user task, and live Git state.
2. **Level 2:** workflow-specific existing documentation.
3. **Level 3:** affected subsystem source, tests, and interfaces.
4. **Level 4:** large logs, broad history, large regression suites, seed data, and generated artifacts only during investigation.

Do not preload context simply because it exists.
