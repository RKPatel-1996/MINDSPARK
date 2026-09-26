# WORK-006 — Desktop Settings Layout + AI Generation Prompt Surface

Status: VERIFIED_PENDING_PROMOTION

Base: `fa44f03`

Branch: `task/work-006-settings-prompt-v1`

## Aim

Repair the desktop Settings experience so it uses available screen space effectively, and restore the intended external-AI knowledge-generation workflow by exposing a canonical MindSpark generation prompt from the existing import surface.

## Scope A — Desktop Settings layout

- Use desktop horizontal space substantially better than the current narrow `max-w-2xl` / `max-w-3xl` layout.
- Remove unnecessary horizontal tab scrolling on normal desktop widths.
- Preserve mobile and narrow-screen usability.
- Use responsive multi-column/grid layouts where sections naturally benefit.
- Avoid oversized sparse cards and unnecessary empty desktop space.
- Preserve existing Settings behavior and controls.

## Scope B — AI generation prompt surface

- Add a visible `Create with AI` workflow to the shared `ImportKnowledgeSection`.
- Because Library `+` and Settings both reuse this component, the feature must be available from both import entry points.
- Provide `Copy generation prompt`.
- Provide `View prompt`.
- Build the prompt through one canonical, testable prompt-builder function rather than duplicating large static prompt strings in UI components.
- Include the current taxonomy registry in the generated prompt:
  - allowed domains;
  - valid topic-to-domain relationships;
  - valid subtopic-to-topic relationships;
  - allowed tags.
- Explain the exact current AI import contract:
  - one `item`;
  - one or more `cards`;
  - five card types: `free_recall`, `flashcard`, `mcq`, `true_false`, `cloze`;
  - optional ordered `text`, `code`, and `math` content blocks;
  - optional source references using `title`, `url`, and/or `citation`.
- Require chatbot output to be JSON only and directly compatible with the MindSpark import textarea.
- Explicitly prohibit generated IDs, timestamps, lifecycle/status fields, FSRS/scheduler state, image/storage fields, and unsupported keys.
- Make clear that the user supplies the source/study material to the external chatbot together with this generated instruction prompt.
- Preserve existing automatic inspection, duplicate detection, normalized preview, and import behavior.

## Acceptance

### Desktop layout
- Settings makes materially better use of a normal laptop/desktop viewport.
- All Settings tabs are reachable without desktop horizontal scrolling at the supported desktop breakpoint.
- Mobile/narrow behavior remains usable.
- Existing Settings functionality remains regression-protected.

### Generator prompt
- Prompt builder output is deterministic for a supplied taxonomy registry.
- Prompt reflects the supplied taxonomy rather than a stale hard-coded taxonomy list.
- Prompt accurately describes every currently supported import card/block/source shape.
- Prompt forbids fields rejected by the strict import schema.
- Copy action places the canonical prompt on the clipboard and provides visible confirmation.
- View action allows the user to inspect the exact prompt being copied.
- Existing import tests continue to pass.

## Constraints

- External chatbots generate learning material; MindSpark itself does not call an AI service.
- Do not weaken strict import-schema or taxonomy validation.
- Do not auto-create taxonomy from AI output.
- Do not change Firestore, Firebase rules, billing, Storage, backup semantics, or FSRS behavior.
- No deployment.

## Implementation and verification

Implementation commit:

- `9bc7abd8bcfa64fc18be9779f579dd5e405770ce`
- `feat(ui): add AI generation prompt and responsive layouts`

Implemented product behavior:

- Added one canonical deterministic AI-generation prompt builder.
- Prompt is generated from the current persisted taxonomy registry.
- Added `Create with AI`, `Copy generation prompt`, and `View prompt` to the shared import surface.
- Existing automatic JSON inspection, duplicate detection, preview, and import behavior remains intact.
- Settings now uses responsive tabs with no horizontal tab scrolling.
- Settings uses a substantially wider desktop canvas while retaining narrow/mobile usability.
- Redundant visible destination titles were removed from Settings, Library, and Insights while semantic `h1` headings remain available to assistive technology.
- Library and Insights now use responsive desktop-width shells.
- Insights owns vertical scrolling explicitly.
- Review retains its deliberately constrained reading/focus width.
- Library import modal was widened for the generation/import workflow.

Automated verification:

- `npm run verify:web-release`: PASS.
- TypeScript `tsc --noEmit`: PASS.
- Ordinary Vitest suite: 62 files / 451 tests PASS.
- PWA production build: PASS.
- PWA build-artifact suite: 7/7 PASS.
- Final staged `git diff --cached --check`: PASS.
- Final implementation index contained exactly 8 intended files.
- Unstaged files before implementation commit: NONE.
- Untracked files before implementation commit: NONE.

Focused verification included:

- generation prompt builder: 8 tests PASS.
- generation prompt UI: 4 tests PASS.
- Settings responsive layout: 5 tests PASS.
- existing import preview regression: 11 tests PASS.
- affected Insights / Settings / Library UI regression set: 28/28 PASS.

Manual visual verification:

- Settings desktop layout: PASS.
- Settings narrow/mobile responsive tab grid: PASS.
- Library desktop and mobile layout: PASS.
- Insights desktop and mobile layout: PASS.
- Insights vertical scrolling: PASS after explicit scroll-wrapper repair.
- Review desktop/mobile constrained layout: accepted unchanged.
- Library `+` import workflow exposes Create with AI / Copy / View prompt as intended.

Known non-blocking output:

- Existing-style React `act(...)` warnings remain in unrelated/current tests.
- Rollup reports Zod annotation warnings during build.
- Vite reports the existing large-chunk advisory.
- These warnings did not fail the authoritative release gate.

Safety / scope confirmation:

- No Firebase rules changes.
- No Firestore state-shaping changes.
- No Storage enablement.
- No billing changes.
- No FSRS/scheduler semantic changes.
- No deployment.

## Promotion state

The WORK-006 implementation is verified on `task/work-006-settings-prompt-v1`.

Canonical-main promotion has not yet been performed.

Do not mark WORK-006 `COMPLETE / PROMOTED` until canonical `main` is updated and verified from the canonical worktree.
