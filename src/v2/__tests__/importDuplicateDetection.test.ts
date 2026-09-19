import { describe, it, expect, beforeEach } from 'vitest';
import { createInMemoryRepositories } from '../persistence/memory/inMemoryRepositories';
import { bootstrapUserRepositories } from '../application/bootstrapService';
import { seedInitialLibrary, importDraftPayload, computeItemFingerprint } from '../application/importService';
import { CANONICAL_TAXONOMY_REGISTRY } from '../application/canonicalTaxonomy';
import { SEED_PACKETS } from '../application/seedData';
import type { Repositories } from '../application/types';

describe('Duplicate Detection in Import', () => {
  let repos: Repositories;
  
  beforeEach(async () => {
    repos = createInMemoryRepositories();
    await bootstrapUserRepositories(repos);
  });

  it('a normal unique import persists exactly one KnowledgeItem bundle', async () => {
    const packet = SEED_PACKETS[0];
    const result = await importDraftPayload(packet, repos, CANONICAL_TAXONOMY_REGISTRY);
    
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.status).toBe('imported');
      const items = await repos.knowledge.list();
      expect(items.length).toBe(1);
    }
  });

  it('importing the same taxonomy/title fingerprint again returns duplicate and performs no second persistence write', async () => {
    const packet = SEED_PACKETS[0];
    
    // First import
    const result1 = await importDraftPayload(packet, repos, CANONICAL_TAXONOMY_REGISTRY);
    expect(result1.ok).toBe(true);
    
    // Second import (exact same)
    const result2 = await importDraftPayload(packet, repos, CANONICAL_TAXONOMY_REGISTRY);
    expect(result2.ok).toBe(false);
    if (result2.status === 'duplicate') {
      expect(result2.status).toBe('duplicate');
      expect(result2.fingerprint).toBe(computeItemFingerprint(
        packet.item.taxonomy.domainId,
        packet.item.taxonomy.topicId,
        packet.item.taxonomy.subtopicId,
        packet.item.title
      ));
    }
    
    // Ensure no second write
    const items = await repos.knowledge.list();
    expect(items.length).toBe(1);
  });

  it('duplicate detection is case-insensitive and trim-normalized according to computeItemFingerprint', async () => {
    const packet = SEED_PACKETS[0];
    
    // First import
    await importDraftPayload(packet, repos, CANONICAL_TAXONOMY_REGISTRY);
    
    // Second import (modify packet to have different case/whitespace but same fingerprint)
    const packetModified = JSON.parse(JSON.stringify(packet));
    packetModified.item.title = `  ${packet.item.title.toUpperCase()}  `;
    
    const result2 = await importDraftPayload(packetModified, repos, CANONICAL_TAXONOMY_REGISTRY);
    expect(result2.ok).toBe(false);
    if (result2.status === 'duplicate') {
      expect(result2.status).toBe('duplicate');
    }
    
    const items = await repos.knowledge.list();
    expect(items.length).toBe(1);
  });

  it('different topic/subtopic produces a different fingerprint and imports successfully', async () => {
    const packet = SEED_PACKETS[0];
    
    // First import
    await importDraftPayload(packet, repos, CANONICAL_TAXONOMY_REGISTRY);
    
    // Let's modify the topic to something different but still valid in the test taxonomy if possible.
    // However, the test taxonomy might be strict. We can just pick the last packet in SEED_PACKETS, 
    // and give it the title of the first packet, assuming they have different topics.
    // Let's find a packet with a different topic.
    const differentPacket = SEED_PACKETS.find(p => p.item.taxonomy.topicId !== packet.item.taxonomy.topicId);
    expect(differentPacket).toBeDefined();
    
    if (differentPacket) {
      const packet2 = JSON.parse(JSON.stringify(differentPacket));
      packet2.item.title = packet.item.title; // same title, different topic!
      
      const result2 = await importDraftPayload(packet2, repos, CANONICAL_TAXONOMY_REGISTRY);
      expect(result2.ok).toBe(true);
      
      const items = await repos.knowledge.list();
      expect(items.length).toBe(2);
    }
  });

  it('existing seed idempotency still passes', async () => {
    // First seed
    const res1 = await seedInitialLibrary(repos);
    expect(res1.itemsSeeded).toBeGreaterThan(0);
    
    // Second seed
    const res2 = await seedInitialLibrary(repos);
    expect(res2.skippedExisting).toBe(res1.itemsSeeded);
    expect(res2.itemsSeeded).toBe(0);
  });
});
