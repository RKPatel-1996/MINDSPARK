# WORK-012 - Direct Off-site Recovery Points

Status: IN_PROGRESS

Base: `eb9074e760495c3a97257bb420dbfae6af7cfce2`

Branch: `task/work-012-automated-offsite-recovery-points-v1`

Derived from: 2026-09-27 durability and disaster-recovery reconnaissance

## Aim

Add direct, validated, off-site recovery points for MindSpark so the user can explicitly create an independent recovery archive outside the live Firestore state, browser cache, and current device installation.

Reuse the existing authoritative V1 `.mindspark-backup` export and governed restore contracts rather than introducing a second backup representation.

The current recovery-point path is:

`authenticated MindSpark application -> bounded read-only backup source -> BackupSnapshotService -> BackupRecoveryPointService -> validated .mindspark-backup + SHA-256 -> GitHub Contents API -> private MINDSPARK_BACKUPS/recovery-points repository folder`

Recovery remains explicit and manual.

## Approved architecture

The user approved a simple, no-cost, user-triggered architecture.

The following previously considered mechanisms are not part of WORK-012:

- GitHub Actions scheduled backup execution;
- Google service accounts for backup reads;
- Workload Identity Federation / GitHub OIDC;
- server-side `firebase-admin` or `@google-cloud/firestore` backup readers;
- automatic execution while MindSpark is closed;
- cloud scheduler infrastructure;
- stale scheduled-job detection;
- paid-required Firebase or Google Cloud backup infrastructure.

The implemented design instead requires:

- the user explicitly initiates backup from MindSpark;
- MindSpark reads through the authenticated application's existing repositories;
- the existing V1 `.mindspark-backup` representation remains authoritative;
- the completed archive is validated and SHA-256 hashed before off-site persistence;
- GitHub authentication uses a fine-grained PAT restricted to the dedicated private backup repository;
- the PAT requires repository Contents read/write authority for repository-file backup operations;
- no Firebase/Google Cloud billing activation or paid-required feature is introduced;
- restore remains explicit and manual.

## Authoritative off-site storage representation

The live WORK-012 GitHub target is:

- owner: `RKPatel-1996`;
- private repository: `MINDSPARK_BACKUPS`;
- active recovery directory: `recovery-points/`.

Each successful backup creates a uniquely named ordinary repository file:

`recovery-points/mindspark-<UTC timestamp>.mindspark-backup`

The file is committed through the GitHub Contents API on `api.github.com`.

GitHub Release assets and `uploads.github.com` are not part of the active architecture. The Release-asset gateway was retired after live browser testing demonstrated that authenticated binary upload to `uploads.github.com` was blocked by browser CORS.

After GitHub accepts a backup commit, MindSpark reads the committed file bytes back through the Contents API and verifies that:

- the remote byte length matches the generated archive;
- the remote SHA-256 matches the locally generated archive SHA-256.

The backup is not treated as successfully verified if those checks fail.

## Backup source and archive contract

The user-triggered path must:

- read authoritative data through the bounded backup repository interface;
- reuse `BackupSnapshotService`, `BackupExportService`, and the existing V1 backup contract;
- include taxonomy;
- include settings;
- include scheduler parameter sets;
- include knowledge items;
- include review cards;
- include review events;
- include required legacy media when supported and available;
- preserve text-only operation when Firebase Storage is not required;
- fail closed when required legacy media bytes cannot be read;
- validate before serialization;
- compute SHA-256 for the completed archive.

The off-site backup path has no restore authority and must not perform normal application-data mutation.

## GitHub authentication and device-local configuration

Non-secret GitHub connection configuration is device-local:

- GitHub owner;
- repository name.

The current defaults are:

- owner `RKPatel-1996`;
- repository `MINDSPARK_BACKUPS`.

Legacy V2 Release-tag connection configuration is migrated to the current V3 owner/repository-only schema.

The raw GitHub PAT must never be written to:

- `localStorage`;
- `sessionStorage`;
- Firestore;
- a `.mindspark-backup` archive;
- Git;
- URLs;
- application logs.

For convenience, the PAT may be retained on the current device by the dedicated credential store:

- plaintext PAT remains only in the application-memory runtime cache;
- persistent credential data is encrypted with AES-GCM through Web Crypto;
- encrypted credential state and the non-extractable CryptoKey are stored in IndexedDB;
- a fresh random IV is used for each credential save;
- clearing the credential removes both the memory cache and IndexedDB credential;
- persistence failure falls back to memory-only operation;
- decryption failure makes the credential unavailable.

This is encrypted device-local convenience storage, not an OS keychain, TPM boundary, or protection against malicious same-origin script execution.

## Retention

Use one deliberately simple bounded policy:

- keep the newest 30 MindSpark recovery-point files active in `recovery-points/`;
- run retention only after the newly requested recovery point has been committed and verified;
- never select the newly committed recovery point for deletion;
- ignore unrelated files;
- remove selected older MindSpark recovery files from oldest to newest.

The GitHub Contents API deletion uses the current repository-file Git SHA and creates a normal deletion commit.

Because Git is versioned storage, removing an older backup from the current branch tree does not claim cryptographic or physical erasure of the historical Git blob. WORK-012 retention bounds the active recovery-point folder, not repository history.

If listing or deletion fails after successful upload and verification:

