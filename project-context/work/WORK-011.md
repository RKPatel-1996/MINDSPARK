# WORK-011 - ReviewEvent Firestore Rule Parity

Status: REGISTERED / NOT_STARTED

Base: `5d3e108a9e6975e2b43724025fa9e19b2ab2a476`

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