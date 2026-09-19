import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as firestoreModule from 'firebase/firestore';
import { createInMemoryRepositories } from '../persistence/memory/inMemoryRepositories';
import { createSignedOutRepositories } from '../persistence/signedOut/signedOutRepositories';
import { createUnconfiguredRepositories } from '../persistence/unconfigured/unconfiguredRepositories';
import { FirestoreTaxonomyRepository } from '../persistence/firebase/repositories/firestoreRepositories';
import { bootstrapUserRepositories } from '../application/bootstrapService';
import {
  TaxonomyService,
  slugifyTaxonomyName,
  normalizeDisplayName,
  DuplicateTaxonomyError,
  TaxonomyParentNotFoundError,
  TaxonomyNodeNotFoundError,
  TaxonomyError,
} from '../application/taxonomyService';
import { inspectImportDraft } from '../application/importService';
import { SEED_PACKETS } from '../application/seedData';
import { taxonomyRegistrySchema } from '../domain/taxonomy';
import type { Repositories } from '../application/types';

vi.mock('firebase/firestore', async (importOriginal) => {
  const actual = await importOriginal<Record<string, any>>();
  return {
    ...actual,
    doc: vi.fn((_db: any, path: string) => ({ path, id: 'current' })),
    runTransaction: vi.fn(),
  };
});

