# MindSpark V2 Architecture Specification

## 1. Core Contract

MindSpark V2 is a **zero-decision opportunistic retrieval system**.
Its single primary optimization objective is:

> **Maximize durable memory gained per unit of spare time.**

When a user opens MindSpark during an unexpected spare minute (in line, waiting for coffee, transit), the system immediately presents the highest-value card worth retrieving—with zero configuration, zero manual deck picking, and zero decision fatigue.

---

## 2. Fundamental Architectural Distinctions

MindSpark V2 strictly separates five distinct concepts:

| Concept | Purpose | Mutability | Determinant of Scheduling? |
| :--- | :--- | :--- | :--- |
| **KnowledgeItem** | A coherent unit of understanding the user wants to retain (title, core text, explanation, source). | Mutable by user edit | **No** |
| **ReviewCard** | One retrieval method for a KnowledgeItem (`free_recall`, `flashcard`, `mcq`, `true_false`). | Mutable by user edit | **No** |
| **ReviewEvent** | Historical evidence that a retrieval attempt occurred (rating, duration, correctness, timestamp). | **Immutable** (append-only) | Basis of all state |
| **CardState** | Current FSRS memory parameters (`stability`, `difficulty`, `state`, `due`, `reps`, `lapses`). | Derived state | **Yes** (along with time) |
| **Knowledge Taxonomy** | Organizational hierarchy (Domain -> Topic -> Subtopic) and controlled tags. | Metadata only | **No** (taxonomy never controls memory scheduling) |

---

## 3. FSRS Memory Scheduling Engine

Memory state is governed strictly by the **Free Spaced Repetition Scheduler (FSRS-6)** via the official maintained `ts-fsrs` package (implementation version pinned to 5.4.2).

### Rules of Scheduling
1. **No Custom Mathematical Tweaks**: Do not alter FSRS formulas or apply arbitrary multipliers.
2. **Centralized Desired Retention**: Target retention is configured centrally with a default of **0.90** (`DEFAULT_FSRS_CONFIG`).
3. **Derived Card State**:
   - `New`: Unseen card, stability = 0, difficulty = 0.
   - `Learning`: First encounters or intra-day steps.
   - `Review`: Graduate cards governed by exponential forgetting curve.
   - `Relearning`: Cards lapsed upon an `Again` rating.
   *(Note: persistent CardState fields explicitly include `learningSteps`.)*
4. **Current Retrievability ($R$)**:
   Calculated directly via FSRS forgetting curve $R(t, S) = (1 + F \cdot t / S)^{-w}$. Retrievability decays as elapsed time increases and stability decreases.

---

## 4. Pure Review Router Policy

The Review Router is a **pure, deterministic function** (`selectNextCard`). It never uses arbitrary weighted scoring formulas, hidden heuristics, or mystery "priority scores". Every decision is explainable via machine-readable reasons and evidence.

### Strict Tier Hierarchy

```
[Candidate Pool]
       │
       ├── Filter: Exclude inactive items, archived items, suspended cards, and needs_review items
       ├── Filter: Bury sibling cards of items reviewed recently (active burying period)
       │
       ▼
[Tier 1: Learning / Relearning Due] ──(Any due now?)──► Select oldest due (Reason: relearning_due / learning_due)
       │ No
       ▼
[Tier 2: Review Due] ─────────────────(Any due now?)──► Select lowest Retrievability (Reason: review_due)
       │ No
       ▼
[Tier 3: New Cards] ──────────────────(Daily limit?)──► Select oldest new card (Reason: new_card)
       │ Limit reached / None
       ▼
[Tier 4: Near-Due Reserve] ───────────(Within 24h?)───► Select closest to due (Reason: near_due_reserve)
       │ None
       ▼
[Tier 5: Caught Up] ──────────────────────────────────► Return caught_up (Do not invent filler reviews)
```

### Policy Details
1. **Learning / Relearning Due First**: Items undergoing active encoding must be consolidated before standard reviews.
2. **Review Due by Retrievability**: Normal due cards are ordered by lowest retrievability first (cards closest to being forgotten).
3. **Urgency Overrides Diversity**: When two due review cards are within a tight retrievability tolerance ($\le 0.02$), a topic different from the previous review is gently preferred to avoid repetitive context fatigue. However, urgency strictly overrides diversity.
4. **Strict Daily Limit for New Cards**: New cards are only introduced when no reviews are due, capped at a conservative daily maximum (default: 5/day) to prevent runaway review backlog debt.
5. **Near-Due Reserve Horizon**: When all due cards and new cards are exhausted, cards due within the reserve horizon (default: 24 hours) may be retrieved opportunistically.
6. **Explicit Caught-Up State**: If no eligible card exists, the router returns an explicit caught-up state. The system never generates fake reviews or interrupts rest periods merely to artificially manipulate engagement.

---

## 5. ReviewEvents as Immutable Evidence

