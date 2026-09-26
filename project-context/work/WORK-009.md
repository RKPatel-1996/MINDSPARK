# WORK-009 - Production Dependency Security Remediation

Status: COMPLETE / PROMOTED

Base: `aee00bf7c544bbe7634dfb9ae029e54525bdedee`

Branch: `task/work-009-dependency-security-v1`

Derived from: `GAP-003`

## Aim

Remediate the verified npm dependency-security findings with the smallest compatible dependency and lockfile changes while preserving MindSpark application behavior, backup safety, routing, build behavior, Firebase tooling, and the existing release contract.

This work item addresses dependency exposure. It must not become a general dependency-refresh or feature-upgrade effort.

## Verified baseline

Current full dependency audit:

- 15 total findings;
- 9 moderate;
- 6 high;
- 0 critical.

Current production-only audit:

- 5 total findings;
- 2 moderate;
- 3 high;
- 0 critical.

Relevant installed versions:

- `fflate` 0.8.2;
- `react-router-dom` 7.18.1;
- `react-router` 7.18.1;
- `vite` 6.4.3;
- `postcss` 8.5.19;
- `nanoid` 3.3.16;
- `firebase-tools` 15.30.0.

## Reachability characterization

### fflate

MindSpark directly calls `unzipSync()` when reading user-supplied backup ZIP archives.

The reported advisory affects malformed ZIP64 processing through `unzipSync()`.

Therefore this finding is application-relevant and must be remediated.

Fixed compatible candidate:

- `fflate` 0.8.3.

### React Router

MindSpark uses client-side HashRouter routing, navigation hooks, Routes, Route, and NavLink.

Repository reconnaissance found no React Server Components router, server router, route action, or RSC action path associated with the reported advisory.

Application-specific reachability therefore appears low, but the vulnerable installed dependency must still be upgraded.

Compatible candidate:

- `react-router-dom` / `react-router` 7.18.4.

### PostCSS / nanoid

Current dependency path:

`vite 6.4.3 -> postcss 8.5.19 -> nanoid 3.3.16`

These are build/toolchain dependencies rather than direct MindSpark browser APIs.

Compatible lockfile candidates identified by npm:

- `postcss` 8.5.28;
- `nanoid` 3.3.19.

No Vite major upgrade is justified for this remediation.

### Development tooling

The full-tree audit also contains findings in Firebase/tooling dependency paths.

Current direct tooling candidate:

- `firebase-tools` 15.30.0 -> 15.31.0.

Compatible transitive remediation candidates observed during dry-run reconnaissance include:

- `@xmldom/xmldom` 0.9.12;
- `tar` 7.5.22;
- `brace-expansion` 5.0.12.

These should be obtained through normal dependency resolution rather than arbitrary direct dependencies or overrides unless evidence proves an override necessary.

## Implementation strategy

1. Apply explicit minimal direct dependency updates:
   - `fflate` 0.8.3;
   - `react-router-dom` 7.18.4;
   - `firebase-tools` 15.31.0.
2. Allow normal npm resolution to refresh compatible transitive packages required to clear PostCSS, nanoid, and tooling findings.
3. Inspect `package.json` and `package-lock.json` diffs before accepting them.
4. Do not use `npm audit fix --force`.
5. Do not introduce dependency overrides unless normal compatible resolution cannot remediate a specific finding and the override is separately justified.
6. Do not upgrade Vite, React, Firebase runtime, Capacitor, or other unrelated direct packages merely for freshness.

## Required regression verification

At minimum verify:

- backup archive contract and backup workflow tests;
- direct HashRouter lazy-routing tests;
- TypeScript;
- complete ordinary Vitest suite;
- production build;
- PWA artifact verification;
- `npm run verify:web-release`;
- Firebase rules/storage-rule tests where supported by the existing local test contract;
- full `npm audit`;
- production-only `npm audit --omit=dev`.

## Acceptance

WORK-009 is complete only when:

- the reachable `fflate` finding is removed;
- React Router is outside the reported vulnerable range;
- current PostCSS and nanoid findings are removed;
- current Firebase/tooling findings are remediated where compatible fixes are available;
- production-only audit has no remaining moderate/high/critical findings from the WORK-009 baseline;
- full-tree audit has no remaining baseline findings where compatible non-major fixes exist;
- any residual finding is explicitly characterized with dependency path, advisory, reachability, and reason it cannot safely be removed;
- no major-version upgrade is introduced without separate justification;
- no `npm audit fix --force` is used;
- package/lockfile changes are minimal and reviewed;
- backup import/export behavior remains correct;
- HashRouter behavior remains correct;
- full release verification passes;
- before/after audit evidence is recorded.

