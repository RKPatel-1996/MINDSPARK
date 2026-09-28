# WORK-016 - Source URL Protocol Hardening

Status: IN_PROGRESS

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

## Selected protocol contract

Focused reconnaissance and runtime characterization establish a layered compatibility contract.

### Characterized current behavior

The current `sourceReferenceSchema` uses generic `z.string().url()` validation.

Runtime characterization on the repository's installed Zod version confirmed that the stored/domain schema accepts:

- `https:`
- `http:`
- `javascript:`
- `data:`
- `file:`
- `mailto:`
- `ftp:`
- `blob:`

Protocol-relative and relative-path values were rejected.

The same domain KnowledgeItem schema is used when Firestore KnowledgeItems are decoded. The backup contract also derives its source shape from the same legacy-compatible source-reference schema.

Therefore, changing the stored/domain schema itself to HTTP/HTTPS-only would risk making already-persisted or restored legacy KnowledgeItems unreadable.

### Selected layered authority

1. Stored/domain compatibility

   `sourceReferenceSchema` remains capable of decoding legacy syntactically valid absolute URLs.

   WORK-016 must not require migration or rewriting of existing persisted KnowledgeItems merely because an old structured source uses a non-web protocol.

2. New import authority

   New normal import drafts may use a structured source URL only when parsing yields exactly:

   - `http:`
   - `https:`

   Other protocols are invalid for new imports.

   This restriction belongs at the import boundary rather than the legacy stored-data decoder.

3. Navigation authority

   Library and Review may render a structured source as an active anchor only when its URL parses successfully and its protocol is exactly `http:` or `https:`.

   A stored legacy source URL using another protocol must never become an active navigation target.

4. Legacy display behavior

   A syntactically stored legacy non-web URL remains preserved as source metadata.

   Library and Review may display the original URL as inert text so information is not silently discarded, but must not create an anchor for it.

5. Backup and restore

   Backup export and restore remain capable of preserving legacy structured source URLs accepted by the existing stored-data contract.

   A restored non-web legacy URL remains inert under the navigation rule.

   WORK-016 does not redesign the backup format.

6. Markdown separation

   Markdown-content link handling remains a separate rendering path and is not redesigned by WORK-016.

7. Cloud boundary

   No Firestore security-rule change, Firestore-index change, Storage change, production-data migration, or Firebase deployment is required by the selected contract.

### Required RED evidence

Before production implementation, permanent tests must demonstrate the current defect at these boundaries:

- protocol helper / navigation policy:
  - accepts `http:`;
  - accepts `https:`;
  - rejects `javascript:`;
  - rejects `data:`;
  - rejects `file:`;
  - rejects `mailto:`;
  - rejects `ftp:`;
  - rejects `blob:`;
  - rejects malformed or relative values;

- import:
  - a new structured HTTPS source remains valid;
  - representative disallowed non-web structured source URLs are rejected;

- Library:
  - valid HTTPS source renders as an anchor;
  - legacy disallowed source URL remains visible but is not rendered as a link;

- Review:
  - valid HTTPS source renders as an anchor;
  - legacy disallowed source URL remains visible but is not rendered as a link;

- stored-data compatibility:
  - the legacy/domain source schema continues to parse representative syntactically valid non-web URLs;
  - Firestore/domain decoding compatibility is not tightened by the navigation/import policy;

- backup compatibility:
  - the portable backup contract continues to accept and preserve representative legacy non-web source URLs.

The permanent RED phase must fail because import and structured-source rendering do not yet enforce this layered policy, not because of compile errors or unrelated fixture failures.
