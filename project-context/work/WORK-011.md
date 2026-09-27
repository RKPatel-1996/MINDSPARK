# WORK-011 - ReviewEvent Firestore Rule Parity

Status: COMPLETE / PROMOTED

Base: `904d6a3d9cd2842af1c8a8638180538948f6f3ba`

Planned branch: `task/work-011-review-event-rule-parity-v1`

Derived from: `GAP-005`

## Aim

Bring Firestore ReviewEvent create validation into feasible, representation-aware parity with the authoritative application-domain ReviewEvent contract while preserving owner isolation, append-only immutability, offline-first behavior, restore compatibility, and normal review persistence.

## Verified starting defect

The authoritative Firestore source is `firestore.rules.template`.

Current ReviewEvent create rules verify:

- owner path;
- document ID equals event ID;
- server-received timestamp uses `request.time`;
- required and allowed top-level fields;
- broad primitive/container types;
- append-only immutability.

They do not currently enforce several application-domain constraints, including:

- rating enum membership;
- card-type enum membership;
- card-type/objective-correctness consistency;
- non-empty device identity;
- ReviewEvent schema version literal;
- optional duration integer/non-negative semantics;
- scheduler metadata required structure and field types;
- scheduler numeric bounds;
- opaque UUID identifier form where feasible in Firestore Rules.

The existing emulator fixture also treats incomplete scheduler metadata such as `{ algo: 'test' }` as a valid ReviewEvent even though it does not satisfy the domain schema.

See:

- `project-context/gaps/GAP-005.md`;
- `project-context/discoveries/DISC-002.md`;
- `firestore.rules.template`;
- `src/v2/domain/event.ts`;
- `src/v2/domain/card.ts`;
- `src/v2/domain/id.ts`;
- `src/v2/persistence/firebase/__tests__/firestore.rules.test.ts`.

## Scope

Implement the smallest rule/test change required to enforce feasible ReviewEvent domain parity at the Firestore boundary.

At minimum evaluate and, where Firestore Rules supports the equivalent constraint, enforce:

- `rating` in `again | hard | good | easy`;
- `cardType` in `free_recall | flashcard | mcq | true_false | cloze`;
- boolean `objectiveCorrect` for `mcq` and `true_false`;
- null `objectiveCorrect` for `free_recall`, `flashcard`, and `cloze`;
- non-empty `deviceId`;
- `schemaVersion == 1`;
- `durationMs`, when present, is an integer and non-negative;
- scheduler metadata required fields:
  - `algorithm`;
  - `implementation`;
  - `implementationVersion`;
  - `parameterSetId`;
  - `scheduledDays`;
  - `stability`;
  - `difficulty`;
  - `desiredRetention`;
- non-empty scheduler identity strings;
- `scheduledDays >= 0`;
- `stability >= 0`;
- `difficulty` between 0 and 10;
- `desiredRetention` between 0.7 and 0.99;
- opaque UUID identifier format for ReviewEvent identifiers where rules-language support and compatibility permit.

Rules must remain representation-aware: persisted Firestore timestamp representations must continue to match the repository mapper rather than copying the in-memory Zod representation mechanically.

## Acceptance

WORK-011 is complete only when:

- valid normal application ReviewEvents are accepted;
- valid restore-created ReviewEvents are accepted;
- invalid rating values are rejected;
- invalid card types are rejected;
- invalid objective-correctness/card-type combinations are rejected;
- invalid schema versions are rejected;
- malformed scheduler metadata is rejected;
- scheduler numeric-bound violations are rejected;
- invalid optional duration values are rejected;
- required identity strings cannot be empty;
- feasible opaque-ID validation is enforced or any rules-language limitation is explicitly characterized;
- owner isolation remains unchanged;
- ReviewEvents remain create-only / append-only;
- existing WORK-010 terminal-rejection behavior remains correct;
- focused Firestore rules tests pass;
- relevant Firestore repository/backup-restore emulator tests pass;
- ordinary release verification passes;
- `git diff --check` passes;
- no Firebase deployment, production cloud mutation, Storage enablement, or billing change occurs.

## Out of scope

Do not expand WORK-011 into:

- scheduler algorithm changes;
- ReviewService workflow redesign;
- GAP-004 persistence acknowledgement changes;
- ReviewEvent migration or rewriting historical evidence;
- generic Firestore schema redesign;
- query/index redesign;
- backup-format redesign;
- deployment;
- unrelated security hardening.

## Verified implementation

Implementation commit:

- `8f96e79` - `fix(firestore): enforce ReviewEvent rule parity`

Implemented in the authoritative `firestore.rules.template`:

- opaque UUID validation for ReviewEvent, card, and knowledge-item identifiers;
- ReviewEvent rating enum validation;
- card-type enum validation;
- card-type/objective-correctness consistency;
- non-empty device identity;
- optional non-negative integer `durationMs`;
- required scheduler metadata structure and field types;
- non-empty scheduler identity strings;
- scheduler numeric bounds;
- `schemaVersion == 1`;
- existing owner isolation, server-received timestamp enforcement, top-level field contract, and append-only semantics preserved.

The rule remains representation-aware: persisted ReviewEvent timestamps are validated as Firestore timestamps, matching the repository mapper and restore gateway.

Scheduler metadata requires the application-domain fields and their constraints but does not add a nested `hasOnly(...)` restriction, because the authoritative application-domain scheduler metadata schema is not strict. Backup input remains independently stricter.

## Verification

Verified on the WORK-011 task branch:

- RED characterization before the rule change: 18 new domain-parity assertions failed because the existing rule accepted malformed ReviewEvents;
- focused Firestore security-rule suite after implementation: 33 / 33 PASS;
- repository Firebase rule/emulator gate: 6 files / 81 tests PASS;
- B8 Stage 1 representative backup/restore: 7 / 7 PASS;
- Firebase restore gateway: 9 / 9 PASS;
- Firestore ReviewEvent repository emulator suite: 9 / 9 PASS, including WORK-010 terminal rejection characterization;
- targeted WORK-010/application regressions: 3 files / 27 tests PASS;
- TypeScript: PASS;
- ordinary Vitest suite: 63 files / 458 tests PASS;
- production Vite/PWA build: PASS;
- PWA artifact verification: 8 / 8 PASS;
- `npm run verify:web-release`: PASS;
- `git diff --check`: PASS;
- no Firebase deployment, production cloud mutation, Storage enablement, or billing change occurred.

All WORK-011 acceptance criteria are satisfied. The verified WORK-011 branch was fast-forward promoted to canonical `main`, and canonical `main` was synchronized with `origin/main` at `8012cc8273b41818aeeacc08272362b011bc856b`.

## Governance boundary

Live repository state is authoritative.

Before implementation:

1. create the bounded branch from the verified canonical base;
2. re-read `AGENTS.md`;
3. inspect `firestore.rules.template`, rule-generation scripts, repository mappers, ReviewEvent schema, and existing emulator fixtures;
4. establish a domain-to-rules parity matrix before editing the template;
5. change the canonical template, never `.generated/*` directly;
6. regenerate test rules through the existing preparation command;
7. verify restore/application-created ReviewEvents before accepting stricter rules.

No production Firebase deployment is authorized by WORK-011.