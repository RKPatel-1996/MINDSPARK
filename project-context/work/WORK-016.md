# WORK-016 - Source URL Protocol Hardening

Status: REGISTERED / NOT_STARTED

Base: `cd31db21174f3a833873ea33e9fa0e21c192a7b8`

Planned branch: `task/work-016-source-url-protocol-hardening-v1`

Derived from: `DISC-002` MSS-01 and post-WORK-015 candidate revalidation

Date registered: 2026-09-28

## Problem

Canonical revalidation after WORK-015 confirms that structured KnowledgeItem source URLs remain governed only by generic URL syntax validation.

Current behavior:

- the KnowledgeItem source schema accepts `z.string().url().optional()`;
- Library renders structured `source.url` directly into an anchor `href`;
- Review renders structured `source.url` directly into an anchor `href`;
- those anchors use `target="_blank"` and `rel="noopener noreferrer"`;
- Markdown rendering already has separate unsafe-link handling, but that does not establish the structured source-link protocol contract;
- no focused structured-source regression currently demonstrates rejection or neutralization of non-web protocols.

`DISC-002` MSS-01 therefore remains current.

## Aim

Establish an explicit, testable protocol contract for user-controlled structured source URLs so normal source links cannot produce executable or otherwise unintended navigation schemes.

The likely bounded contract is explicit web-protocol allowlisting, with `http:` and `https:` as the design baseline. The final validation/rendering boundary must be selected only after focused reconnaissance establishes compatibility implications for persisted data, imports, backup/restore, and existing source-link rendering.

## Required reconnaissance before implementation

Before production changes:

1. trace the authoritative KnowledgeItem source schema and all constructors/import paths;
2. trace Firestore DTO parsing and persistence behavior for source URLs;
3. trace backup validation, export, restore, and legacy-data parsing;
4. inspect every structured source-link rendering surface;
5. distinguish structured KnowledgeItem sources from Markdown-content links;
6. characterize how current `z.string().url()` treats representative protocols;
7. determine the explicit allowed-protocol contract;
8. determine safe behavior for legacy persisted records containing a syntactically valid but disallowed protocol;
9. establish RED tests before modifying the authoritative contract.

## Scope

In scope:

- structured KnowledgeItem source URL validation;
- explicit source-protocol policy;
- Library structured source rendering;
- Review structured source rendering;
- import/schema validation as required by the authoritative source contract;
- backup/restore compatibility where the same KnowledgeItem schema is involved;
- legacy-data behavior characterization;
- focused security and regression tests.

## Acceptance

WORK-016 is complete only when:

- the structured source URL protocol contract is explicit and documented;
- ordinary valid web source URLs remain accepted and rendered normally;
- disallowed structured source protocols cannot become active navigation targets;
- domain/import behavior follows the selected protocol contract;
- Library and Review obey the same source-link safety contract;
- behavior for legacy persisted records with disallowed source protocols is explicitly characterized and tested;
- backup/restore semantics remain defined and compatible with the selected contract;
- Markdown content-link handling is not accidentally redesigned;
- focused source-link security regressions pass;
- relevant schema/import/backup/UI regressions pass;
- `npm run verify:web-release` passes;
- `git diff --check` passes;
- no Firebase deployment or production-data mutation occurs.

## Out of scope

Do not expand WORK-016 into:

- MSR-08 Library accessibility closure;
- MSR-09 viewport/mobile zoom work;
- MSS-02 backup resource-exhaustion work;
- generic HTML or Markdown sanitization redesign;
- Content Security Policy redesign unless reconnaissance proves it is required for this bounded defect;
- Firestore security-rule redesign;
- Firestore index changes;
- ReviewEvent work;
- backup-format redesign;
- migration or rewriting of production data;
- Firebase deployment;
- Storage enablement;
- billing changes;
- unrelated security hardening.

## Governance boundary

Live repository state is authoritative.

Registration does not authorize implementation.

The next bounded step is to create the planned task branch from the verified canonical base and perform focused read-only source-link reconnaissance. Production changes begin only after the protocol and legacy-data compatibility contract are understood.

No Firebase deployment, cloud mutation, production-data rewrite, Storage enablement, or billing change is authorized.
