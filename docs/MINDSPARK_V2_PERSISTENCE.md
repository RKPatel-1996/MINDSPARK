# MindSpark V2 Persistence Specification

## 1. Cloud Authority
MindSpark V2 uses an event-sourced learning model. The authoritative durable data in Firestore consists of:
- `KnowledgeItem`
- `ReviewCard`
- `ReviewEvent` (Immutable historical evidence)
- `TaxonomyRegistry`
- `SchedulerParameterSet`
- `Settings`
- `Device metadata`

## 2. No Mutable Authoritative CardState
**CRITICAL**: `CardState` is derived/rebuildable state.
We do **not** treat a mutable Firestore `CardState` document as the source of truth because Cloud Firestore resolves offline writes using last-write-wins.
If two offline devices review the same card, both immutable `ReviewEvent`s must survive and merge. A future reconciliation phase will rebuild `CardState` deterministically from these events.

## 3. Collection Layout (Per-User)
- `/users/{uid}/knowledgeItems/{knowledgeItemId}`
- `/users/{uid}/reviewCards/{cardId}`
- `/users/{uid}/reviewEvents/{eventId}`
- `/users/{uid}/taxonomy/current`
- `/users/{uid}/schedulerParameterSets/{parameterSetId}`
- `/users/{uid}/settings/main`
- `/users/{uid}/devices/{deviceId}`

## 4. Single-Owner Security
This is a personal, single-user application. 
Firestore production rules are configured with an **owner-only** template using a placeholder: `REPLACE_WITH_OWNER_UID`.
Until this is deliberately updated, real users will be denied.

### One-Time Owner Setup:
1. Create a Firebase project.
2. Enable Google Authentication.
3. Obtain your personal Firebase UID (by logging in or via Firebase Console).
4. Replace `REPLACE_WITH_OWNER_UID` in `firestore.rules`.
5. Deploy the rules via Firebase CLI.

## 5. Offline Persistence
Firestore is initialized with `persistentLocalCache` and `persistentMultipleTabManager`. 
- Supports queued writes and offline reads.
- We use `CACHE_SIZE_UNLIMITED` to disable aggressive LRU cleanup, preserving the user's cached offline knowledge items for long-term usage.
- Note: This does not override browser storage quotas. If the browser data is explicitly cleared, local unsynced writes will be lost, but synced cloud data remains recoverable.

## 6. ReviewEvent Immutability
`ReviewEvent`s are append-only.
- `reviewTimestamp`: The time the event actually occurred on the device. (Used for memory reconstruction).
- `serverReceivedAt`: The time the server processed the event (via `serverTimestamp()`). (Used for sync and late-arrival detection).

## 7. Sync and Reconciliation Engine (Phase 2B)
MindSpark uses a deterministic reconciliation engine to reconstruct state from immutable review events.

**Sync Watermarks:**
- Events are pulled using `listReceivedAfter`, ordered by `serverReceivedAt` ASC, then `id` ASC.
- `serverReceivedAt` uses a `PreciseTimestamp` (seconds/nanoseconds) to avoid JS date precision loss.

**Canonical Memory Order:**
- During reconciliation, events are sorted by `reviewTimestamp` ASC, then `id` ASC (tie-breaker).
- This ensures late-arriving events from an offline device are chronologically replayed into the exact right place in the card's history.

**Deterministic Replay:**
- `reconcileCardHistory` is a pure function that takes a base card and an array of events, and returns the current provisional `CardState`.
- FSRS fuzzing is disabled during replay to ensure mathematical determinism across devices.
- `reconcile([A, B]) === reconcile([B, A])` regardless of server sync order.

## 8. Scheduler Parameter-Set Immutability
`SchedulerParameterSet` documents (e.g., `fsrs-6-default`) represent historical scheduling authorities. Once recorded, they must not be updated or deleted, ensuring the review history can be precisely reconstructed. If settings are optimized in the future, a brand-new parameter set ID must be created.

## 9. Device Identity
Device identity uses a stable cryptographic UUID stored locally (e.g., IndexedDB) per browser profile. It allows tracking which physical/browser device originated events, but it is not equated to user identity.
