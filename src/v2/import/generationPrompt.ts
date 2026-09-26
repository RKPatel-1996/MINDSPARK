import type { TaxonomyRegistry } from '../domain/taxonomy';

function prettyJson(value: unknown): string {
  return JSON.stringify(value, null, 2);
}

/**
 * Builds the canonical external-AI instruction prompt for producing a
 * MindSpark strict import packet.
 *
 * The supplied taxonomy registry is authoritative. The prompt deliberately
 * carries no Firebase identity, persistence metadata, scheduler state, IDs,
 * timestamps, or lifecycle state.
 */
export function buildMindSparkGenerationPrompt(registry: TaxonomyRegistry): string {
  const taxonomy = {
    domains: registry.domains.map(({ id, name }) => ({ id, name })),
    topics: registry.topics.map(({ id, domainId, name }) => ({ id, domainId, name })),
    subtopics: registry.subtopics.map(({ id, topicId, name }) => ({ id, topicId, name })),
    allowedTags: [...registry.allowedTags],
  };

  return `You are generating study material for MindSpark.

The user will provide source/study material together with these instructions.
Use only facts supported by that source material. Do not fabricate unsupported facts.

Return EXACTLY ONE valid JSON object that can be pasted directly into MindSpark.
Output JSON only:
- no Markdown code fences;
- no prose before or after the JSON;
- no comments;
- no unsupported or unknown keys.

MindSpark uses a strict schema. Extra fields are rejected.

TOP-LEVEL SHAPE

{
  "item": {
    "title": "...",
    "content": "...",
    "taxonomy": {
      "domainId": "...",
      "topicId": "..."
    }
  },
  "cards": [
    {
      "type": "free_recall",
      "prompt": "...",
      "answerGuidance": "..."
    }
  ]
}

Only "item" and "cards" are allowed at the top level.

ITEM CONTRACT

Required:
- "title": non-empty string
- "content": non-empty string
- "taxonomy": valid taxonomy reference

Optional:
- "blocks"
- "explanationMarkdown"
- "tags"
- "sources"

Do NOT generate IDs, knowledgeItemId, timestamps, createdAt, updatedAt,
schemaVersion, status, lifecycle state, FSRS data, scheduler state,
review history/events, suspension state, image references, storage paths,
Firebase metadata, or any other unsupported field.

TAXONOMY

Use ONLY IDs listed in the authoritative taxonomy below.

Rules:
- "domainId" must reference an existing domain.
- "topicId" must reference a topic belonging to that domain.
- "subtopicId" is optional; when present it must belong to the selected topic.
- Tags are optional and must come only from "allowedTags".
- Never invent or auto-create taxonomy IDs or tags.

Authoritative current taxonomy:
${prettyJson(taxonomy)}

CONTENT BLOCKS

"blocks" is optional. When present it must be a non-empty ordered array.
Preserve the intended order of the study material.

Allowed block forms only:

Text:
{
  "type": "text",
  "content": "..."
}

Code:
{
  "type": "code",
  "language": "optional-language-name",
  "content": "..."
}

Math:
{
  "type": "math",
  "content": "..."
}

Block content must not be blank.
For code blocks, "language" is optional.

SOURCES

"sources" is optional. Each source object may contain only:
{
  "title": "optional non-empty title",
  "url": "optional valid URL",
  "citation": "optional non-empty citation"
}

REVIEW CARDS

"cards" must contain at least one card.

Create high-quality retrieval practice.
Avoid unnecessary duplicate cards that test the same fact in nearly the same way.

Allowed card types and exact shapes:

1. Free recall
{
  "type": "free_recall",
  "prompt": "...",
  "answerGuidance": "..."
}

2. Flashcard
{
  "type": "flashcard",
  "front": "...",
  "back": "..."
}

3. Multiple choice
{
  "type": "mcq",
  "question": "...",
  "options": ["...", "..."],
  "correctOptionIndex": 0,
  "explanation": "optional explanation"
}

MCQ rules:
- at least 2 options;
- every option must be non-empty;
- options must be unique case-insensitively after trimming;
- "correctOptionIndex" is zero-based;
- "correctOptionIndex" must identify an existing option.

4. True / false
{
  "type": "true_false",
  "statement": "...",
  "isTrue": true,
  "explanation": "optional explanation"
}

5. Cloze
{
  "type": "cloze",
  "prompt": "...",
  "answer": "..."
}

QUALITY RULES

- Base the item and cards only on the user's supplied source/study material.
- Prefer questions that require meaningful retrieval rather than trivial wording changes.
- Keep each card focused on a coherent retrieval target.
- Avoid generating several cards that merely repeat the same fact.
- Use "explanationMarkdown" when a useful explanatory synthesis is supported.
- Use ordered text/code/math blocks when structure materially helps preserve the source.
- Do not insert placeholders where the supplied source provides the actual value.
- Do not add unsupported metadata.

FINAL OUTPUT RULE

Return exactly one JSON object matching this contract and nothing else.`;
}