- `ReviewEvent` records represent permanent, append-only historical audit logs.
- They record:
  - Event ID, Card ID, Knowledge Item ID
  - Timestamp (ISO 8601)
  - Rating (`again`, `hard`, `good`, `easy`)
  - Objective correctness (for MCQ / True-False)
  - Guessed / struggled indicator
  - Response duration (ms)
  - Explicit device identifier (`deviceId`)
  - FSRS algorithm and parameter versioning metadata
- **Weakness Analysis**: Never modeled via a fragile lifetime `incorrectCount`. Weakness is derived by querying historical `ReviewEvent` trajectories and stability decay.

---

## 6. Sibling Burying and Association Independence

- Multiple `ReviewCard` instances can test the same `KnowledgeItem` from different cognitive angles (e.g., Free Recall prompt and MCQ recognition).
- **Default Baseline**: Exactly one high-quality card per KnowledgeItem is the standard design pattern. Multiple cards are allowed when distinct retrieval angles add genuine value.
- **Sibling Burying**: Sibling burial is supplied for an active burying period, intended initially to represent the current local review day and therefore survive app close/reopen.
- **Opaque IDs**: All IDs (`KnowledgeItem.id`, `ReviewCard.id`, `ReviewEvent.id`) are cryptographically random UUIDs (`crypto.randomUUID()`). They never encode taxonomy names, card types, dates, or difficulty.

---

## 7. AI Import DTO & Transformation Invariants

- AI import drafts (`ImportPayloadDraft`) **never specify IDs or timestamps**.
- The import schema validates:
  - Valid card types only (`free_recall`, `flashcard`, `mcq`, `true_false`).
  - MCQ constraints: at least 2 distinct non-empty options; `correctOptionIndex` strictly within array bounds.
  - True/False boolean invariants.
  - Controlled taxonomy imports are validated against a TaxonomyRegistry, and AI cannot silently create canonical taxonomy nodes or tags.
- Validated drafts are transformed into domain models via `transformDraftToDomain`, generating secure opaque IDs and initializing valid `CardState` instances.

---

## 8. Operating Principles & Non-Goals

1. **Framework-Independent Domain**: The domain and engine contain **zero React dependencies** and no browser-specific globals (no `window`, `document`, or `localStorage`).
2. **Offline-First Readiness**: All domain structures are clean, serializable, and ready for offline-first local persistence (e.g., IndexedDB) and conflict-free synchronization. See `MINDSPARK_V2_PERSISTENCE.md` for specific cloud event-sourcing and offline caching strategies.
3. **No Hidden Heuristics**: No black-box weighted scoring formulas or gamified gimmicks. Memory scheduling follows FSRS mathematics; card presentation follows the explicit Review Router policy.

## 9. Fresh-Start Decision (No Legacy Migration)

**Deliberate Product Decision**: Legacy MindSpark data migration is intentionally NOT supported.

**Reason**: The existing dataset was minimal/nonessential, and maintaining migration compatibility for the legacy application structures (e.g. `GlobalQuizStats`, unstructured `customQuestions`, `MediaLogs`) would increase long-term complexity without sufficient value. V2 begins with a clean dataset, ensuring the rigorous new schema and event-sourcing rules are uncompromised.

---

## 10. Packaging Authority

MindSpark is explicitly **PWA-first**.

*   **Desktop target:** Installed PWA on Windows (and other desktop environments).
*   **Android target:** Installed PWA initially.

**Capacitor** is temporarily retained only as a possible Android-native wrapper if a concrete PWA limitation is later demonstrated.

**Tauri** is retired and must not be reintroduced without an explicit architecture decision.

### Android Generated Assets & Build Authority
1. **Web Build is Sole Source of Authority**: The web source code (`src/`, compiled to `dist/`) is the exclusive source authority for all business logic, design tokens, UI components, scheduling routines, and assets.
2. **Android Assets Are Stale/Derivative Artifacts**: Any web assets copied into `android/app/src/main/assets/` (or synced via Capacitor) are strictly derivative build artifacts. They must never be treated as source authority, edited manually, or relied upon for canonical application state.
3. **Regeneration Requirement**: Any time the web application is updated, Android assets must be regenerated from the web build using `npm run build:android` (`npm run build && npx cap sync android`).

The PWA implementation is active:
- Static application shell precached by Workbox.
- Firebase/Firestore/Auth network traffic is not runtime-cached by the service worker.
- Update lifecycle is prompt-based.
- Manifest is explicitly defined in `public/manifest.json`.
- Browser/PWA is the primary deployment target.
- Capacitor remains strictly as fallback insurance.

---

## 11. Phase 2B Verification Checkpoint

After Phase 2B verification, visible UI/UX design is a mandatory user-discussion checkpoint. No production Review, Library, Needs Attention, Settings, navigation, responsive behavior, or visual design may be implemented until that discussion is completed.