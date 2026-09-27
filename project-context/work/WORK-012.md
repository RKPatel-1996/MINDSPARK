# WORK-012 - Direct Off-site Recovery Points

Status: IN_PROGRESS

Base: `eb9074e760495c3a97257bb420dbfae6af7cfce2`

Planned branch: `task/work-012-automated-offsite-recovery-points-v1`

Derived from: 2026-09-27 durability and disaster-recovery reconnaissance

## Aim

Add automatic, validated, off-site recovery points for MindSpark so loss or corruption of the live Firestore state, browser storage, device state, or application installation does not depend on the user having remembered to create a recent manual backup.

Reuse the existing authoritative V1 `.mindspark-backup` export and manual restore contracts rather than creating a second backup representation.

The intended recovery model is:

`Firestore -> read-only headless snapshot -> existing BackupSnapshotService -> existing BackupExportService -> validated .mindspark-backup -> SHA-256 -> private GitHub off-site storage`

Recovery remains explicit and manual through the existing MindSpark Backup UI.

## Approved scope amendment - 2026-09-27

The user approved a simpler, no-cost, user-triggered design. This amendment supersedes conflicting unattended-automation requirements elsewhere in this WORK item.

The approved recovery-point model is:

`MindSpark authenticated application -> existing repositories -> BackupSnapshotService -> BackupRecoveryPointService -> validated .mindspark-backup + SHA-256 -> direct upload to dedicated private GitHub backup repository`

The following previously considered architecture is abandoned for WORK-012:

- GitHub Actions scheduled backup execution;
- Google service accounts for Firestore backup reads;
- Workload Identity Federation / GitHub OIDC;
- a server-side `@google-cloud/firestore` or `firebase-admin` backup reader;
- automatic daily execution while MindSpark is closed;
- cloud scheduler infrastructure;
- stale scheduled-job detection.

The direct-upload design instead requires:

- the user explicitly initiates backup/upload from MindSpark;
- MindSpark uses its already-authenticated application repositories to read the user's data;
- the normal V1 `.mindspark-backup` representation remains authoritative;
- the archive SHA-256 remains part of the recovery-point integrity record;
- GitHub authentication uses a fine-grained credential restricted to the dedicated private backup repository and only the minimum permissions required by the selected upload API;
- the GitHub credential must never be written to Firestore, included in a backup archive, committed to Git, or emitted into application logs;
- no Firebase/Google Cloud billing activation or paid-required feature is introduced;
- restore remains explicit and manual.

The exact GitHub storage representation and bounded retention policy must favor the simplest no-cost implementation and will be selected only after the relevant GitHub API behavior is verified.

Automatic background backup and unattended server execution are no longer acceptance requirements for WORK-012.

## Verified starting condition

Reconnaissance on canonical `main` at `eb9074e760495c3a97257bb420dbfae6af7cfce2` established:

- Firestore is the live authoritative data store.
- Firestore persistent IndexedDB caching is enabled with `CACHE_SIZE_UNLIMITED`, but browser/device storage quotas remain outside application control.
- MindSpark already implements a versioned V1 `.mindspark-backup` export and restore workflow.
- The existing backup exporter returns raw archive bytes and does not depend on browser download APIs.
- `BackupUserWorkflowService` explicitly coordinates browser-independent backup operations.
- `BackupSnapshotService` gathers all authoritative V1 data through repository reads:
  - taxonomy;
  - settings;
  - scheduler parameter sets;
  - knowledge items;
  - review cards;
  - review events.
- Snapshot collection performs schema parsing, normalization, and source validation.
- `BackupExportService` performs final envelope validation before archive serialization.
- Existing Firestore repository implementations already expose all reads required for backup creation.
- Existing interactive application repository construction depends on a Firebase client `User` and is therefore not suitable as the unattended GitHub Actions authentication boundary.
- No automatic backup scheduler, rolling recovery-point mechanism, or missed-backup detector currently exists.
- `firebase-admin` is not currently a project dependency.
- No private GitHub backup repository has yet been created for this work.

## Scope

Implement the smallest independent automation path that can periodically create and retain validated MindSpark recovery archives without granting the backup job application-data write authority.

### Headless export boundary

Add a bounded Node/headless export entry point that:

- reads only the configured owner's authoritative backup source records;
- reuses the existing backup domain contract and validation logic wherever feasible;
- reuses `BackupSnapshotService` and `BackupExportService` rather than duplicating backup construction;
- uses a dedicated read-only persistence adapter suitable for unattended execution;
- does not construct or expose restore/write-capable repositories to the scheduled backup job;
- emits the normal supported `.mindspark-backup` format;
- computes and records an archive SHA-256 digest;
- fails closed if source reads, validation, archive generation, or integrity verification fail.

### Authentication

Use a non-interactive cloud authentication mechanism appropriate for GitHub Actions.

