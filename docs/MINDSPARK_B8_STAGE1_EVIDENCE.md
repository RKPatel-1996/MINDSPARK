# MindSpark B8 Stage 1 Evidence

## Status

B8 Stage 1 exercised the frozen local and Firebase Emulator Suite scenarios. Cloud, browser, and installed-PWA scenarios remain blocked and are not represented as passed.

- Run ID: `20260922T033450Z`
- Execution commit: `4485640f46c7f0fcc52ecf36d5a12ad8f3841701`
- Environment aliases: `LOCAL`, `FIREBASE_EMULATOR`, `B8_OWNER`, `B8_NONOWNER`
- Source data: synthetic only
- Cloud access: none
- Archive SHA-256: `be5bd95e9f9a7cceff87320e83e83998e42873a95bdcd6391393a801f4684107`
- Compressed archive size: 1,734 bytes
- Archive structure: one `backup.json` member and one media member
- Raw archive retention: deleted after verification

No credentials, tokens, owner UIDs, raw backup contents, personal data, or raw media are recorded here.

## Synthetic dataset

The representative V1 source contained:

- one domain, one topic, and one subtopic;
- two allowed tags;
- valid V1 settings;
- one active and one historical scheduler parameter set;
- two KnowledgeItems, one active with media and one archived without media;
- one active card and one suspended card;
- one immutable ReviewEvent referencing the historical parameter set;
- one deterministic image payload with declared PNG MIME type, byte length, and SHA-256.

Derived emulator states covered empty, matching, dependency-valid partial, immutable-record conflict, media conflict, and explained partial execution.

## Scenario records

| Scenario ID | Run ID | Commit | Environment class | Archive SHA-256 | Expected outcome | Observed outcome | Result | Sanitized diagnostic reference | Defect reference | Cleanup status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| B8-01 | `20260922T033450Z` | `4485640` | LOCAL | `be5bd95e...4684107` | Valid V1 representative archive; source unchanged | Two items, two cards, one event, two parameter sets, one media entry; source unchanged; 1,734-byte archive | PASS | `b8Stage1BackupRestore.test.ts / B8-01` | N/A | Raw archive deleted after gates |
| B8-02 | `20260922T033450Z` | `4485640` | LOCAL + FIREBASE_EMULATOR | `be5bd95e...4684107` | Strict parse and write-free preview | Preview reported 9 record inserts, 0 no-ops, 0 conflicts, one media file; target unchanged | PASS | `b8Stage1BackupRestore.test.ts / B8-02` | N/A | Emulator cleared |
| B8-03 | `20260922T033450Z` | `4485640` | FIREBASE_EMULATOR | `be5bd95e...4684107` | Empty target receives expected records/media only | Complete result; 9 record inserts plus one media insert; expected entity counts and canonical media path verified | PASS | `b8Stage1BackupRestore.test.ts / B8-03` | N/A | Emulator cleared |
| B8-04 | `20260922T033450Z` | `4485640` | FIREBASE_EMULATOR | `be5bd95e...4684107` | Fresh inspection becomes entirely no-op | Preview reported 0 inserts and 9 record no-ops; execution reported 10 no-ops including media; target unchanged | PASS | `b8Stage1BackupRestore.test.ts / B8-04` | N/A | Emulator cleared |
| B8-05 | `20260922T033450Z` | `4485640` | FIREBASE_EMULATOR | `be5bd95e...4684107` | Insert only missing compatible records | Only item B and card B inserted; existing item, card, event, media, taxonomy, settings, and parameter sets remained unchanged | PASS | `b8Stage1BackupRestore.test.ts / B8-05` | N/A | Emulator cleared |
| B8-06 | `20260922T033450Z` | `4485640` | FIREBASE_EMULATOR | `be5bd95e...4684107` | Immutable record conflict; zero restore writes | One ReviewCard conflict; executor rejected unsafe plan; conflicting target and all other state unchanged | PASS | `b8Stage1BackupRestore.test.ts / B8-06` | N/A | Emulator cleared |
| B8-07 | `20260922T033450Z` | `4485640` | FIREBASE_EMULATOR + deterministic media seam | `be5bd95e...4684107` | Media conflict; existing media unchanged; zero downstream writes | `media_conflict`; zero completed operations; conflicting bytes preserved; no records inserted | PASS | `b8Stage1BackupRestore.test.ts / B8-07` | N/A | Media seam and emulator cleared |
| B8-08 | `20260922T033450Z` | `4485640` | FIREBASE_EMULATOR + test seam | `be5bd95e...4684107` | Explained incomplete execution with completed and failed operation IDs | `firestore_failure` at first item; media, two parameter sets, and taxonomy identified as completed; no unexplained records or settings | PASS | `b8Stage1BackupRestore.test.ts / B8-08` | N/A | Emulator cleared |
| B8-09 | `20260922T033450Z` | `4485640` | LOCAL | N/A | Rejected execution consumes preview and requires fresh inspection | Repeated click executed once; restore remained unavailable until archive reselection and inspection | PASS | `BackupRestoreSection.test.tsx / rejected plan` | N/A | Mock state disposed |
| B8-10 | `20260922T033450Z` | `4485640` | LOCAL | N/A | Authority change invalidates completed preview | Workflow replacement immediately removed filename, preview, and restore control | PASS | `BackupRestoreSection.test.tsx / authority change` | N/A | Mock state disposed |
| B8-11 | `20260922T033450Z` | `4485640` | LOCAL | N/A | Stale pending result cannot reactivate restore | Old promise resolution was ignored; only a fresh inspection under the new workflow enabled restore | PASS | `BackupRestoreSection.test.tsx / stale inspection` | N/A | Mock state disposed |
| B8-12E | `20260922T033450Z` | `4485640` | FIREBASE_EMULATOR | N/A | Non-owner Firestore reads/writes denied | Non-owner access to its own path and owner path failed; owner-to-other path also failed | PASS | `firestore.rules.test.ts / cross-owner cases` | N/A | Emulator cleared |
| B8-13E | `20260922T033450Z` | `4485640` | FIREBASE_EMULATOR | N/A | Non-owner Storage read/create denied; media unchanged | Non-owner upload and download-URL access failed under Storage rules | PASS | `storage.rules.test.ts / non-owner case` | N/A | Emulator cleared |

