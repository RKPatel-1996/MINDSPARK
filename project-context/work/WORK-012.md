# WORK-012 - Direct Off-site Recovery Points

Status: IN_PROGRESS

Base: `eb9074e760495c3a97257bb420dbfae6af7cfce2`

Planned branch: `task/work-012-automated-offsite-recovery-points-v1`

Derived from: 2026-09-27 durability and disaster-recovery reconnaissance

## Aim

Add direct, validated, off-site recovery points for MindSpark so the user can explicitly create an independent recovery archive in private GitHub storage instead of relying only on the live Firestore state, browser storage, or the current device installation.

Reuse the existing authoritative V1 `.mindspark-backup` export and manual restore contracts rather than creating a second backup representation.

The intended recovery model is:

`MindSpark authenticated application -> existing read-only backup source -> BackupSnapshotService -> BackupRecoveryPointService -> validated .mindspark-backup + SHA-256 -> private GitHub Release asset`

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

The verified GitHub storage representation is one dedicated private repository with one long-lived MindSpark recovery-points Release. Each user-triggered backup uploads a uniquely named `.mindspark-backup` Release asset as raw binary data rather than committing the binary to Git history. The application will verify the uploaded asset against the locally computed SHA-256 when GitHub supplies its asset digest. Bounded retention uses a deliberately simple fixed-count policy: keep the newest 30 MindSpark `.mindspark-backup` Release assets and delete older MindSpark backup assets only after the newly requested recovery point has uploaded successfully. Retention must never select the just-uploaded asset for deletion. Unrelated Release assets are ignored. If listing or deletion fails, the successful new recovery point remains stored and the operation reports the retention failure rather than rolling back or deleting the newest known-good backup.

GitHub authentication will use a fine-grained PAT restricted to the dedicated backup repository with only the minimum repository permission required for Release asset operations. The application will target an already-created Release rather than requiring permission to create repository workflows or other automation.

GitHub off-site configuration is strictly device-local and must not use the Firestore-backed MindSpark Settings repository. Non-secret connection values (GitHub owner, repository name, and Release ID) may be persisted in browser `localStorage` for convenience. The PAT is session-only: it may be held in component memory and/or browser `sessionStorage`, must be cleared with the browser/PWA session, and must never be written to `localStorage`, IndexedDB, Firestore, backup archives, URLs, or application logs. Losing the session credential is acceptable; the user can paste the PAT again before the next off-site backup.

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

Implement the smallest direct off-site recovery path that reuses MindSpark's existing validated V1 backup contract and requires no unattended cloud execution, scheduler, service account, or paid-required infrastructure.

### Recovery-point generation boundary

The user-triggered application path must:

- read the authenticated user's authoritative backup source through the existing repository interfaces;
- expose only the read operations required by backup snapshot generation;
- reuse `BackupSnapshotService`, `BackupExportService`, and the existing V1 backup contract rather than introducing a second backup representation;
- emit the normal supported `.mindspark-backup` archive;
- validate the backup before serialization;
- compute a SHA-256 digest for the completed archive;
- preserve text-only operation when Firebase Storage is not configured;
- fail closed when required legacy image bytes cannot be read.

The off-site backup path must not perform restore operations or normal application-data writes.

### GitHub authentication and device-local configuration

Use a fine-grained GitHub PAT restricted to the dedicated private backup repository and only the minimum repository permission required for Release asset operations.

Non-secret connection configuration may persist locally:

- GitHub owner;
- repository name;
- existing Release ID.

The PAT is session-only. It may exist in component memory and/or browser `sessionStorage`, but must never be written to:

- `localStorage`;
- IndexedDB;
- Firestore;
- a `.mindspark-backup` archive;
- Git;
- URLs;
- application logs.

The user may paste the PAT again after the browser/PWA session ends.

No Google Cloud service account, GitHub Actions identity, OIDC/WIF configuration, scheduler identity, or billing activation is required.

### Off-site storage

Use a dedicated private GitHub repository as the off-site recovery location.

Use one long-lived MindSpark recovery-points Release.

Each successful user-triggered backup uploads a uniquely named `.mindspark-backup` file as a raw GitHub Release asset rather than committing backup binaries to normal Git history.

When GitHub supplies a Release-asset digest, it must agree with the locally computed archive SHA-256.

A failed upload must not overwrite or destroy an older known-good recovery point.

### Retention

Use one deliberately simple bounded policy:

- retain the newest 30 MindSpark `.mindspark-backup` Release assets;
- apply retention only after the newly requested recovery point uploads successfully;
- never select the newly uploaded asset for deletion;
- ignore unrelated Release assets;
- delete selected older MindSpark assets from oldest to newest.

If asset listing or deletion fails after upload, keep the newly uploaded recovery point and report the retention failure. Do not roll back the successful upload.

Automatic daily scheduling, daily/weekly/monthly tiering, and stale/missed-backup monitoring are not WORK-012 requirements.

### Failure handling

The user-triggered operation must surface failure of:

- authoritative source reads;
- backup validation;
- archive generation;
- required media reads;
- SHA-256/integrity verification;
- GitHub upload;
- retention listing or deletion.

An upload failure must not be reported as success.

A post-upload retention failure must be distinguished from upload failure because the new recovery point is already safely stored.
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

- the authenticated application can read the complete authoritative V1 backup source through the bounded read-only backup interface;
- the recovery-point path does not expose normal application-data mutation or restore authority;
- the existing `.mindspark-backup` representation is reused unchanged;
- the generated archive passes the existing backup validator;
- archive SHA-256 is generated;
- GitHub-supplied asset SHA-256 is verified when GitHub provides the digest;
- text-only production-compatible recovery points work without Firebase Storage;
- legacy-media behavior remains fail-closed when required image bytes cannot be read;
- a user-triggered operation can upload a uniquely named recovery point to the configured private GitHub Release;
- failed upload cannot destroy or overwrite an older known-good recovery point;
- fixed-count retention keeps the newest 30 MindSpark recovery assets;
- unrelated Release assets are ignored by retention;
- the just-uploaded asset cannot be selected for retention deletion;
- retention failure after upload preserves the newly uploaded recovery point and is reported distinctly;
- owner, repository, and Release ID are device-local rather than Firestore-backed settings;
- the GitHub PAT is session-only and is absent from durable application storage, Firestore, backup archives, URLs, logs, and Git history;
- no Firebase/Google Cloud billing activation or paid-required service is necessary;
- ordinary application backup/export/restore behavior remains unchanged;
- recovery using a GitHub-produced archive is validated through the existing restore inspection path in a safe test or disposable environment;
- focused WORK-012 tests pass;
- relevant backup/restore regression tests pass;
- Firebase emulator/rules verification is performed if a change requires it;
- `npm run verify:web-release` passes;
- `git diff --check` passes;
- one live integration validation confirms the configured private GitHub repository, Release ID, fine-grained PAT, real Release-asset upload, and recovery inspection workflow.
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
