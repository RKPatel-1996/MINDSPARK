import { describe, it, expect } from 'vitest';
import { transformDraftToDomain } from '../import/transformDraft';
import { isValidId, opaqueIdSchema } from '../domain/id';
import { knowledgeItemSchema } from '../domain/knowledge';
import { reviewCardSchema } from '../domain/card';
import { cardStateSchema } from '../domain/cardState';
import type { TaxonomyRegistry } from '../domain/taxonomy';

describe('V2 Import DTO Transformation and Controlled Taxonomy Validation', () => {
  const sampleRegistry: TaxonomyRegistry = {
    domains: [
      { id: 'biology', name: 'Biology', description: 'Life sciences' },
      { id: 'physics', name: 'Physics', description: 'Physical sciences' },
    ],
    topics: [
      { id: 'genetics', domainId: 'biology', name: 'Genetics' },
      { id: 'mechanics', domainId: 'physics', name: 'Classical Mechanics' },
    ],
    subtopics: [
      { id: 'molecular', topicId: 'genetics', name: 'Molecular Genetics' },
      { id: 'kinematics', topicId: 'mechanics', name: 'Kinematics' },
    ],
    allowedTags: ['dna', 'genetics', 'motion', 'forces'],
  };

  it('transforms a valid multi-card draft against a controlled registry into domain models with opaque UUIDs and learningSteps=0', () => {
    const rawDraft = {
      item: {
        title: 'DNA Double Helix',
        content: 'DNA is a double-stranded polymer of nucleotides forming a double helix.',
        explanationMarkdown: 'Watson and Crick proposed the model in 1953.',
        taxonomy: {
          domainId: 'biology',
          topicId: 'genetics',
          subtopicId: 'molecular',
        },
        tags: ['dna', 'genetics'],
        sources: [
          {
            title: 'Nature 1953',
            citation: 'Watson & Crick, Nature 171, 737–738',
          },
        ],
      },
      cards: [
        {
          type: 'free_recall',
          prompt: 'Describe the primary structure of DNA.',
          answerGuidance: 'Double-stranded helical polymer of nucleotide base pairs (A-T, G-C).',
        },
        {
          type: 'flashcard',
          front: 'Who published the double helix model in 1953?',
          back: 'James Watson and Francis Crick',
        },
        {
          type: 'mcq',
          question: 'Which base pairs with Adenine in DNA?',
          options: ['Cytosine', 'Guanine', 'Thymine', 'Uracil'],
          correctOptionIndex: 2,
          explanation: 'Thymine pairs with Adenine in DNA (Uracil in RNA).',
        },
        {
          type: 'true_false',
          statement: 'DNA nucleotides are joined together by peptide bonds.',
          isTrue: false,
          explanation: 'They are joined by phosphodiester bonds, not peptide bonds.',
        },
      ],
    };

    const result = transformDraftToDomain(rawDraft, sampleRegistry);

    // Verify knowledge item
    expect(isValidId(result.knowledgeItem.id)).toBe(true);
    expect(opaqueIdSchema.safeParse(result.knowledgeItem.id).success).toBe(true);
    expect(result.knowledgeItem.title).toBe(rawDraft.item.title);
    expect(result.knowledgeItem.status).toBe('active');
    expect(knowledgeItemSchema.safeParse(result.knowledgeItem).success).toBe(true);

    // Verify cards and initial states
    expect(result.cards).toHaveLength(4);
    expect(result.initialStates).toHaveLength(4);

    for (let i = 0; i < result.cards.length; i++) {
      const card = result.cards[i];
      const state = result.initialStates[i];

      // Opaque unique IDs
      expect(isValidId(card.id)).toBe(true);
      expect(opaqueIdSchema.safeParse(card.id).success).toBe(true);
      expect(card.id).not.toBe(result.knowledgeItem.id);

      // Sibling reference: each card points to parent knowledge item
      expect(card.knowledgeItemId).toBe(result.knowledgeItem.id);

      // Card suspension invariant: active cards have suspended=false and no reason
      expect(card.suspended).toBe(false);
      expect(card.suspendedReason).toBeUndefined();

      // Schema validity
      expect(reviewCardSchema.safeParse(card).success).toBe(true);
      expect(cardStateSchema.safeParse(state).success).toBe(true);

      // Initial state linkage & learningSteps = 0
      expect(state.cardId).toBe(card.id);
      expect(state.state).toBe('new');
      expect(state.reps).toBe(0);
      expect(state.learningSteps).toBe(0);
    }
  });

  it('rejects an import draft with unknown domain ID', () => {
    const invalidDomainDraft = {
      item: {
        title: 'Quantum Field Theory',
        content: 'Relativistic quantum fields',
        taxonomy: { domainId: 'invented-domain', topicId: 'genetics' },
      },
      cards: [
        {
          type: 'flashcard',
          front: 'What is QFT?',
          back: 'Quantum Field Theory',
        },
      ],
    };

    expect(() => transformDraftToDomain(invalidDomainDraft, sampleRegistry)).toThrow(
      /Unknown domain ID: "invented-domain"/,
    );
  });

  it('rejects an import draft with unknown topic ID', () => {
    const invalidTopicDraft = {
      item: {
        title: 'Neurobiology',
        content: 'Action potentials propagate down axons.',
        taxonomy: { domainId: 'biology', topicId: 'invented-topic' },
      },
      cards: [
        {
          type: 'flashcard',
          front: 'What is an action potential?',
          back: 'Electrical wave along axon membrane',
        },
      ],
    };

    expect(() => transformDraftToDomain(invalidTopicDraft, sampleRegistry)).toThrow(
      /Unknown topic ID: "invented-topic"/,
    );
  });

  it('rejects an import draft when topic does not belong to the specified domain', () => {
    // mechanics belongs to physics, but here domainId is biology
    const mismatchedTopicDraft = {
      item: {
        title: 'Newtonian Forces',
        content: 'F = ma',
        taxonomy: { domainId: 'biology', topicId: 'mechanics' },
      },
      cards: [
        {
          type: 'flashcard',
          front: 'What is F?',
          back: 'm * a',
        },
      ],
    };

    expect(() => transformDraftToDomain(mismatchedTopicDraft, sampleRegistry)).toThrow(
      /belongs to domain "physics", not "biology"/,
    );
  });

  it('rejects an import draft with unknown subtopic or mismatched subtopic', () => {
    // Unknown subtopic
    const unknownSubtopicDraft = {
      item: {
        title: 'Gene Expression',
        content: 'Transcription and translation',
        taxonomy: { domainId: 'biology', topicId: 'genetics', subtopicId: 'invented-subtopic' },
      },
      cards: [{ type: 'flashcard', front: 'Q', back: 'A' }],
    };
    expect(() => transformDraftToDomain(unknownSubtopicDraft, sampleRegistry)).toThrow(
      /Unknown subtopic ID: "invented-subtopic"/,
    );

    // Mismatched subtopic: kinematics belongs to mechanics, but genetics is specified
    const mismatchedSubtopicDraft = {
      item: {
        title: 'Gene Expression',
        content: 'Transcription and translation',
        taxonomy: { domainId: 'biology', topicId: 'genetics', subtopicId: 'kinematics' },
      },
      cards: [{ type: 'flashcard', front: 'Q', back: 'A' }],
    };
    expect(() => transformDraftToDomain(mismatchedSubtopicDraft, sampleRegistry)).toThrow(
      /belongs to topic "mechanics", not "genetics"/,
    );
  });

  it('rejects an import draft with unknown/invented controlled tags', () => {
    const invalidTagDraft = {
      item: {
        title: 'Mendelian Laws',
        content: 'Inheritance principles',
        taxonomy: { domainId: 'biology', topicId: 'genetics' },
        tags: ['dna', 'invented-ai-tag'],
      },
      cards: [{ type: 'flashcard', front: 'Q', back: 'A' }],
    };

    expect(() => transformDraftToDomain(invalidTagDraft, sampleRegistry)).toThrow(
      /Disallowed or unknown tag: "invented-ai-tag"/,
    );
  });

  it('rejects unknown/unsupported fields due to strict DTO validation', () => {
    const draftWithExtraField = {
      item: {
        title: 'Kinematics Basics',
        content: 'Velocity is derivative of displacement',
        taxonomy: { domainId: 'physics', topicId: 'mechanics' },
        aiConfidenceScore: 0.98, // Unsupported field!
      },
      cards: [{ type: 'flashcard', front: 'Q', back: 'A' }],
    };

    expect(() => transformDraftToDomain(draftWithExtraField, sampleRegistry)).toThrow();

    const cardWithExtraField = {
      item: {
        title: 'Kinematics Basics',
        content: 'Velocity is derivative of displacement',
        taxonomy: { domainId: 'physics', topicId: 'mechanics' },
      },
      cards: [{ type: 'flashcard', front: 'Q', back: 'A', extraNote: 'test' }], // Unsupported field!
    };

    expect(() => transformDraftToDomain(cardWithExtraField, sampleRegistry)).toThrow();
  });

  it('rejects an import draft with invalid MCQ (options < 2 or out-of-bounds correct index)', () => {
    const invalidMcqDraft = {
      item: {
        title: 'Mechanics',
        content: 'Energy conservation in closed systems',
        taxonomy: { domainId: 'physics', topicId: 'mechanics' },
      },
      cards: [
        {
          type: 'mcq',
          question: 'Is energy conserved?',
          options: ['Yes'], // Only 1 option!
          correctOptionIndex: 0,
        },
      ],
    };

    expect(() => transformDraftToDomain(invalidMcqDraft, sampleRegistry)).toThrow();
  });

  it('transforms a normalized Cloze draft into a valid initial ReviewCard and CardState', () => {
    const now = new Date('2026-09-01T10:00:00.000Z');
    const result = transformDraftToDomain({
      item: {
        title: 'DNA synthesis direction',
        content: 'DNA polymerase adds nucleotides in one direction.',
        taxonomy: { domainId: 'biology', topicId: 'genetics' },
      },
      cards: [{
        type: 'cloze',
        prompt: '  DNA polymerase synthesizes DNA in the ____ direction.  ',
        answer: '  5′ → 3′  ',
      }],
    }, sampleRegistry, { now });

    expect(result.cards).toHaveLength(1);
    expect(result.cards[0]).toMatchObject({
      type: 'cloze',
      prompt: 'DNA polymerase synthesizes DNA in the ____ direction.',
      answer: '5′ → 3′',
      schemaVersion: 1,
      suspended: false,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    });
    expect(reviewCardSchema.safeParse(result.cards[0]).success).toBe(true);
    expect(result.initialStates[0]).toMatchObject({
      cardId: result.cards[0].id,
      state: 'new',
      reps: 0,
      learningSteps: 0,
    });
  });

  it('strictly rejects Cloze drafts with unknown fields or empty prompt/answer', () => {
    const baseDraft = {
      item: {
        title: 'DNA synthesis direction',
        content: 'DNA polymerase adds nucleotides in one direction.',
        taxonomy: { domainId: 'biology', topicId: 'genetics' },
      },
      cards: [{
        type: 'cloze',
        prompt: 'DNA polymerase synthesizes DNA in the ____ direction.',
        answer: '5′ → 3′',
      }],
    };
    expect(() => transformDraftToDomain({
      ...baseDraft,
      cards: [{ ...baseDraft.cards[0], hint: 'No hints are supported' }],
    }, sampleRegistry)).toThrow();
    expect(() => transformDraftToDomain({
      ...baseDraft,
      cards: [{ ...baseDraft.cards[0], prompt: '   ' }],
    }, sampleRegistry)).toThrow();
    expect(() => transformDraftToDomain({
      ...baseDraft,
      cards: [{ ...baseDraft.cards[0], answer: '   ' }],
    }, sampleRegistry)).toThrow();
  });
});
