# MindSpark V2 Import Packet Format Specification

This document defines the exact schema and validation contract for importing knowledge items and review cards into MindSpark V2.

The import pipeline is strictly typed, deterministic, and validated by Zod (`src/v2/import/importDraft.ts`) and domain rules (`src/v2/import/transformDraft.ts`). All schemas enforce `.strict()`; unrecognized fields will cause validation failure.

---

## 1. Top-Level Packet Structure

The import payload represents **one coherent unit of knowledge** (`item`) and **one or more retrieval cards** (`cards`).

```typescript
{
  "item": KnowledgeItemDraft,
  "cards": ReviewCardDraft[] // min: 1 card
}
```

### Required Top-Level Fields
| Field | Type | Description |
| :--- | :--- | :--- |
| `item` | `object` | The core knowledge item draft. |
| `cards` | `array` | Non-empty array of review card drafts (minimum 1 card). |

---

## 2. Knowledge Item Draft (`item`)

The knowledge item draft represents the canonical factual content the user seeks to understand and retain.

```typescript
{
  "title": string,                   // Required, trimmed, min length 1
  "content": string,                 // Required, trimmed, min length 1
  "taxonomy": {                      // Required, strict
    "domainId": string,              // Required, min length 1
    "topicId": string,               // Required, min length 1
    "subtopicId"?: string            // Optional, min length 1
  },
  "explanationMarkdown"?: string,    // Optional, trimmed
  "tags"?: string[],                 // Optional, array of controlled tags
  "sources"?: SourceReference[]      // Optional, array of source objects
}
```

### Field Reference

| Field | Required / Optional | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `title` | **Required** | `string`, trimmed, `min(1)` | Concise title of the concept or principle. |
| `content` | **Required** | `string`, trimmed, `min(1)` | Core factual statement or explanation of the knowledge item. |
| `taxonomy` | **Required** | `object`, `.strict()` | Hierarchical classification referencing the controlled taxonomy registry. |
| `taxonomy.domainId` | **Required** | `string`, `min(1)` | ID of the domain. Must exist in `TaxonomyRegistry.domains`. |
| `taxonomy.topicId` | **Required** | `string`, `min(1)` | ID of the topic. Must exist in `TaxonomyRegistry.topics` and belong to `domainId`. |
| `taxonomy.subtopicId` | Optional | `string`, `min(1)` | ID of the subtopic. If provided, must exist in `TaxonomyRegistry.subtopics` and belong to `topicId`. |
| `explanationMarkdown`| Optional | `string`, trimmed | Deeper context, derivations, historical background, or Markdown formatting. |
| `tags` | Optional | `string[]` | Array of controlled tags. Each tag must match `/^[a-z0-9-_]+$/` and exist in `TaxonomyRegistry.allowedTags`. |
| `sources` | Optional | `SourceReference[]` | Array of reference sources backing the item. |

### Source Reference Structure (`sources[]`)
Each object in `sources` is validated with `.strict()`:

| Field | Required / Optional | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `title` | Optional | `string`, `min(1)` | Title of the referenced article, book, or paper. |
| `url` | Optional | `string`, valid URL | Web URL to the source (`z.string().url()`). |
| `citation` | Optional | `string`, `min(1)` | Formal academic or literary citation. |

---

## 3. Review Card Drafts (`cards`)

The `cards` array is a discriminated union keyed on `type`. Exactly four card types are supported:
1. `free_recall`
2. `flashcard`
3. `mcq`
4. `true_false`

All card drafts are validated with `.strict()`.

---

### 3.1. Free Recall (`type: "free_recall"`)
Open-ended conceptual retrieval. The user attempts to formulate an explanation before comparing their response against the answer guidance.

```typescript
{
  "type": "free_recall",
  "prompt": string,          // Required, trimmed, min length 1
  "answerGuidance": string   // Required, trimmed, min length 1
}
```

| Field | Required / Optional | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `type` | **Required** | Literal `"free_recall"` | Discriminated union key. |
| `prompt` | **Required** | `string`, trimmed, `min(1)` | The retrieval prompt or conceptual challenge. |
| `answerGuidance` | **Required** | `string`, trimmed, `min(1)` | The rubric or key points a complete answer must contain. |

---

### 3.2. Flashcard (`type: "flashcard"`)
Paired association or direct factual recall.

```typescript
{
  "type": "flashcard",
  "front": string,    // Required, trimmed, min length 1
  "back": string      // Required, trimmed, min length 1
}
```

| Field | Required / Optional | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `type` | **Required** | Literal `"flashcard"` | Discriminated union key. |
| `front` | **Required** | `string`, trimmed, `min(1)` | Prompt, question, or stimulus shown first. |
| `back` | **Required** | `string`, trimmed, `min(1)` | Target answer or fact revealed on flip. |

---

### 3.3. Multiple Choice Question (`type: "mcq"`)
Recognition and discriminative retrieval between plausible alternatives.

```typescript
{
  "type": "mcq",
  "question": string,             // Required, trimmed, min length 1
  "options": string[],            // Required, array of trimmed strings, min: 2
  "correctOptionIndex": number,   // Required, integer >= 0, < options.length
  "explanation"?: string          // Optional, trimmed
}
```