## Constraints

- No feature redesign.
- No scheduler or FSRS semantic changes.
- No persistence-model changes.
- No Firebase cloud mutation or deployment.
- No Storage enablement.
- No billing change.
- No application deployment.
- No unrelated dependency modernization.
- No major dependency upgrades merely to remove an audit warning.
- Preserve WORK-008 bundle-performance behavior and chunk-size contract.
- Preserve historical governance evidence.
## Verified implementation outcome

Implementation checkpoint:

`6970a313768045d02c4c15a6235a510e5d25d458`

Direct dependency changes:

- `fflate` 0.8.2 -> 0.8.3;
- `react-router-dom` resolved from 7.18.1 to 7.18.4;
- `react-router` resolved from 7.18.1 to 7.18.4;
- `firebase-tools` 15.30.0 -> 15.31.0.

Compatible transitive remediation:

- `postcss` 8.5.19 -> 8.5.28;
- `nanoid` 3.3.16 -> 3.3.19;
- `@xmldom/xmldom` 0.9.10 -> 0.9.12;
- `tar` 7.5.20 -> 7.5.22;
- vulnerable `brace-expansion` 5.0.7 resolved to 5.0.12.

No major-version upgrade, dependency override, or `npm audit fix --force` was used.

### Security result

Production-only audit after remediation:

- 0 total findings;
- 0 moderate;
- 0 high;
- 0 critical.

Full-tree audit after remediation:

- 5 total findings;
- 5 moderate;
- 0 high;
- 0 critical.

The remaining five findings are confined to the current `firebase-tools` development/tooling dependency graph and involve the reported `@opentelemetry/core` / `@google-cloud/pubsub` and `uuid` / `gaxios` paths.

`firebase-tools` 15.31.0 is the newest inspected 15.x candidate. npm does not offer a compatible non-forced resolution for these residuals. Its proposed `npm audit fix --force` path would install `firebase-tools` 14.23.0, a breaking downgrade.

That forced downgrade was intentionally rejected. These residual findings are not part of the production dependency audit and are explicitly characterized rather than hidden.

### Verification evidence

Targeted backup and HashRouter regression:

- 4 test files PASS;
- 30 tests PASS.

Canonical web-release-equivalent gate on the WORK-009 branch:

- TypeScript: PASS;
- ordinary Vitest suite: 63 files / 456 tests PASS;
- production Vite build: PASS;
- PWA build-artifact suite: 8 / 8 PASS;
- `npm run verify:web-release`: PASS;
- all generated JavaScript chunks remain below the WORK-008 500 kB contract;
- PWA precache remains 24 entries.

Local Firebase emulator regression:

- Firestore + Storage emulators: PASS;
- 6 Firebase persistence/rules test files PASS;
- 61 tests PASS.

Final dependency audits:

- `npm audit --omit=dev`: 0 vulnerabilities;
- full `npm audit`: 5 moderate development/tooling findings, 0 high, 0 critical.

`git diff --check`: PASS.

### Acceptance assessment

All WORK-009 acceptance conditions are satisfied:

- the application-relevant `fflate` finding is removed;
- React Router is outside the reported vulnerable range;
- PostCSS and nanoid baseline findings are removed;
- all compatible non-major high-severity tooling fixes were applied;
- production dependency audit is clean;
- no baseline high or critical finding remains in the full tree;
- the five non-production moderate residuals are explicitly characterized;
- no unsafe forced fix or breaking downgrade was accepted;
- backup, routing, release, PWA, Firestore, Storage, and persistence regression gates pass.

WORK-009 is therefore COMPLETE / PROMOTED.

## Canonical promotion and reverification

WORK-009 was fast-forward promoted to canonical local `main` at:

`151ca2d05af9a0eacea4dcc1c70fc26a5efb017e`

Canonical reverification passed:

- `npm ci`: PASS;
- production audit: 0 vulnerabilities;
- full-tree audit: 5 moderate / 0 high / 0 critical, matching the characterized `firebase-tools` development-tooling residual;
- Firebase emulator/rules suite: 6 files / 61 tests PASS;
- TypeScript: PASS;
- ordinary Vitest suite: 63 files / 456 tests PASS;
- production build: PASS;
- PWA build-artifact suite: 8 / 8 PASS;
- `git diff --check`: PASS;
- canonical worktree remained clean.

GAP-003 is canonically RESOLVED. Remote synchronization is handled separately from this local canonical closure.