- preserve the newly stored recovery point;
- record the backup as successful;
- report retention cleanup failure distinctly;
- do not roll back the new recovery point.

## Backup availability and user workflow

MindSpark exposes:

- a Settings backup section for GitHub owner/repository configuration and PAT management;
- a global backup control;
- a 24-hour device-local due indicator;
- manual backup on demand.

A successful backup updates the device-local last-success timestamp.

A retention cleanup failure after successful storage still counts as a successful recovery-point creation.

Failure before successful GitHub persistence must not update the last-success timestamp.

## Failure handling

The user-triggered operation surfaces failure of:

- authoritative source reads;
- backup validation;
- archive generation;
- required media reads;
- local SHA-256 generation;
- GitHub repository-file creation;
- committed-byte retrieval;
- remote SHA-256 verification;
- retention listing;
- retention deletion.

A failed upload or failed committed-byte verification must not be reported as success.

A retention failure after successful upload/verification must be distinguished because the new recovery point is already preserved.

## Recovery

Restore is not automated.

Recovery remains:

1. choose a known-good `.mindspark-backup` recovery file from the private GitHub repository;
2. download the file;
3. use the existing `Settings -> Backup` inspection workflow;
4. inspect and review the restore plan;
5. explicitly execute restore only through the existing governed restore path when authorized.

## Live integration evidence

On 2026-09-27, the browser-based WORK-012 path completed its first real end-to-end off-site recovery-point creation.

Verified live result:

`mindspark-2026-09-27T15-42-48-246Z.mindspark-backup`

The application reported successful storage with no retention deletion required.

This proves the live path through:

`MindSpark -> Firebase-backed authoritative source -> validated recovery archive -> GitHub Contents API -> MINDSPARK_BACKUPS/recovery-points/`

The earlier Release-asset architecture was superseded after live testing exposed browser CORS failure at `uploads.github.com`.

## Acceptance

WORK-012 is complete only when:

- the authenticated application can read the complete authoritative V1 backup source through the bounded backup interface;
- the recovery-point path exposes no restore or normal application-data mutation authority;
- the existing `.mindspark-backup` representation is reused unchanged;
- the generated archive passes the existing validator;
- archive SHA-256 is generated;
- text-only production-compatible recovery points work without requiring Firebase Storage;
- required legacy-media behavior remains fail-closed;
- a user-triggered backup can commit a uniquely named recovery point to `MINDSPARK_BACKUPS/recovery-points/`;
- the committed GitHub bytes are read back and verified against the local SHA-256;
- failed upload or failed remote verification cannot destroy or overwrite an older known-good recovery point;
- retention keeps the newest 30 recovery files active in the recovery directory;
- unrelated repository files are ignored by retention;
- the just-created recovery point cannot be selected for retention deletion;
- retention failure after successful storage preserves the new recovery point and is reported distinctly;
- owner/repository configuration is device-local rather than Firestore-backed;
- the raw PAT is absent from localStorage, sessionStorage, Firestore, backup archives, URLs, logs, and Git;
- encrypted PAT persistence follows the dedicated device-local credential-store contract;
- no Firebase/Google Cloud billing activation or paid-required service is necessary;
- ordinary application backup/export/restore behavior remains unchanged;
- one real live GitHub repository-file upload succeeds;
- a GitHub-produced archive is validated through the existing restore inspection workflow without destructive production restore;
- focused WORK-012 tests pass;
- relevant backup/restore regression tests pass;
- Firebase emulator/rules verification is performed only if a change requires it;
- `npm run verify:web-release` passes on the final WORK-012 state;
- `git diff --check` passes;
- governance documentation matches the implemented architecture.

## Current completion state

Completed:

- bounded read-only backup source;
- validated recovery-point composition;
- SHA-256 generation;
- direct off-site backup service;
- newest-30 active-file retention policy;
- GitHub Contents API gateway;
- committed-byte SHA-256 verification;
- device-local GitHub configuration;
- encrypted device-local PAT persistence;
- Settings backup UI;
- global backup control and due indicator;
- live GitHub repository-file recovery-point creation;
- retirement of the superseded GitHub Release-asset gateway.

Remaining before WORK-012 completion:

1. validate the GitHub-produced `.mindspark-backup` through the existing restore inspection workflow without destructive production restore;
2. run the final full `npm run verify:web-release` gate;
3. perform final governance/status alignment;
4. promote only after the bounded WORK-012 completion review accepts the result.

## Out of scope

Do not expand WORK-012 into:

- automatic restore;
- destructive rollback of production Firestore;
- redesign of the V1 backup format;
- an additional backup-archive encryption/passphrase layer;
- Firestore PITR or managed-backup product adoption;
- Firebase Storage enablement solely for WORK-012;
- scheduler/FSRS changes;
- ReviewEvent semantics changes;
- general Firebase deployment redesign;
- general Android/PWA longevity work;
- billing changes;
- unrelated GitHub automation.

## Governance boundary

Live repository state is authoritative.

WORK-012 does not authorize unrelated:

- GitHub repository administration;
- GitHub token permission expansion beyond the dedicated backup requirement;
- Google Cloud IAM changes;
- Firebase rule deployment;
- destructive production data mutation;
- billing changes.

External mutations remain bounded to the explicitly approved WORK-012 backup operation and its configured private GitHub backup repository.