| Field | Required / Optional | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `type` | **Required** | Literal `"mcq"` | Discriminated union key. |
| `question` | **Required** | `string`, trimmed, `min(1)` | The question text. |
| `options` | **Required** | `string[]`, `min(2)` | Array of at least two non-empty options. **Must be unique case-insensitively after trimming.** |
| `correctOptionIndex` | **Required** | `integer >= 0` | 0-based index pointing to the correct option. Must satisfy `0 <= correctOptionIndex < options.length`. |
| `explanation` | Optional | `string`, trimmed | Clarification explaining why the correct choice is valid or why distractors are incorrect. |

**MCQ Validation Constraints:**
- `options.length >= 2`: At least two choices are required.
- Case-insensitive uniqueness: Options such as `["Mitochondria", "mitochondria"]` are rejected.
- Index bound check: If `options` has 4 items, `correctOptionIndex` must be `0`, `1`, `2`, or `3`.

---

### 3.4. True / False (`type: "true_false"`)
Binary proposition verification.

```typescript
{
  "type": "true_false",
  "statement": string,       // Required, trimmed, min length 1
  "isTrue": boolean,         // Required, true or false
  "explanation"?: string     // Optional, trimmed
}
```

| Field | Required / Optional | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `type` | **Required** | Literal `"true_false"` | Discriminated union key. |
| `statement` | **Required** | `string`, trimmed, `min(1)` | Factual assertion to verify. |
| `isTrue` | **Required** | `boolean` (`true` or `false`) | Truth value of the statement. |
| `explanation` | Optional | `string`, trimmed | Contextual explanation clarifying the truth or falsehood. |

---

## 4. Taxonomy & Controlled Tags

MindSpark V2 uses a **strictly controlled taxonomy**. Category trees and tags must be registered in the user's `TaxonomyRegistry`. Free-form category invention is forbidden.

### Taxonomy Hierarchy Rules
1. **Domain Existence**: `taxonomy.domainId` must match an existing domain ID in `registry.domains`.
2. **Topic Parentage**: `taxonomy.topicId` must match a topic in `registry.topics`, AND that topic's `domainId` must match `taxonomy.domainId`.
3. **Subtopic Parentage**: If `taxonomy.subtopicId` is provided, it must match a subtopic in `registry.subtopics`, AND that subtopic's `topicId` must match `taxonomy.topicId`.
4. **Separation of Concerns**: Taxonomy is purely for user organization; **taxonomy never influences FSRS scheduling**.

### Controlled Tag Rules
1. **Regex Format**: Tags must match `/^[a-z0-9-_]+$/` (lowercase alphanumeric characters, hyphens, underscores). No uppercase letters, spaces, or symbols.
2. **Registry Enforcement**: Every tag in `tags` must be present in `registry.allowedTags`. Unknown or invented tags trigger an immediate transformation error.

---

## 5. Fields AI Must NOT Generate

To preserve system invariants, security, and scheduling integrity, the import payload must be a pure draft. The following fields **must NOT be present** in the input packet:

| Forbidden Field | Why It Must NOT Be Generated | How MindSpark V2 Handles It |
| :--- | :--- | :--- |
| `id` / `knowledgeItemId` / `cardId` | Persistent IDs must be cryptographically secure UUID v4 strings generated by the local client. AI-generated IDs are untrusted and rejected by `.strict()`. | Generated via `globalThis.crypto` during domain transformation (`transformDraftToDomain`). |
| `schemaVersion` | Internal schema versioning constant. | Assigned automatically (`schemaVersion: 1`). |
| `status` | Knowledge item lifecycle state (`active`, `needs_review`, `archived`). | Initialized automatically to `'active'`. |
| `suspended` / `suspendedReason` | Card suspension states are governed by user action or reconciliation. | Initialized automatically to `suspended: false`, `suspendedReason: undefined`. |
| `createdAt` / `updatedAt` | Client/server authoritative timestamps. | Generated using the system ingestion timestamp (`toISOString()`). |
| FSRS parameters (`stability`, `difficulty`, `due`, `elapsedDays`, `scheduledDays`, `reps`, `lapses`, `learningSteps`, `state`, `retrievability`) | Memory state is exclusively calculated by the FSRS engine (`createInitialCardState`). | Initialized with default FSRS-6 values (`state: 'new'`, `reps: 0`, `learningSteps: 0`, `stability: 0`, `difficulty: 0`). |
| Arbitrary metadata (`priority`, `difficultyRating`, `deckId`, `aiConfidence`) | Not recognized by the schema and would violate zero-decision scheduling principles. | Rejected by `.strict()`. |

---

## 6. Complete Valid Example Packet

Below is a complete, fully valid import packet illustrating a knowledge item with all optional fields and all four card types:

