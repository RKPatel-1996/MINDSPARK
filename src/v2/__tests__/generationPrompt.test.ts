import { describe, expect, it } from 'vitest';
import { buildMindSparkGenerationPrompt } from '../import/generationPrompt';
import type { TaxonomyRegistry } from '../domain/taxonomy';

const registry: TaxonomyRegistry = {
  domains: [
    { id: 'test-domain-alpha', name: 'Test Domain Alpha' },
    { id: 'test-domain-beta', name: 'Test Domain Beta' },
  ],
  topics: [
    {
      id: 'test-topic-one',
      domainId: 'test-domain-alpha',
      name: 'Test Topic One',
    },
    {
      id: 'test-topic-two',
      domainId: 'test-domain-beta',
      name: 'Test Topic Two',
    },
  ],
  subtopics: [
    {
      id: 'test-subtopic-leaf',
      topicId: 'test-topic-one',
      name: 'Test Subtopic Leaf',
    },
  ],
  allowedTags: ['test-tag-one', 'test-tag-two'],
};

describe('buildMindSparkGenerationPrompt', () => {
  it('is deterministic for the same supplied taxonomy registry', () => {
    expect(buildMindSparkGenerationPrompt(registry))
      .toBe(buildMindSparkGenerationPrompt(registry));
  });

  it('embeds the supplied taxonomy IDs, display names, relationships, and allowed tags', () => {
    const prompt = buildMindSparkGenerationPrompt(registry);

    expect(prompt).toContain('"id": "test-domain-alpha"');
    expect(prompt).toContain('"name": "Test Domain Alpha"');

    expect(prompt).toContain('"id": "test-topic-one"');
    expect(prompt).toContain('"domainId": "test-domain-alpha"');

    expect(prompt).toContain('"id": "test-subtopic-leaf"');
    expect(prompt).toContain('"topicId": "test-topic-one"');

    expect(prompt).toContain('"test-tag-one"');
    expect(prompt).toContain('"test-tag-two"');
  });

  it('uses the supplied registry rather than silently substituting canonical taxonomy', () => {
    const prompt = buildMindSparkGenerationPrompt(registry);

    expect(prompt).toContain('test-domain-alpha');
    expect(prompt).toContain('test-topic-one');
    expect(prompt).toContain('test-subtopic-leaf');

    expect(prompt).not.toContain('"id": "computing"');
    expect(prompt).not.toContain('"id": "linux"');
  });

  it('documents all five supported review-card forms', () => {
    const prompt = buildMindSparkGenerationPrompt(registry);

    expect(prompt).toContain('"type": "free_recall"');
    expect(prompt).toContain('"answerGuidance"');

    expect(prompt).toContain('"type": "flashcard"');
    expect(prompt).toContain('"front"');
    expect(prompt).toContain('"back"');

    expect(prompt).toContain('"type": "mcq"');
    expect(prompt).toContain('"options"');
    expect(prompt).toContain('"correctOptionIndex"');

    expect(prompt).toContain('"type": "true_false"');
    expect(prompt).toContain('"isTrue"');

    expect(prompt).toContain('"type": "cloze"');
    expect(prompt).toContain('"answer"');
  });

  it('documents text, code, math, and source shapes', () => {
    const prompt = buildMindSparkGenerationPrompt(registry);

    expect(prompt).toContain('"type": "text"');
    expect(prompt).toContain('"type": "code"');
    expect(prompt).toContain('"language"');
    expect(prompt).toContain('"type": "math"');

    expect(prompt).toContain('"title": "optional non-empty title"');
    expect(prompt).toContain('"url": "optional valid URL"');
    expect(prompt).toContain('"citation": "optional non-empty citation"');
  });

  it('states strict taxonomy and MCQ validity rules', () => {
    const prompt = buildMindSparkGenerationPrompt(registry);

    expect(prompt).toContain('topicId');
    expect(prompt).toContain('must reference a topic belonging to that domain');
    expect(prompt).toContain('must belong to the selected topic');
    expect(prompt).toContain('Never invent or auto-create taxonomy IDs or tags');

    expect(prompt).toContain('at least 2 options');
    expect(prompt).toContain('unique case-insensitively after trimming');
    expect(prompt).toContain('zero-based');
  });

  it('requires JSON-only output and prohibits unsupported persistence/domain metadata', () => {
    const prompt = buildMindSparkGenerationPrompt(registry);

    expect(prompt).toContain('Return EXACTLY ONE valid JSON object');
    expect(prompt).toContain('Output JSON only');
    expect(prompt).toContain('no Markdown code fences');
    expect(prompt).toContain('no unsupported or unknown keys');

    for (const forbiddenField of [
      'knowledgeItemId',
      'timestamps',
      'createdAt',
      'updatedAt',
      'schemaVersion',
      'status',
      'FSRS data',
      'scheduler state',
      'review history/events',
      'suspension state',
      'image references',
      'storage paths',
      'Firebase metadata',
    ]) {
      expect(prompt).toContain(forbiddenField);
    }
  });

  it('grounds generation in user-provided study material and discourages duplicate retrieval cards', () => {
    const prompt = buildMindSparkGenerationPrompt(registry);

    expect(prompt).toContain('Use only facts supported by that source material');
    expect(prompt).toContain('Do not fabricate unsupported facts');
    expect(prompt).toContain('high-quality retrieval practice');
    expect(prompt).toContain('Avoid unnecessary duplicate cards');
  });
});
