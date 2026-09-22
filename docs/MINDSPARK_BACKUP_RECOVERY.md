# MindSpark V1 Backup and Recovery

## Scope

MindSpark exports a portable, non-destructive V1 backup of the configured owner's learning library. The backup is intended for recovery into an empty, matching, or partially matching library owned by the same authorized user.

The restore workflow validates and previews the complete archive before the user can explicitly start persistence. It inserts compatible missing data and leaves matching data unchanged. It does not replace conflicting data.

## Backup format

The downloaded `mindspark-v1.mindspark-backup` file is a ZIP archive with this strict shape:

- `backup.json`: the V1 manifest and portable application data.
- `media/<image-id>`: one member for each image declared by the manifest.

`backup.json` identifies the format as `mindspark-backup` and the version as `1`. It contains:

- taxonomy;
- settings;
- active and historical scheduler parameter sets;
- KnowledgeItems, including archived and needs-review items;
- ReviewCards, including suspended cards;
- immutable ReviewEvents;
- media metadata.

Storage-specific image paths are removed during export. CardState and other rebuildable projections are not authoritative backup records.

The reader rejects unknown archive members, unsafe paths, duplicate member names, Unicode-normalized duplicate identities, unsupported versions, schema-invalid data, manifest/member mismatches, oversized archives, oversized members, and invalid media metadata.

## Export workflow

1. Sign in as the configured owner.
2. Open **Settings → Backup**.
3. Select **Download backup**.
4. Store the downloaded archive in a user-protected location.
5. Record a SHA-256 checksum when the archive will be retained or transferred.

Export fails if referenced media is missing, unreadable, empty, oversized, uses an unsupported MIME type, or cannot be hashed. A failed export must not be treated as a usable recovery archive.

## Recovery workflow

1. Preserve the current target state and confirm the correct owner and Firebase configuration.
2. Select the `.mindspark-backup` file in **Settings → Backup**.
3. Wait for archive validation and preflight inspection.
4. Review the insert, matching, media, and conflict counts.
5. Do not proceed if any conflict is reported.
6. Explicitly select **Restore missing data**.
7. Retain the result until inserted, matching, failed, and incomplete operations are understood.
8. If execution fails or is incomplete, select the archive again and complete a fresh preflight before retrying.

Changing the owner, Firebase configuration, repositories, or workflow authority invalidates the current preview. Results from an older pending inspection are ignored.

## Restore semantics

### INSERT

The source entity is missing and its dependencies remain compatible. Restore creates the entity using its stable identity and source evidence. Media is written to the current owner's canonical Storage path.

### NO_OP

The target already contains semantically equivalent data or identical media bytes. Restore leaves it unchanged. A successfully restored archive should produce only `NO_OP` results on a fresh second preflight.

### CONFLICT

The target contains the same stable identity with materially different authoritative content, or the canonical media path contains different bytes. Restore fails closed and does not overwrite the conflicting target.

Taxonomy and settings may replace only their unchanged bootstrap defaults. Immutable records and historical parameter sets are never silently replaced.

## Media validation

Supported image MIME types are JPEG, PNG, and WebP. Each image must:

- have a positive byte length no greater than 5 MiB;
- match the manifest MIME type and byte length;
- match the manifest SHA-256;
- belong to the declared KnowledgeItem and image identity;
- restore to the canonical owner-scoped Storage path.

Existing identical bytes are a no-op. Existing different bytes are a conflict. Record writes begin only after all supplied media bytes pass manifest validation.

## Incomplete execution and retry

Restore is non-destructive, but persistence spans independent media and record operations. A service interruption can therefore leave a valid, explainable subset of inserts completed.

An incomplete result identifies completed operations and the failed operation. Do not reuse the old executable plan. Reinspect the original archive against the current target so completed inserts become `NO_OP` and remaining compatible inserts receive a new plan.

Unexpected deletion, overwrite, mutation outside the planned target, validation bypass, successful cross-owner access, or unexplained partial state is a release-blocking condition.

## Single-owner security model

Firestore and Storage rules allow only the configured owner to access the canonical owner paths. Authentication alone does not grant access: an authenticated non-owner is denied both the owner's paths and a separate non-owner path.

A backup archive is not an authentication credential and cannot bypass Firebase rules. Restore authority comes from the active authenticated owner, configured repositories, and current workflow instance.

## Privacy and archive handling

V1 backup archives are not encrypted by MindSpark. They may contain readable learning content, review history, settings, and media.

- Keep archives in a user-protected location.
- Do not commit archives or extracted media to Git.
- Do not place archive contents, credentials, tokens, owner UIDs, or personal data in logs or reports.
- Retain raw archives only as long as required by the recovery or defect investigation.
- Delete disposable archives and extracted files after verification.
- Use synthetic data for controlled testing.

State-shaping recovery tests must use Firebase emulators or a dedicated disposable non-production Firebase project. The authoritative user library must never be cleared, conflicted, or partially mutated to construct a test case.

## Limitations and non-guarantees

V1 backup and restore does not provide:

- archive encryption or password protection;
- destructive replacement, deletion, or synchronization;
- conflict resolution or merging of differing authoritative records;
- rollback of already completed inserts after an interrupted restore;
- a guarantee that Firebase services, authentication, or network access are available;
- guaranteed offline availability of Firebase Storage image bytes;
- support for an unknown future backup version;
- backup of credentials, authentication accounts, Firebase configuration, generated rules, or deployment state;
- proof that every future application feature is represented unless it is part of the validated V1 contract.

A backup should be tested periodically in a disposable environment. Archive integrity alone does not prove that a particular cloud environment is correctly configured.

## B8 verification status

B8 Stage 1 local and emulator evidence is maintained in `docs/MINDSPARK_B8_STAGE1_EVIDENCE.md`.

Cloud browser and installed-PWA testing against the disposable `B8_NONPROD` environment remains pending. Stage 1 results must not be interpreted as completed production deployment or public release verification.
