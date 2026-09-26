# WORK-009 - Production Dependency Security Remediation

Status: ACTIVE

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
