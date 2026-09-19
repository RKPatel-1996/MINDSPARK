import { describe, it, expect, vi } from 'vitest';
import {
  knowledgeItemSchema,
  reviewCardSchema,
  generateId,
  isValidId,
  opaqueIdSchema,
  reviewEventSchema,
  DEFAULT_SCHEDULER_IDENTITY,
  type KnowledgeItem,
  type ReviewCard,
} from '../domain';
import { mcqDraftSchema } from '../import/importDraft';

describe('V2 Domain Schemas and ID Invariants', () => {
  it('validates a correct KnowledgeItem schema', () => {
    const validItem: KnowledgeItem = {
      id: generateId(),
      schemaVersion: 1,
      title: 'Euler Characteristic',
      content: 'For any convex polyhedron, V - E + F = 2.',
      explanationMarkdown: 'Discovered by Leonhard Euler in 1758.',
      taxonomy: {
        domainId: 'math',
        topicId: 'topology',
        subtopicId: 'polyhedra',
      },
      tags: ['geometry', 'euler'],
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      sources: [{ title: 'Euler Proofs', url: 'https://example.com/euler' }],
    };

    const parsed = knowledgeItemSchema.parse(validItem);
    expect(parsed.id).toBe(validItem.id);
    expect(parsed.status).toBe('active');
  });

  it('accepts KnowledgeItem image references with concept-level and card-targeted review placement', () => {
    const targetedCardId = generateId();

    const item = {
      id: generateId(),
      schemaVersion: 1,
      title: 'Image contract test',
      content: 'Knowledge with supporting images.',
      taxonomy: { domainId: 'biology', topicId: 'cell-biology' },
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      images: [
        {
          id: generateId(),
          storagePath: 'users/test/images/cell-diagram.png',
          alt: 'Diagram of a eukaryotic cell',
          caption: 'General reference diagram',
          placement: 'content',
        },
        {
          id: generateId(),
          storagePath: 'users/test/images/mitochondrion.png',
          alt: 'Mitochondrion highlighted in a cell',
          placement: 'review_prompt',
          cardId: targetedCardId,
        },
        {
          id: generateId(),
          storagePath: 'users/test/images/answer-overlay.png',
          alt: 'Labeled answer diagram',
          placement: 'review_answer',
        },
      ],
    };

    const parsed = knowledgeItemSchema.parse(item);

    expect(parsed.images).toHaveLength(3);
    expect(parsed.images?.[1].cardId).toBe(targetedCardId);
  });

  it('rejects card targeting on content images', () => {
    const item = {
      id: generateId(),
      schemaVersion: 1,
      title: 'Invalid content image targeting',
      content: 'Concept-level content image.',
      taxonomy: { domainId: 'biology', topicId: 'cell-biology' },
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      images: [
        {
          id: generateId(),
          storagePath: 'users/test/images/content.png',
          alt: 'Concept image',
          placement: 'content',
          cardId: generateId(),
        },
      ],
    };

    expect(() => knowledgeItemSchema.parse(item)).toThrow(
      'Content images cannot target a specific ReviewCard'
    );
  });

  it('rejects unsupported image placements', () => {
    const item = {
      id: generateId(),
      schemaVersion: 1,
      title: 'Invalid image placement',
      content: 'Image placement validation.',
      taxonomy: { domainId: 'biology', topicId: 'cell-biology' },
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      images: [
        {
          id: generateId(),
          storagePath: 'users/test/images/example.png',
          alt: 'Example image',
          placement: 'sidebar',
        },
      ],
    };

    expect(() => knowledgeItemSchema.parse(item)).toThrow();
  });

  it('rejects invalid knowledge status values', () => {
    const invalidItem = {
      id: generateId(),
      schemaVersion: 1,
      title: 'Invalid Status Test',
      content: 'Some text',
      taxonomy: { domainId: 'tech', topicId: 'coding' },
      status: 'pending_approval', // Not in ['active', 'needs_review', 'archived']
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    expect(() => knowledgeItemSchema.parse(invalidItem)).toThrow();
  });

  it('validates all 5 permitted ReviewCard types', () => {
    const kid = generateId();
    const now = new Date().toISOString();

    const freeRecall: ReviewCard = {
      id: generateId(),
      knowledgeItemId: kid,
      schemaVersion: 1,
      suspended: false,
      createdAt: now,
      updatedAt: now,
      type: 'free_recall',
      prompt: 'State Euler formula for polyhedra',
      answerGuidance: 'V - E + F = 2',
    };

    const flashcard: ReviewCard = {
      id: generateId(),
      knowledgeItemId: kid,
      schemaVersion: 1,
      suspended: false,
      createdAt: now,
      updatedAt: now,
      type: 'flashcard',
      front: 'What is V - E + F for convex polyhedra?',
      back: '2',
    };

    const mcq: ReviewCard = {
      id: generateId(),
      knowledgeItemId: kid,
      schemaVersion: 1,
      suspended: false,
      createdAt: now,
      updatedAt: now,
      type: 'mcq',
      question: 'What is V - E + F for a cube?',
      options: ['0', '1', '2', '4'],
      correctOptionIndex: 2,
      explanation: 'Vertices=8, Edges=12, Faces=6: 8-12+6 = 2',
    };

    const trueFalse: ReviewCard = {
      id: generateId(),
      knowledgeItemId: kid,
      schemaVersion: 1,
      suspended: false,
      createdAt: now,
      updatedAt: now,
      type: 'true_false',
      statement: 'A tetrahedron has an Euler characteristic of 2.',
      isTrue: true,
    };

    const cloze: ReviewCard = {
      id: generateId(),
      knowledgeItemId: kid,
      schemaVersion: 1,
      suspended: false,
      createdAt: now,
      updatedAt: now,
      type: 'cloze',
      prompt: 'DNA polymerase synthesizes DNA in the ____ direction.',
      answer: '5′ → 3′',
    };

    expect(reviewCardSchema.parse(freeRecall).type).toBe('free_recall');
    expect(reviewCardSchema.parse(flashcard).type).toBe('flashcard');
    expect(reviewCardSchema.parse(mcq).type).toBe('mcq');
    expect(reviewCardSchema.parse(trueFalse).type).toBe('true_false');
    expect(reviewCardSchema.parse(cloze).type).toBe('cloze');
  });

  it('enforces card suspension invariants: suspended=true requires reason, suspended=false forbids reason', () => {
    const kid = generateId();
    const now = new Date().toISOString();

    // Valid: suspended=false with no reason
    const validActive: ReviewCard = {
      id: generateId(),
      knowledgeItemId: kid,
      schemaVersion: 1,
      suspended: false,
      createdAt: now,
      updatedAt: now,
      type: 'cloze',
      prompt: 'Q',
      answer: 'A',
    };
    expect(reviewCardSchema.parse(validActive).suspended).toBe(false);

    // Valid: suspended=true with reason
    const validSuspended: ReviewCard = {
      id: generateId(),
      knowledgeItemId: kid,
      schemaVersion: 1,
      suspended: true,
      suspendedReason: 'flagged_by_user',
      createdAt: now,
      updatedAt: now,
      type: 'cloze',
      prompt: 'Q',
      answer: 'A',
    };
    expect(reviewCardSchema.parse(validSuspended).suspended).toBe(true);

    // Invalid: suspended=true without reason
    const invalidSuspendedNoReason = {
      id: generateId(),
      knowledgeItemId: kid,
      schemaVersion: 1,
      suspended: true,
      createdAt: now,
      updatedAt: now,
      type: 'cloze',
      prompt: 'Q',
      answer: 'A',
    };
    expect(() => reviewCardSchema.parse(invalidSuspendedNoReason)).toThrow();

    // Invalid: suspended=false with reason
    const invalidActiveWithReason = {
      id: generateId(),
      knowledgeItemId: kid,
      schemaVersion: 1,
      suspended: false,
      suspendedReason: 'requires_clarification',
      createdAt: now,
      updatedAt: now,
      type: 'cloze',
      prompt: 'Q',
      answer: 'A',
    };
    expect(() => reviewCardSchema.parse(invalidActiveWithReason)).toThrow();
  });

  it('rejects invalid Cloze cards and unsupported card types', () => {
    const baseCloze = {
      id: generateId(),
      knowledgeItemId: generateId(),
      schemaVersion: 1,
      suspended: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      type: 'cloze',
      prompt: 'The capital of France is ____.',
      answer: 'Paris',
    };
    expect(() => reviewCardSchema.parse({ ...baseCloze, prompt: '' })).toThrow();
    expect(() => reviewCardSchema.parse({ ...baseCloze, answer: '' })).toThrow();

    const invalidCard = {
      id: generateId(),
      knowledgeItemId: generateId(),
      schemaVersion: 1,
      suspended: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      type: 'matching',
      prompt: 'Match capitals to countries.',
      answer: 'Paris',
    };

    expect(() => reviewCardSchema.parse(invalidCard)).toThrow();
  });

  it('rejects invalid MCQs: out of bounds index, <2 options, case-insensitive duplicate options after trimming', () => {
    // Out of bounds index
    expect(() =>
      mcqDraftSchema.parse({
        type: 'mcq',
        question: 'What is 1+1?',
        options: ['1', '2', '3'],
        correctOptionIndex: 3,
      }),
    ).toThrow();

    // Less than 2 options
    expect(() =>
      mcqDraftSchema.parse({
        type: 'mcq',
        question: 'What is 1+1?',
        options: ['2'],
        correctOptionIndex: 0,
      }),
    ).toThrow();

    // Duplicate options (exact)
    expect(() =>
      mcqDraftSchema.parse({
        type: 'mcq',
        question: 'What is 1+1?',
        options: ['2', '2'],
        correctOptionIndex: 0,
      }),
    ).toThrow();

    // Duplicate options (case-insensitive + trimmed)
    expect(() =>
      mcqDraftSchema.parse({
        type: 'mcq',
        question: 'What is the primary gas?',
        options: ['Nitrogen', '  nitrogen  ', 'Oxygen'],
        correctOptionIndex: 0,
      }),
    ).toThrow();
  });

  it('ensures generated IDs are opaque, valid UUIDs and rejects non-cryptographic IDs', () => {
    const id1 = generateId();
    const id2 = generateId();

    expect(isValidId(id1)).toBe(true);
    expect(isValidId(id2)).toBe(true);
    expect(id1).not.toBe(id2);

    expect(opaqueIdSchema.safeParse(id1).success).toBe(true);
    expect(opaqueIdSchema.safeParse('not-a-uuid').success).toBe(false);
    expect(opaqueIdSchema.safeParse('').success).toBe(false);
    expect(opaqueIdSchema.safeParse('12345').success).toBe(false);
  });

  it('throws an error if no cryptographically secure RNG is available', () => {
    const originalCrypto = globalThis.crypto;
    try {
      delete (globalThis as any).crypto;
      expect(() => generateId()).toThrow(/Cryptographically secure RNG unavailable/);
    } finally {
      globalThis.crypto = originalCrypto;
    }
  });

  it('enforces strict ReviewEvent invariants: deviceId required, objectiveCorrect semantics by card type', () => {
    const kid = generateId();
    const cid = generateId();
    const eid = generateId();
    const now = new Date().toISOString();

    const baseEvent = {
      id: eid,
      cardId: cid,
      knowledgeItemId: kid,
      reviewTimestamp: now,
      rating: 'good' as const,
      guessedOrStruggled: false,
      deviceId: 'mobile-pixel-8',
      schedulerMetadata: {
        algorithm: DEFAULT_SCHEDULER_IDENTITY.algorithm,
        implementation: DEFAULT_SCHEDULER_IDENTITY.implementation,
        implementationVersion: DEFAULT_SCHEDULER_IDENTITY.implementationVersion,
        parameterSetId: DEFAULT_SCHEDULER_IDENTITY.parameterSetId,
        scheduledDays: 1,
        stability: 2.5,
        difficulty: 5.0,
        desiredRetention: 0.90,
      },
      schemaVersion: 1 as const,
    };

    // MCQ with boolean objectiveCorrect: valid
    expect(reviewEventSchema.parse({
      ...baseEvent,
      cardType: 'mcq',
      objectiveCorrect: true,
    }).objectiveCorrect).toBe(true);

    // TrueFalse with boolean objectiveCorrect: valid
    expect(reviewEventSchema.parse({
      ...baseEvent,
      cardType: 'true_false',
      objectiveCorrect: false,
    }).objectiveCorrect).toBe(false);

    // MCQ with null objectiveCorrect: invalid (must be boolean)
    expect(() => reviewEventSchema.parse({
      ...baseEvent,
      cardType: 'mcq',
      objectiveCorrect: null,
    })).toThrow();

    // Free recall with null objectiveCorrect: valid
    expect(reviewEventSchema.parse({
      ...baseEvent,
      cardType: 'free_recall',
      objectiveCorrect: null,
    }).objectiveCorrect).toBeNull();

    // Flashcard with null objectiveCorrect: valid
    expect(reviewEventSchema.parse({
      ...baseEvent,
      cardType: 'flashcard',
      objectiveCorrect: null,
    }).objectiveCorrect).toBeNull();

    // Cloze with null objectiveCorrect: valid
    expect(reviewEventSchema.parse({
      ...baseEvent,
      cardType: 'cloze',
      objectiveCorrect: null,
    }).objectiveCorrect).toBeNull();

    // Free recall with boolean objectiveCorrect: invalid (must be null)
    expect(() => reviewEventSchema.parse({
      ...baseEvent,
      cardType: 'free_recall',
      objectiveCorrect: true,
    })).toThrow();

    // Flashcard with boolean objectiveCorrect: invalid (must be null)
    expect(() => reviewEventSchema.parse({
      ...baseEvent,
      cardType: 'flashcard',
      objectiveCorrect: false,
    })).toThrow();

    // Cloze with boolean objectiveCorrect: invalid (must be null)
    expect(() => reviewEventSchema.parse({
      ...baseEvent,
      cardType: 'cloze',
      objectiveCorrect: true,
    })).toThrow();

    // Missing deviceId: invalid (no silent default)
    const missingDevice = { ...baseEvent, cardType: 'flashcard', objectiveCorrect: null };
    delete (missingDevice as any).deviceId;
    expect(() => reviewEventSchema.parse(missingDevice)).toThrow();
  });
});