describe('Taxonomy Mutation Service & Atomic Persistence (Task 4/5)', () => {
  let repos: Repositories;
  let taxonomyService: TaxonomyService;

  beforeEach(async () => {
    repos = createInMemoryRepositories();
    await bootstrapUserRepositories(repos);
    taxonomyService = new TaxonomyService(repos.taxonomy);
  });

  describe('Slugification & Display Name Normalization', () => {
    it('canonical helper normalizes names per specification rules', () => {
      expect(slugifyTaxonomyName('Molecular Biology')).toBe('molecular-biology');
      expect(slugifyTaxonomyName('  Advanced   AI & Machine Learning!  ')).toBe('advanced-ai-machine-learning');
      expect(slugifyTaxonomyName('--Leading and Trailing--')).toBe('leading-and-trailing');
      expect(slugifyTaxonomyName('C++ / C#')).toBe('c-c');
      expect(slugifyTaxonomyName('   ')).toBe('');
    });

    it('normalizes display names case-insensitively with trimming', () => {
      expect(normalizeDisplayName('  Molecular Biology ')).toBe('molecular biology');
      expect(normalizeDisplayName('BIOLOGY')).toBe('biology');
    });
  });

  describe('Node Creation & ID Allocation', () => {
    it('domain creation generates normalized ID and preserves details', async () => {
      const domain = await taxonomyService.addDomain({
        name: 'Cognitive Science',
        description: 'Study of mind and intelligence',
      });

      expect(domain.id).toBe('cognitive-science');
      expect(domain.name).toBe('Cognitive Science');
      expect(domain.description).toBe('Study of mind and intelligence');

      const registry = await taxonomyService.getRegistry();
      expect(registry.domains.some((d) => d.id === 'cognitive-science')).toBe(true);
    });

    it('topic creation preserves correct parent domain ID', async () => {
      const domain = await taxonomyService.addDomain({ name: 'Neuroscience' });
      const topic = await taxonomyService.addTopic({
        domainId: domain.id,
        name: 'Synaptic Plasticity',
        description: 'LTP and LTD mechanisms',
      });

      expect(topic.id).toBe('synaptic-plasticity');
      expect(topic.domainId).toBe(domain.id);
      expect(topic.name).toBe('Synaptic Plasticity');

      const registry = await taxonomyService.getRegistry();
      const storedTopic = registry.topics.find((t) => t.id === topic.id);
      expect(storedTopic).toBeDefined();
      expect(storedTopic?.domainId).toBe('neuroscience');
    });

    it('subtopic creation preserves correct parent topic ID', async () => {
      const domain = await taxonomyService.addDomain({ name: 'Genetics' });
      const topic = await taxonomyService.addTopic({
        domainId: domain.id,
        name: 'Epigenetics',
      });
      const subtopic = await taxonomyService.addSubtopic({
        topicId: topic.id,
        name: 'DNA Methylation',
        description: 'CpG island methylation',
      });

      expect(subtopic.id).toBe('dna-methylation');
      expect(subtopic.topicId).toBe(topic.id);
      expect(subtopic.name).toBe('DNA Methylation');

      const registry = await taxonomyService.getRegistry();
      const storedSubtopic = registry.subtopics.find((s) => s.id === subtopic.id);
      expect(storedSubtopic).toBeDefined();
      expect(storedSubtopic?.topicId).toBe('epigenetics');
    });

    it('tag creation normalizes to controlled-tag format', async () => {
      const tag = await taxonomyService.addTag('Experimental Design');
      expect(tag).toBe('experimental-design');

      const registry = await taxonomyService.getRegistry();
      expect(registry.allowedTags.includes('experimental-design')).toBe(true);
    });

    it('rejects empty or unusable tag values', async () => {
      await expect(taxonomyService.addTag('   ')).rejects.toThrow(TaxonomyError);
      await expect(taxonomyService.addTag('???')).rejects.toThrow(TaxonomyError);
    });
  });

  describe('Duplicate & Collision Rules', () => {
    it('duplicate sibling names are rejected case-insensitively for domains', async () => {
      await taxonomyService.addDomain({ name: 'Biochemistry' });

      await expect(taxonomyService.addDomain({ name: 'biochemistry' })).rejects.toThrow(
        DuplicateTaxonomyError
      );
      await expect(taxonomyService.addDomain({ name: '  BIOCHEMISTRY  ' })).rejects.toThrow(
        DuplicateTaxonomyError
      );
    });

    it('duplicate sibling names are rejected case-insensitively for topics under same domain', async () => {
      const domain = await taxonomyService.addDomain({ name: 'Physics' });
      await taxonomyService.addTopic({ domainId: domain.id, name: 'Thermodynamics' });

      await expect(
        taxonomyService.addTopic({ domainId: domain.id, name: 'thermodynamics' })
      ).rejects.toThrow(DuplicateTaxonomyError);
    });

    it('duplicate sibling names are rejected case-insensitively for subtopics under same topic', async () => {
      const domain = await taxonomyService.addDomain({ name: 'Math' });
      const topic = await taxonomyService.addTopic({ domainId: domain.id, name: 'Calculus' });
      await taxonomyService.addSubtopic({ topicId: topic.id, name: 'Integration' });

      await expect(
        taxonomyService.addSubtopic({ topicId: topic.id, name: 'integration' })
      ).rejects.toThrow(DuplicateTaxonomyError);
    });

    it('duplicate tag is rejected globally', async () => {
      await taxonomyService.addTag('custom-protocol');
      await expect(taxonomyService.addTag('custom-protocol')).rejects.toThrow(
        DuplicateTaxonomyError
      );
      await expect(taxonomyService.addTag('Custom Protocol')).rejects.toThrow(
        DuplicateTaxonomyError
      );
    });

    it('allows same topic name under different domains with deterministic suffix IDs', async () => {
      const domainA = await taxonomyService.addDomain({ name: 'Domain Alpha' });
      const domainB = await taxonomyService.addDomain({ name: 'Domain Beta' });

      const topicA = await taxonomyService.addTopic({ domainId: domainA.id, name: 'Introduction' });
      expect(topicA.id).toBe('introduction');

      const topicB = await taxonomyService.addTopic({ domainId: domainB.id, name: 'Introduction' });
      expect(topicB.id).toBe('introduction-2');
      expect(topicB.domainId).toBe(domainB.id);

      const domainC = await taxonomyService.addDomain({ name: 'Domain Gamma' });
      const topicC = await taxonomyService.addTopic({ domainId: domainC.id, name: 'Introduction' });
      expect(topicC.id).toBe('introduction-3');
    });

    it('allows same subtopic name under different topics with deterministic suffix IDs', async () => {
      const domain = await taxonomyService.addDomain({ name: 'Engineering' });
      const topicA = await taxonomyService.addTopic({ domainId: domain.id, name: 'Mechanics' });
      const topicB = await taxonomyService.addTopic({ domainId: domain.id, name: 'Electronics' });

      const subA = await taxonomyService.addSubtopic({ topicId: topicA.id, name: 'Fundamentals' });
      expect(subA.id).toBe('fundamentals');

      const subB = await taxonomyService.addSubtopic({ topicId: topicB.id, name: 'Fundamentals' });
      expect(subB.id).toBe('fundamentals-2');
    });

    it('slug collision with different display name generates deterministic -2, -3 suffixes', async () => {
      const d1 = await taxonomyService.addDomain({ name: 'Computer Science' });
      expect(d1.id).toBe('computer-science');

      // Different display name, but same slug base
      const d2 = await taxonomyService.addDomain({ name: 'Computer / Science' });
      expect(d2.id).toBe('computer-science-2');
      expect(d2.name).toBe('Computer / Science');

      const d3 = await taxonomyService.addDomain({ name: 'Computer & Science' });
      expect(d3.id).toBe('computer-science-3');
      expect(d3.name).toBe('Computer & Science');
    });
  });

  describe('Parent & Node Integrity Validation', () => {
    it('rejects adding topic to non-existent domain', async () => {
      await expect(
        taxonomyService.addTopic({ domainId: 'non-existent-domain', name: 'Optics' })
      ).rejects.toThrow(TaxonomyParentNotFoundError);
    });

    it('rejects adding subtopic to non-existent topic', async () => {
      await expect(
        taxonomyService.addSubtopic({ topicId: 'non-existent-topic', name: 'Waveguides' })
      ).rejects.toThrow(TaxonomyParentNotFoundError);
    });

    it('rejects renaming non-existent nodes', async () => {
      await expect(taxonomyService.renameDomain('ghost-domain', 'New Name')).rejects.toThrow(
        TaxonomyNodeNotFoundError
      );
      await expect(taxonomyService.renameTopic('ghost-topic', 'New Name')).rejects.toThrow(
        TaxonomyNodeNotFoundError
      );
      await expect(taxonomyService.renameSubtopic('ghost-subtopic', 'New Name')).rejects.toThrow(
        TaxonomyNodeNotFoundError
      );
    });
  });

  describe('Renaming Preserves Immutability & Reference Validity', () => {
    it('renaming domain preserves ID and updates display name and description', async () => {
      const domain = await taxonomyService.addDomain({
        name: 'Original Domain',
        description: 'Old Desc',
      });
      const renamed = await taxonomyService.renameDomain(domain.id, 'Renamed Domain', 'New Desc');

      expect(renamed.id).toBe('original-domain');
      expect(renamed.name).toBe('Renamed Domain');
      expect(renamed.description).toBe('New Desc');

      const registry = await taxonomyService.getRegistry();
      const stored = registry.domains.find((d) => d.id === domain.id);
      expect(stored?.name).toBe('Renamed Domain');
    });

    it('renaming topic preserves ID and parent domain ID', async () => {
      const domain = await taxonomyService.addDomain({ name: 'Medical Sciences' });
      const topic = await taxonomyService.addTopic({ domainId: domain.id, name: 'Cardiology' });

      const renamed = await taxonomyService.renameTopic(
        topic.id,
        'Cardiovascular Medicine',
        'Updated cardiology topic'
      );

      expect(renamed.id).toBe('cardiology');
      expect(renamed.domainId).toBe(domain.id);
      expect(renamed.name).toBe('Cardiovascular Medicine');

      const registry = await taxonomyService.getRegistry();
      const stored = registry.topics.find((t) => t.id === topic.id);
      expect(stored?.name).toBe('Cardiovascular Medicine');
      expect(stored?.domainId).toBe(domain.id);
    });

    it('renaming subtopic preserves ID and parent topic ID', async () => {
      const domain = await taxonomyService.addDomain({ name: 'Robotics' });
      const topic = await taxonomyService.addTopic({ domainId: domain.id, name: 'Control' });
      const subtopic = await taxonomyService.addSubtopic({ topicId: topic.id, name: 'PID' });

      const renamed = await taxonomyService.renameSubtopic(
        subtopic.id,
        'PID Controllers',
        'Feedback loops'
      );

      expect(renamed.id).toBe('pid');
      expect(renamed.topicId).toBe(topic.id);
      expect(renamed.name).toBe('PID Controllers');
    });

    it('renaming to a sibling duplicate is rejected', async () => {
      const domain = await taxonomyService.addDomain({ name: 'Languages' });
      await taxonomyService.addTopic({ domainId: domain.id, name: 'Spanish' });
      const topic2 = await taxonomyService.addTopic({ domainId: domain.id, name: 'French' });

      await expect(taxonomyService.renameTopic(topic2.id, 'spanish')).rejects.toThrow(
        DuplicateTaxonomyError
      );
    });

    it('renaming node to same name or updating description only does not collide with itself', async () => {
      const domain = await taxonomyService.addDomain({ name: 'Philosophy', description: 'Desc 1' });
      const updated = await taxonomyService.renameDomain(domain.id, 'Philosophy', 'Desc 2');
      expect(updated.name).toBe('Philosophy');
      expect(updated.description).toBe('Desc 2');
    });
  });

  describe('Schema Validation & Mutation Guarantees', () => {
    it('every mutated registry satisfies taxonomyRegistrySchema', async () => {
      await taxonomyService.addDomain({ name: 'Schema Test Domain' });
      const registry = await taxonomyService.getRegistry();
      const validated = taxonomyRegistrySchema.safeParse(registry);
      expect(validated.success).toBe(true);
    });

    it('raw mutation rejecting schema invalidation fails and leaves registry unmodified', async () => {
      const before = await repos.taxonomy.get();
      await expect(
        repos.taxonomy.mutate((current) => ({
          ...current,
          domains: [
            ...current.domains,
            // Invalid domain (empty id and name violates min(1))
            { id: '', name: '' },
          ],
        }))
      ).rejects.toThrow();

      const after = await repos.taxonomy.get();
      expect(after).toEqual(before);
    });

    it('fails clearly when mutating a non-existent registry instead of fabricating one', async () => {
      const emptyRepo = createInMemoryRepositories().taxonomy;
      await expect(
        emptyRepo.mutate((current) => current)
      ).rejects.toThrow('Taxonomy registry does not exist');
    });
  });

  describe('Import Strictness Invariant', () => {
    it('import inspection still strictly rejects unknown taxonomy rather than auto-creating it', async () => {
      const packet = JSON.parse(JSON.stringify(SEED_PACKETS[0]));
      packet.item.taxonomy.domainId = 'unknown-domain-xyz';

      await expect(
        inspectImportDraft(packet, repos)
      ).rejects.toThrow(/Controlled taxonomy validation failed/);

      // Verify registry was NOT modified by import inspection
      const registry = await taxonomyService.getRegistry();
      expect(registry.domains.some((d) => d.id === 'unknown-domain-xyz')).toBe(false);
    });
  });

  describe('Concurrency & Gating Semantics', () => {
    it('signed-out and unconfigured repositories reject mutation', async () => {
      const signedOutRepo = createSignedOutRepositories().taxonomy;
      await expect(signedOutRepo.mutate((c) => c)).rejects.toThrow('Authentication required');

      const unconfiguredRepo = createUnconfiguredRepositories().taxonomy;
      await expect(unconfiguredRepo.mutate((c) => c)).rejects.toThrow('Configuration required');
    });

    it('in-memory atomic mutation serializes concurrent operations without losing additions', async () => {
      const names = ['Concurrent A', 'Concurrent B', 'Concurrent C', 'Concurrent D', 'Concurrent E'];
      await Promise.all(names.map((name) => taxonomyService.addDomain({ name })));

      const registry = await taxonomyService.getRegistry();
      for (const name of names) {
        expect(registry.domains.some((d) => d.name === name)).toBe(true);
      }
    });

    it('Firestore repository implementation uses transaction-based mutation', async () => {
      const fakeRegistry = await repos.taxonomy.get();
      const mockSnapshot = {
        exists: () => true,
        data: () => fakeRegistry,
      };

      const transactionContext = {
        get: vi.fn().mockResolvedValue(mockSnapshot),
        set: vi.fn(),
      };

      vi.mocked(firestoreModule.runTransaction).mockImplementation(
        async (_db: any, updateFunction: any) => {
          return await updateFunction(transactionContext);
        }
      );

      const mockDb = {} as any;
      const firestoreRepo = new FirestoreTaxonomyRepository(mockDb, 'user-123');

      const mutated = await firestoreRepo.mutate((current) => ({
        ...current,
        allowedTags: [...current.allowedTags, 'firestore-tx-tag'],
      }));

      expect(firestoreModule.doc).toHaveBeenCalledWith(mockDb, 'users/user-123/taxonomy/current');
      expect(firestoreModule.runTransaction).toHaveBeenCalledWith(mockDb, expect.any(Function));
      expect(transactionContext.get).toHaveBeenCalled();
      expect(transactionContext.set).toHaveBeenCalled();
      expect(mutated.allowedTags).toContain('firestore-tx-tag');
    });
  });

  describe('Transaction Mutator Purity & Retry Safety', () => {
    it('mutators passed to repo.mutate are pure and retry-safe under simulated contention', async () => {
      let executionCount = 0;
      const baseRepo = repos.taxonomy;
      const retryingRepo: typeof baseRepo = {
        get: () => baseRepo.get(),
        save: (reg) => baseRepo.save(reg),
        mutate: async (mutator) => {
          return await baseRepo.mutate((current) => {
            // First 2 calls simulate transient Firestore retries on current snapshots
            executionCount++;
            mutator(JSON.parse(JSON.stringify(current)));
            executionCount++;
            mutator(JSON.parse(JSON.stringify(current)));
            // Final execution returns the committed registry
            executionCount++;
            return mutator(current);
          });
        },
      };

      const retryingService = new TaxonomyService(retryingRepo);

      // 1. addDomain retry safety
      executionCount = 0;
      const domain = await retryingService.addDomain({ name: 'Computational Physics' });
      expect(executionCount).toBe(3);
      expect(domain.id).toBe('computational-physics');
      expect(domain.name).toBe('Computational Physics');

      // 2. addTopic retry safety
      executionCount = 0;
      const topic = await retryingService.addTopic({ domainId: domain.id, name: 'Quantum Simulation' });
      expect(executionCount).toBe(3);
      expect(topic.id).toBe('quantum-simulation');
      expect(topic.domainId).toBe('computational-physics');

      // 3. addSubtopic retry safety
      executionCount = 0;
      const subtopic = await retryingService.addSubtopic({ topicId: topic.id, name: 'Lattice QCD' });
      expect(executionCount).toBe(3);
      expect(subtopic.id).toBe('lattice-qcd');
      expect(subtopic.topicId).toBe('quantum-simulation');

      // 4. renameTopic retry safety
      executionCount = 0;
      const renamed = await retryingService.renameTopic(topic.id, 'Quantum Many-Body Simulation');
      expect(executionCount).toBe(3);
      expect(renamed.id).toBe(topic.id);
      expect(renamed.name).toBe('Quantum Many-Body Simulation');

      // 5. addTag retry safety
      executionCount = 0;
      const tag = await retryingService.addTag('monte-carlo');
      expect(executionCount).toBe(3);
      expect(tag).toBe('monte-carlo');

      // Verify final persisted registry
      const finalReg = await retryingService.getRegistry();
      expect(finalReg.domains.some((d) => d.id === 'computational-physics')).toBe(true);
      expect(
        finalReg.topics.some(
          (t) => t.id === 'quantum-simulation' && t.name === 'Quantum Many-Body Simulation'
        )
      ).toBe(true);
      expect(finalReg.subtopics.some((s) => s.id === 'lattice-qcd')).toBe(true);
      expect(finalReg.allowedTags).toContain('monte-carlo');
    });
  });
});
