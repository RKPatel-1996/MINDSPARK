import { describe, it, expect, beforeEach } from 'vitest';
import { createInMemoryRepositories } from '../persistence/memory/inMemoryRepositories';
import { bootstrapUserRepositories } from '../application/bootstrapService';
import {
  inspectImportDraft,
  computeItemFingerprint,
  importDraftPayload,
  findDuplicateKnowledgeItem,
} from '../application/importService';
import { CANONICAL_TAXONOMY_REGISTRY } from '../application/canonicalTaxonomy';
import { SEED_PACKETS } from '../application/seedData';
import type { Repositories } from '../application/types';

describe('Import Draft Inspection', () => {
  let repos: Repositories;

  beforeEach(async () => {
    repos = createInMemoryRepositories();
    await bootstrapUserRepositories(repos);
  });

  it('valid unique packet returns status: ready and reports correct preview fields', async () => {
    const packet = SEED_PACKETS[0];
    const inspection = await inspectImportDraft(packet, repos, CANONICAL_TAXONOMY_REGISTRY);

    expect(inspection.ok).toBe(true);
    if (inspection.ok) {
      expect(inspection.status).toBe('ready');
      expect(inspection.preview.title).toBe(packet.item.title);
      expect(inspection.preview.taxonomy.domainId).toBe(packet.item.taxonomy.domainId);
      expect(inspection.preview.taxonomy.topicId).toBe(packet.item.taxonomy.topicId);
      expect(inspection.preview.taxonomy.subtopicId).toBe(packet.item.taxonomy.subtopicId);

      const expectedFingerprint = computeItemFingerprint(
        packet.item.taxonomy.domainId,
        packet.item.taxonomy.topicId,
        packet.item.taxonomy.subtopicId,
        packet.item.title
      );
      expect(inspection.fingerprint).toBe(expectedFingerprint);

      expect(inspection.preview.cardCount).toBe(packet.cards.length);
      expect(inspection.preview.cardTypeCounts).toEqual({
        free_recall: packet.cards.filter((c) => c.type === 'free_recall').length,
        flashcard: packet.cards.filter((c) => c.type === 'flashcard').length,
        mcq: packet.cards.filter((c) => c.type === 'mcq').length,
        true_false: packet.cards.filter((c) => c.type === 'true_false').length,
        cloze: 0,
      });
      expect(inspection.preview.tags).toEqual(packet.item.tags ?? []);
      expect(inspection.preview.sourceCount).toBe(packet.item.sources?.length ?? 0);
    }
  });

  it('optional tags and sources default gracefully (tags as empty array, sourceCount as 0)', async () => {
    const packet = JSON.parse(JSON.stringify(SEED_PACKETS[0]));
    delete packet.item.tags;
    delete packet.item.sources;

    const inspection = await inspectImportDraft(packet, repos, CANONICAL_TAXONOMY_REGISTRY);

    expect(inspection.ok).toBe(true);
    if (inspection.ok) {
      expect(inspection.preview.tags).toEqual([]);
      expect(inspection.preview.sourceCount).toBe(0);
    }
  });

  it('counts Cloze cards while preserving total-card semantics', async () => {
    const packet = JSON.parse(JSON.stringify(SEED_PACKETS[0]));
    packet.cards.push({
      type: 'cloze',
      prompt: 'DNA polymerase synthesizes DNA in the ____ direction.',
      answer: '5′ → 3′',
    });

    const inspection = await inspectImportDraft(packet, repos, CANONICAL_TAXONOMY_REGISTRY);

    expect(inspection.ok).toBe(true);
    if (inspection.ok) {
      expect(inspection.preview.cardCount).toBe(packet.cards.length);
      expect(inspection.preview.cardTypeCounts.cloze).toBe(1);
      expect(
        Object.values(inspection.preview.cardTypeCounts).reduce((total, count) => total + count, 0),
      ).toBe(packet.cards.length);
    }
  });

  it('inspection performs zero persistence writes across all entities', async () => {
    const packet = SEED_PACKETS[0];
    const initialKnowledge = await repos.knowledge.list();
    const initialCards = await repos.reviewCards.list();
    const initialEvents = await repos.reviewEvents.listForCard('any-card');

    const inspection = await inspectImportDraft(packet, repos, CANONICAL_TAXONOMY_REGISTRY);
    expect(inspection.ok).toBe(true);

    const postKnowledge = await repos.knowledge.list();
    const postCards = await repos.reviewCards.list();
    const postEvents = await repos.reviewEvents.listForCard('any-card');

    expect(postKnowledge.length).toBe(initialKnowledge.length);
    expect(postCards.length).toBe(initialCards.length);
    expect(postEvents.length).toBe(initialEvents.length);
  });

  it('inspection does not generate domain IDs, timestamps, or CardState', async () => {
    const packet = SEED_PACKETS[0];
    const inspection = await inspectImportDraft(packet, repos, CANONICAL_TAXONOMY_REGISTRY);

    expect(inspection.ok).toBe(true);
    // Normalized draft must have raw DTO shape without domain materialization
    expect((inspection.normalizedDraft.item as Record<string, unknown>).id).toBeUndefined();
    expect((inspection.normalizedDraft.item as Record<string, unknown>).createdAt).toBeUndefined();
    expect((inspection.normalizedDraft.item as Record<string, unknown>).updatedAt).toBeUndefined();

    for (const card of inspection.normalizedDraft.cards) {
      expect((card as Record<string, unknown>).id).toBeUndefined();
      expect((card as Record<string, unknown>).knowledgeItemId).toBeUndefined();
      expect((card as Record<string, unknown>).createdAt).toBeUndefined();
      expect((card as Record<string, unknown>).updatedAt).toBeUndefined();
      expect((card as Record<string, unknown>).suspended).toBeUndefined();
    }

    // No card state materialized
    expect((inspection as Record<string, unknown>).initialStates).toBeUndefined();
    expect((inspection as Record<string, unknown>).cardStates).toBeUndefined();
  });

  it('Zod trimming and normalization are reflected in the returned normalized draft', async () => {
    const packet = JSON.parse(JSON.stringify(SEED_PACKETS[0]));
    packet.item.title = `   ${packet.item.title}   `;
    packet.item.content = `   ${packet.item.content}   `;

    const inspection = await inspectImportDraft(packet, repos, CANONICAL_TAXONOMY_REGISTRY);
    expect(inspection.ok).toBe(true);

    expect(inspection.normalizedDraft.item.title).toBe(packet.item.title.trim());
    expect(inspection.normalizedDraft.item.content).toBe(packet.item.content.trim());
    expect(inspection.preview.title).toBe(packet.item.title.trim());
  });

  it('duplicate packet returns status: duplicate with existing ID and same fingerprint', async () => {
    const packet = SEED_PACKETS[0];

    // First, do an actual import
    const importRes = await importDraftPayload(packet, repos, CANONICAL_TAXONOMY_REGISTRY);
    expect(importRes.ok).toBe(true);
    let existingId = '';
    if (importRes.ok) existingId = importRes.result.knowledgeItem.id;

    // Now inspect
    const inspection = await inspectImportDraft(packet, repos, CANONICAL_TAXONOMY_REGISTRY);
    expect(inspection.ok).toBe(false);
    if (!inspection.ok && inspection.status === 'duplicate') {
      expect(inspection.status).toBe('duplicate');
      expect(inspection.existingKnowledgeItemId).toBe(existingId);

      const expectedFingerprint = computeItemFingerprint(
        packet.item.taxonomy.domainId,
        packet.item.taxonomy.topicId,
        packet.item.taxonomy.subtopicId,
        packet.item.title
      );
      expect(inspection.fingerprint).toBe(expectedFingerprint);

      // Preview is still populated for inspection UI
      expect(inspection.preview.title).toBe(packet.item.title);
      expect(inspection.preview.cardCount).toBe(packet.cards.length);
      expect(inspection.preview.cardTypeCounts).toBeDefined();
    }
  });

  it('preview and actual import agree on duplicate identity and fingerprint rule', async () => {
    const packet = SEED_PACKETS[1];

    // Inspect unique packet first
    const inspection1 = await inspectImportDraft(packet, repos, CANONICAL_TAXONOMY_REGISTRY);
    expect(inspection1.ok).toBe(true);
    const expectedFp = computeItemFingerprint(
      packet.item.taxonomy.domainId,
      packet.item.taxonomy.topicId,
      packet.item.taxonomy.subtopicId,
      packet.item.title
    );
    expect(inspection1.fingerprint).toBe(expectedFp);

    // Import packet
    const importRes = await importDraftPayload(packet, repos, CANONICAL_TAXONOMY_REGISTRY);
    expect(importRes.ok).toBe(true);
    if (importRes.ok) {
      const persistedFp = computeItemFingerprint(
        importRes.result.knowledgeItem.taxonomy.domainId,
        importRes.result.knowledgeItem.taxonomy.topicId,
        importRes.result.knowledgeItem.taxonomy.subtopicId,
        importRes.result.knowledgeItem.title
      );
      expect(persistedFp).toBe(expectedFp);
    }

    // Inspect duplicate
    const inspection2 = await inspectImportDraft(packet, repos, CANONICAL_TAXONOMY_REGISTRY);
    expect(inspection2.ok).toBe(false);
    if (!inspection2.ok) {
      expect(inspection2.fingerprint).toBe(expectedFp);
    }

    // Attempt second import
    const importRes2 = await importDraftPayload(packet, repos, CANONICAL_TAXONOMY_REGISTRY);
    expect(importRes2.ok).toBe(false);
    if (!importRes2.ok && importRes2.status === 'duplicate') {
      expect(importRes2.fingerprint).toBe(expectedFp);
      if (!inspection2.ok && inspection2.status === 'duplicate') {
        expect(importRes2.existingKnowledgeItemId).toBe(inspection2.existingKnowledgeItemId);
      }
    }
  });

  it('malformed schema fails using canonical validation path', async () => {
    const packet = { ...SEED_PACKETS[0], item: { ...SEED_PACKETS[0].item, title: 123 } };
    await expect(inspectImportDraft(packet, repos, CANONICAL_TAXONOMY_REGISTRY)).rejects.toThrow();
  });

  it('unknown/mismatched taxonomy fails using canonical validator', async () => {
    const packet = JSON.parse(JSON.stringify(SEED_PACKETS[0]));
    packet.item.taxonomy.domainId = 'unknown-domain';
    await expect(
      inspectImportDraft(packet, repos, CANONICAL_TAXONOMY_REGISTRY)
    ).rejects.toThrow(/Controlled taxonomy validation failed/);
  });

  it('findDuplicateKnowledgeItem helper correctly locates existing items', async () => {
    const packet = SEED_PACKETS[2];
    const importRes = await importDraftPayload(packet, repos, CANONICAL_TAXONOMY_REGISTRY);
    expect(importRes.ok).toBe(true);

    const fp = computeItemFingerprint(
      packet.item.taxonomy.domainId,
      packet.item.taxonomy.topicId,
      packet.item.taxonomy.subtopicId,
      packet.item.title
    );

    const found = await findDuplicateKnowledgeItem(repos, fp);
    expect(found).toBeDefined();
    if (importRes.ok) {
      expect(found?.id).toBe(importRes.result.knowledgeItem.id);
    }

    const notFound = await findDuplicateKnowledgeItem(repos, 'nonexistent::fingerprint');
    expect(notFound).toBeUndefined();
  });
});