## Verification results

| Gate | Result |
| --- | --- |
| Exact B8 Stage 1 emulator harness | PASS — 1 file, 7 tests |
| Focused B1–B7 backup/restore tests | PASS — 7 files, 63 tests |
| Complete Firebase emulator suite (`npm run test:rules`) | PASS — 6 files, 60 tests |
| TypeScript within `npm run verify:web-release` | PASS |
| Ordinary suite within `npm run verify:web-release` | PASS — 52 files, 428 tests |
| Clean production build and PWA artifact verification | PASS — 1 file, 7 tests |
| `git diff --check` | PASS after evidence update |
| Cloud browser Backup smoke | PENDING — Stage 2 blocked |
| Installed-PWA Backup smoke | PENDING — Stage 2 blocked |

## Findings

No B1–B7 product defect was demonstrated.

Initial harness runs exposed test-only integration issues before acceptance evidence was recorded:

- the installed Vitest API did not provide the attempted `describe.sequential` helper;
- the first emulator harness used a project ID different from the emulator process;
- the modular production Storage API did not complete when passed the rules-unit-testing compatibility Storage instance.

The final Stage 1 harness therefore follows the repository's established boundary: real Firestore transactions run against the emulator, deterministic media execution uses the service-layer media seam, and actual Storage authorization is verified by the Storage emulator rules suite. Real configured Storage round-trip remains a mandatory Stage 2 cloud scenario and is not claimed by Stage 1.

## Scope confirmation

Stage 1 did not:

- access production or authoritative user data;
- link or modify billing;
- configure or access `B8_NONPROD`;
- enable cloud Firebase services;
- deploy rules or application artifacts;
- execute browser or installed-PWA cloud scenarios;
- merge or push the branch.

## Stage 2 blockers

Stage 2 remains blocked until the billing health warning clears and the frozen cloud-unblock checklist is completed. Required pending evidence includes the real configured browser workflow, actual Firebase Storage media round-trip, cloud cross-owner confirmation, installed-PWA workflow, and final release-readiness decision.