```json
{
  "item": {
    "title": "DNA Double Helix Structure",
    "content": "DNA is a double-stranded polymer of deoxyribonucleotides arranged in a right-handed double helix, stabilized by hydrogen bonding between complementary base pairs (Adenine-Thymine and Guanine-Cytosine) and base-stacking interactions.",
    "explanationMarkdown": "The structure was published by James Watson and Francis Crick in 1953, utilizing X-ray diffraction images collected by Rosalind Franklin and Raymond Gosling, alongside Chargaff's rules of base equivalence.",
    "taxonomy": {
      "domainId": "biology",
      "topicId": "genetics",
      "subtopicId": "molecular"
    },
    "tags": ["dna", "genetics"],
    "sources": [
      {
        "title": "Molecular Structure of Nucleic Acids: A Structure for Deoxyribose Nucleic Acid",
        "url": "https://doi.org/10.1038/171737a0",
        "citation": "Watson, J. D., & Crick, F. H. (1953). Nature, 171(4356), 737-738."
      }
    ]
  },
  "cards": [
    {
      "type": "free_recall",
      "prompt": "Explain the stabilizing forces that maintain the DNA double helix structure.",
      "answerGuidance": "Must mention two primary stabilizing forces: 1) Hydrogen bonding between complementary base pairs (2 between A-T, 3 between G-C), and 2) Hydrophobic base-stacking interactions between adjacent planar aromatic rings."
    },
    {
      "type": "flashcard",
      "front": "Which purine forms two hydrogen bonds with Thymine in double-stranded DNA?",
      "back": "Adenine"
    },
    {
      "type": "mcq",
      "question": "Which nitrogenous base pairs with Guanine in DNA, and via how many hydrogen bonds?",
      "options": [
        "Cytosine, via 2 hydrogen bonds",
        "Cytosine, via 3 hydrogen bonds",
        "Thymine, via 2 hydrogen bonds",
        "Uracil, via 3 hydrogen bonds"
      ],
      "correctOptionIndex": 1,
      "explanation": "Guanine forms three hydrogen bonds with Cytosine. Adenine pairs with Thymine via two hydrogen bonds."
    },
    {
      "type": "true_false",
      "statement": "The phosphodiester backbone of DNA carries a net positive charge in physiological pH conditions.",
      "isTrue": false,
      "explanation": "The phosphate groups in the phosphodiester backbone are negatively charged at physiological pH, giving DNA its overall negative charge."
    }
  ]
}
```

---

## 7. Invalid Example Showing Common Errors

The following draft illustrates common formatting errors that cause schema validation or domain transformation failures. Each failure is annotated below:

```json
{
  "item": {
    "id": "12345-ai-generated-id", // ERROR 1: Persistent ID must not be generated (strict violation)
    "title": "Newtonian Gravitation",
    "content": "Every particle attracts every other particle with a force proportional to the product of their masses.",
    "taxonomy": {
      "domainId": "biology",       // ERROR 2: Topic 'mechanics' belongs to 'physics', not 'biology'
      "topicId": "mechanics"
    },
    "tags": ["Physics!", "gravitation"], // ERROR 3: 'Physics!' has uppercase & punctuation; 'gravitation' not in allowedTags
    "difficultyRating": 4.5        // ERROR 4: Unrecognized field rejected by .strict()
  },
  "cards": [
    {
      "type": "mcq",
      "question": "What is the gravitational constant G approximately?",
      "options": [
        "6.674e-11 N m²/kg²",
        "6.674E-11 N m²/kg²"       // ERROR 5: Duplicate option (checked case-insensitively after trimming)
      ],
      "correctOptionIndex": 3       // ERROR 6: Index 3 out of bounds for an array of length 2
    },
    {
      "type": "true_false",
      "statement": "Gravitational force decreases with the cube of distance.",
      "isTrue": "false"             // ERROR 7: isTrue must be a boolean (false), not a string ("false")
    },
    {
      "type": "qa",                 // ERROR 8: Invalid type "qa"; must be free_recall, flashcard, mcq, or true_false
      "front": "What is F?",
      "back": "G * m1 * m2 / r²"
    },
    {
      "type": "free_recall",
      "prompt": "State the formula for gravitational attraction."
      // ERROR 9: Missing required field 'answerGuidance'
    }
  ]
}
```

### Explanation of Errors in Invalid Example
1. **`item.id`**: The schema uses `.strict()`. IDs must be omitted so the application can generate a cryptographically valid opaque UUID.
2. **Taxonomy mismatch**: `mechanics` belongs to `physics`. Pairing it with `biology` fails `validateTaxonomy()`.
3. **Invalid tags**: Tag strings must only contain `[a-z0-9-_]`. Furthermore, tags must already exist in `registry.allowedTags`.
4. **Extra keys (`difficultyRating`)**: Any field not explicitly declared in `knowledgeItemDraftSchema` or card schemas is rejected.
5. **MCQ duplicate options**: Case-insensitive duplicate options (`6.674e-11...` vs `6.674E-11...`) violate MCQ distinctness rules.
6. **MCQ index out of bounds**: `correctOptionIndex: 3` requires at least 4 options (indices `0..3`).
7. **Invalid boolean type**: `"false"` as a string fails Zod's boolean check.
8. **Invalid card type**: `"qa"` is not a member of the discriminated union; flashcards must specify `"flashcard"`.
9. **Missing required fields**: `free_recall` cards must provide non-empty strings for both `prompt` and `answerGuidance`.
