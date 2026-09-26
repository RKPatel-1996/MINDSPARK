# WORK-008 - Production Bundle Performance Hardening

Status: ACTIVE

Base: `b51a0cd5d151c38f4911ebb9bf06c05b0b3de38f`

Branch: `task/work-008-bundle-performance-v1`

Derived from: `GAP-002`

## Aim

Reduce MindSpark's oversized initial production JavaScript bundle through evidence-driven code splitting while preserving application behavior, offline-first PWA semantics, routing, and the existing release contract.

This is a packaging/performance hardening work item. It must not change product semantics merely to obtain smaller bundle numbers.

## Verified baseline

WORK-007 and the WORK-008 reconnaissance measured the current production build as:

- main JavaScript bundle: approximately 1,930.59 kB minified;
- main JavaScript gzip size: approximately 527.27 kB;
- PWA precache: approximately 2,386.22 KiB;
- Vite emits its default >500 kB chunk warning;
- no deliberate application-level lazy loading exists;
- no explicit `manualChunks` strategy exists.

Current composition evidence:

- `src/App.tsx` statically imports Review, Library, Insights, and Settings;
- all four surfaces are mounted as HashRouter routes;
- Review and Library statically import the shared Markdown/math `ContentRenderer`;
- `ContentRenderer` statically imports React Markdown, GFM, math, and KaTeX processing;
- global KaTeX CSS is imported by `src/index.tsx`.

## Phase A - Route/surface code splitting

Implement top-level route lazy loading at the existing `src/App.tsx` routing boundary.

Required behavior:

- keep ThemeProvider, ApplicationProvider, HashRouter, and ShellLayout eager;
- lazy-load Review, Library, Insights, and Settings as separate route surfaces or equivalent generated chunks;
- use an accessible, non-disruptive Suspense/loading fallback;
- preserve `/review`, `/library`, `/insights`, `/settings`, and fallback redirect behavior;
- preserve existing keyboard navigation;
- preserve direct hash-route loading;
- preserve offline/PWA route availability after installation;
- do not change application/domain semantics.

After Phase A, rebuild and record exact chunk composition and sizes before deciding whether additional splitting is warranted.

## Phase B - Evidence-driven secondary splitting

Phase B is conditional.

If Phase A does not satisfy the acceptance targets, inspect the generated chunk graph and address the actual remaining oversized contributors.

Permitted candidates include:

- Markdown/math rendering dependencies;
- Firebase/runtime dependencies;
- React/router/vendor groups;
- other large shared dependencies proven by build evidence.

Do not introduce arbitrary fragmentation.

Do not use `chunkSizeWarningLimit` to hide the problem.

Do not add a bundle-analysis dependency unless existing repository/build evidence proves insufficient and the dependency change is separately justified.

## PWA requirements

Code splitting must preserve offline-first behavior.

Because generated application JavaScript is covered by the existing Workbox precache glob, emitted route chunks must remain part of the production precache unless a separately justified design change is made.

Verify that:

- required generated route chunks are represented in the production PWA artifact set;
- installed/offline navigation assumptions are not weakened;
- service-worker update behavior remains valid;
- total precache size does not materially regress merely because of chunk fragmentation.

## Acceptance

WORK-008 is complete only when:

- application-level code splitting is present and verified in the production build;
- top-level route surfaces are no longer all statically included through `src/App.tsx`;
- the initial/main JavaScript gzip size is reduced by at least 20% from the 527.27 kB baseline, or stronger measured evidence demonstrates an equivalent startup improvement;
- no generated JavaScript chunk exceeds Vite's default 500 kB minified warning threshold;
- the large-chunk warning is eliminated without increasing `chunkSizeWarningLimit`;
- PWA precache size does not regress by more than 5% from the approximately 2,386.22 KiB baseline without explicit evidence justifying the increase;
- HashRouter and direct-route behavior remain correct;
- existing Review, Library, Insights, Settings, content rendering, and navigation behavior remain correct;
- TypeScript passes;
- targeted routing/code-splitting tests pass;
- the ordinary test suite passes;
- production build passes;
- PWA build-artifact verification passes;
- `npm run verify:web-release` passes;
- before/after bundle and PWA measurements are recorded;
- `GAP-002` is updated only after the acceptance evidence supports resolution.

## Constraints

- No feature redesign.
- No FSRS or scheduler-semantic changes.
- No persistence-model changes.
- No Firebase rules or cloud-state changes.
- No deployment.
- No billing or Storage enablement.
- No dependency-security remediation inside this work item; `GAP-003` remains separate.
- No warning-limit suppression as a substitute for optimization.
- No dependency upgrades unless separately justified by bundle work.
- Preserve HashRouter and current GitHub Pages-compatible routing.
- Preserve the existing PWA update model.
- Preserve historical and governance records.

## Initial implementation decision

Start with route-level lazy loading because canonical source provides a stable top-level split boundary in `src/App.tsx`.

Measure the resulting production build before introducing `manualChunks` or deeper component-level splitting.
