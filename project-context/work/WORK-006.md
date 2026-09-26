# WORK-006 — Desktop Settings Layout + AI Generation Prompt Surface

Status: ACTIVE

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