Prefer short-lived GitHub OIDC / Google Cloud Workload Identity Federation if feasible.

The scheduled backup identity must receive only the permissions required to read the owner's backup source data.

Do not give the routine backup path Firestore write, delete, restore, deployment, billing, or administrative authority.

Do not commit credentials or long-lived private keys to Git.

The selected unattended backup design must remain operable without enabling billing or adopting a feature that requires paid Firebase, Google Cloud, or GitHub service. Free-tier quotas may be used, but billing activation must not be a prerequisite. If a proposed authentication, execution, storage, or retention mechanism requires billing, it must be rejected or separately re-scoped rather than silently introduced.

### Off-site storage

Use a dedicated private GitHub repository as the off-site recovery location.

Store ordinary, unencrypted `.mindspark-backup` recovery archives plus non-sensitive integrity metadata.

Do not use ordinary Git source history as the primary binary-backup store if a GitHub storage mechanism designed for generated binary assets is practical.

The implementation should prefer GitHub Release assets or an equivalent bounded binary-artifact mechanism that does not cause indefinite Git object growth.

### Schedule and retention

Target one successful recovery point per day.

Retain approximately:

- daily recovery points for the most recent 30 days;
- weekly recovery points for the most recent 12 weeks;
- monthly recovery points for the most recent 24 months.

Retention logic must never delete the newest verified successful recovery point.

A failed current backup must not replace or invalidate an older valid recovery point.

### Failure detection

The automation must make failure visible.

At minimum detect and surface:

- scheduled export failure;
- source read failure;
- backup validation failure;
- archive generation failure;
- SHA-256/integrity failure;
- remote upload failure;
- absence of a sufficiently recent successful recovery point.

A failed run must not publish an archive as successful.

### Recovery

Do not automate restore.

Recovery remains:

1. choose a known-good recovery point;
2. download the `.mindspark-backup` archive;
3. use the existing MindSpark `Settings -> Backup` inspection workflow;
4. review the restore plan;
5. explicitly execute restore through the existing governed restore path.

## Acceptance

WORK-012 is complete only when:

- a headless process can read the complete authoritative V1 backup source state without interactive Google login;
- the headless path cannot perform normal application data writes through its supplied persistence interface;
- the normal existing backup format is reused unchanged unless an unavoidable incompatibility is discovered and separately governed;
- the resulting archive passes the existing backup validator;
- archive SHA-256 is generated and verified;
- a text-only production-compatible backup can be generated through the unattended path;
- legacy-media behavior remains fail-closed when required image bytes cannot be read;
- the scheduled job can create a recovery point in the dedicated private GitHub backup location;
- one failed run cannot destroy or overwrite the latest known-good recovery point;
- daily scheduling is configured;
- bounded daily/weekly/monthly retention is implemented and tested;
- stale/missed backup detection is implemented;
- recovery using a produced archive is validated through the existing restore inspection path in a safe test/disposable environment;
- backup automation credentials are absent from Git history;
- backup automation has no routine Firestore mutation authority;
- routine unattended backup operation does not require billing activation or a paid-required Firebase, Google Cloud, or GitHub feature;
- ordinary application backup/export/restore behavior remains unchanged;
- focused WORK-012 tests pass;
- relevant backup/restore tests pass;
- relevant Firebase emulator tests pass where required;
- `npm run verify:web-release` passes;
- `git diff --check` passes.

## Out of scope

Do not expand WORK-012 into:

- automatic restore;
- destructive rollback of production Firestore;
- redesign of the V1 backup format;
- encryption or passphrase management;
- Firestore PITR or managed-backup product adoption;
- Firebase Storage enablement solely for WORK-012;
- application UI redesign;
- scheduler/FSRS changes;
- ReviewEvent semantics changes;
- general Firebase deployment redesign;
- general Android/PWA longevity work;
- billing changes;
- unrelated GitHub repository automation.

Android/PWA long-term compatibility remains a separate reliability track after automated recovery is established.

## Governance boundary

Live repository state is authoritative.

Registration of WORK-012 does not authorize:

- creation of the private GitHub backup repository;
- GitHub token or repository-permission changes;
- Google Cloud IAM changes;
- Workload Identity Federation configuration;
- Firebase rule deployment;
- production data mutation;
- billing changes.

Those external configuration steps require an explicit reviewed boundary when implementation reaches them.

Before implementation:

1. create the bounded WORK-012 branch from the verified registration commit;
2. re-read `AGENTS.md`;
3. design a read-only headless persistence contract rather than reusing the full mutable `Repositories` interface blindly;
4. prove headless archive creation locally against controlled data before accessing production Firestore;
5. verify that the backup job possesses no production mutation capability;
6. preserve the existing manual backup/restore workflow unchanged;
7. introduce GitHub/cloud configuration only after the local headless path and tests are accepted.
