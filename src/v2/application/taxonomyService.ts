import type {
  TaxonomyDomain,
  TaxonomyTopic,
  TaxonomySubtopic,
  TaxonomyRegistry,
} from '../domain/taxonomy';
import { controlledTagSchema } from '../domain/taxonomy';
import type { TaxonomyRepository } from '../persistence/repository/interfaces';
import type { Repositories } from './types';

/**
 * Canonical helper for slugifying human-facing taxonomy names into stable IDs.
 * Rules:
 * - trim
 * - lowercase
 * - spaces/punctuation -> "-"
 * - collapse repeated "-"
 * - remove leading/trailing "-"
 *
 * Example: "Molecular Biology" -> "molecular-biology"
 */
export function slugifyTaxonomyName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Normalizes display names for case-insensitive duplicate comparison.
 * Rules:
 * - trim
 * - lowercase
 */
export function normalizeDisplayName(name: string): string {
  return name.trim().toLowerCase();
}

export type TaxonomyErrorCode =
  | 'duplicate_name'
  | 'duplicate_tag'
  | 'parent_not_found'
  | 'node_not_found'
  | 'invalid_input';

export class TaxonomyError extends Error {
  readonly code: TaxonomyErrorCode;

  constructor(code: TaxonomyErrorCode, message: string) {
    super(message);
    this.name = 'TaxonomyError';
    this.code = code;
    Object.setPrototypeOf(this, TaxonomyError.prototype);
  }
}

export class DuplicateTaxonomyError extends TaxonomyError {
  readonly scope: 'domain' | 'topic' | 'subtopic' | 'tag';
  readonly nameValue: string;
  readonly parentId?: string;

  constructor(scope: 'domain' | 'topic' | 'subtopic' | 'tag', nameValue: string, parentId?: string) {
    super(
      scope === 'tag' ? 'duplicate_tag' : 'duplicate_name',
      scope === 'tag'
        ? `Tag "${nameValue}" already exists in the registry.`
        : parentId
        ? `A ${scope} named "${nameValue}" already exists under parent "${parentId}".`
        : `A ${scope} named "${nameValue}" already exists.`
    );
    this.name = 'DuplicateTaxonomyError';
    this.scope = scope;
    this.nameValue = nameValue;
    this.parentId = parentId;
    Object.setPrototypeOf(this, DuplicateTaxonomyError.prototype);
  }
}

export class TaxonomyParentNotFoundError extends TaxonomyError {
  readonly parentType: 'domain' | 'topic';
  readonly parentId: string;

  constructor(parentType: 'domain' | 'topic', parentId: string) {
    super('parent_not_found', `${parentType === 'domain' ? 'Domain' : 'Topic'} "${parentId}" does not exist.`);
    this.name = 'TaxonomyParentNotFoundError';
    this.parentType = parentType;
    this.parentId = parentId;
    Object.setPrototypeOf(this, TaxonomyParentNotFoundError.prototype);
  }
}

export class TaxonomyNodeNotFoundError extends TaxonomyError {
  readonly nodeType: 'domain' | 'topic' | 'subtopic';
  readonly id: string;

  constructor(nodeType: 'domain' | 'topic' | 'subtopic', id: string) {
    super('node_not_found', `${nodeType.charAt(0).toUpperCase() + nodeType.slice(1)} "${id}" does not exist.`);
    this.name = 'TaxonomyNodeNotFoundError';
    this.nodeType = nodeType;
    this.id = id;
    Object.setPrototypeOf(this, TaxonomyNodeNotFoundError.prototype);
  }
}

export function isTaxonomyError(err: unknown): err is TaxonomyError {
  return err instanceof TaxonomyError;
}

export function isDuplicateTaxonomyError(err: unknown): err is DuplicateTaxonomyError {
  return err instanceof DuplicateTaxonomyError;
}

export function isTaxonomyParentNotFoundError(err: unknown): err is TaxonomyParentNotFoundError {
  return err instanceof TaxonomyParentNotFoundError;
}

export function isTaxonomyNodeNotFoundError(err: unknown): err is TaxonomyNodeNotFoundError {
  return err instanceof TaxonomyNodeNotFoundError;
}

export class TaxonomyService {
  private taxonomyRepo: TaxonomyRepository;

  constructor(repoOrRepos: TaxonomyRepository | Repositories | { taxonomy: TaxonomyRepository }) {
    if ('taxonomy' in repoOrRepos) {
      this.taxonomyRepo = repoOrRepos.taxonomy;
    } else {
      this.taxonomyRepo = repoOrRepos;
    }
  }

  async getRegistry(): Promise<TaxonomyRegistry> {
    const reg = await this.taxonomyRepo.get();
    if (!reg) {
      throw new Error('Taxonomy registry does not exist. Initial bootstrap is required.');
    }
    return reg;
  }

  async addDomain(input: { name: string; description?: string }): Promise<TaxonomyDomain> {
    const rawName = input.name?.trim();
    if (!rawName) {
      throw new TaxonomyError('invalid_input', 'Domain name cannot be empty.');
    }
    const baseSlug = slugifyTaxonomyName(rawName);
    if (!baseSlug) {
      throw new TaxonomyError('invalid_input', 'Domain name must contain alphanumeric characters.');
    }

    const persisted = await this.taxonomyRepo.mutate((current) => {
      // 1. Sibling duplicate check (for domains, scope is across all domains)
      const isDuplicate = current.domains.some(
        (d) => normalizeDisplayName(d.name) === normalizeDisplayName(rawName)
      );
      if (isDuplicate) {
        throw new DuplicateTaxonomyError('domain', rawName);
      }

      // 2. Deterministic ID allocation (suffix if base slug collides with a different domain)
      const existingIds = new Set(current.domains.map((d) => d.id));
      let candidateId = baseSlug;
      let counter = 2;
      while (existingIds.has(candidateId)) {
        candidateId = `${baseSlug}-${counter++}`;
      }

      const newNode: TaxonomyDomain = {
        id: candidateId,
        name: rawName,
        ...(input.description?.trim() ? { description: input.description.trim() } : {}),
      };

      return {
        ...current,
        domains: [...current.domains, newNode],
      };
    });

    const created = persisted.domains.find(
      (d) => normalizeDisplayName(d.name) === normalizeDisplayName(rawName)
    );
    if (!created) {
      throw new Error('Internal error: created domain not found in persisted registry.');
    }
    return created;
  }

  async addTopic(input: { domainId: string; name: string; description?: string }): Promise<TaxonomyTopic> {
    const domainId = input.domainId?.trim();
    const rawName = input.name?.trim();
    if (!domainId) {
      throw new TaxonomyError('invalid_input', 'Domain ID is required.');
    }
    if (!rawName) {
      throw new TaxonomyError('invalid_input', 'Topic name cannot be empty.');
    }
    const baseSlug = slugifyTaxonomyName(rawName);
    if (!baseSlug) {
      throw new TaxonomyError('invalid_input', 'Topic name must contain alphanumeric characters.');
    }

    const persisted = await this.taxonomyRepo.mutate((current) => {
      // 1. Parent existence check
      const parentDomain = current.domains.find((d) => d.id === domainId);
      if (!parentDomain) {
        throw new TaxonomyParentNotFoundError('domain', domainId);
      }

      // 2. Sibling duplicate check (among topics under the same domain)
      const isSiblingDuplicate = current.topics.some(
        (t) => t.domainId === domainId && normalizeDisplayName(t.name) === normalizeDisplayName(rawName)
      );
      if (isSiblingDuplicate) {
        throw new DuplicateTaxonomyError('topic', rawName, domainId);
      }

      // 3. Deterministic ID allocation (unique across all topics in registry)
      const existingIds = new Set(current.topics.map((t) => t.id));
      let candidateId = baseSlug;
      let counter = 2;
      while (existingIds.has(candidateId)) {
        candidateId = `${baseSlug}-${counter++}`;
      }

      const newNode: TaxonomyTopic = {
        id: candidateId,
        domainId,
        name: rawName,
        ...(input.description?.trim() ? { description: input.description.trim() } : {}),
      };

      return {
        ...current,
        topics: [...current.topics, newNode],
      };
    });

    const created = persisted.topics.find(
      (t) => t.domainId === domainId && normalizeDisplayName(t.name) === normalizeDisplayName(rawName)
    );
    if (!created) {
      throw new Error('Internal error: created topic not found in persisted registry.');
    }
    return created;
  }

  async addSubtopic(input: { topicId: string; name: string; description?: string }): Promise<TaxonomySubtopic> {
    const topicId = input.topicId?.trim();
    const rawName = input.name?.trim();
    if (!topicId) {
      throw new TaxonomyError('invalid_input', 'Topic ID is required.');
    }
    if (!rawName) {
      throw new TaxonomyError('invalid_input', 'Subtopic name cannot be empty.');
    }
    const baseSlug = slugifyTaxonomyName(rawName);
    if (!baseSlug) {
      throw new TaxonomyError('invalid_input', 'Subtopic name must contain alphanumeric characters.');
    }

    const persisted = await this.taxonomyRepo.mutate((current) => {
      // 1. Parent existence check
      const parentTopic = current.topics.find((t) => t.id === topicId);
      if (!parentTopic) {
        throw new TaxonomyParentNotFoundError('topic', topicId);
      }

      // 2. Sibling duplicate check (among subtopics under the same topic)
      const isSiblingDuplicate = current.subtopics.some(
        (s) => s.topicId === topicId && normalizeDisplayName(s.name) === normalizeDisplayName(rawName)
      );
      if (isSiblingDuplicate) {
        throw new DuplicateTaxonomyError('subtopic', rawName, topicId);
      }

      // 3. Deterministic ID allocation (unique across all subtopics in registry)
      const existingIds = new Set(current.subtopics.map((s) => s.id));
      let candidateId = baseSlug;
      let counter = 2;
      while (existingIds.has(candidateId)) {
        candidateId = `${baseSlug}-${counter++}`;
      }

      const newNode: TaxonomySubtopic = {
        id: candidateId,
        topicId,
        name: rawName,
        ...(input.description?.trim() ? { description: input.description.trim() } : {}),
      };

      return {
        ...current,
        subtopics: [...current.subtopics, newNode],
      };
    });

    const created = persisted.subtopics.find(
      (s) => s.topicId === topicId && normalizeDisplayName(s.name) === normalizeDisplayName(rawName)
    );
    if (!created) {
      throw new Error('Internal error: created subtopic not found in persisted registry.');
    }
    return created;
  }

  async addTag(tag: string): Promise<string> {
    const rawTag = tag?.trim();
    if (!rawTag) {
      throw new TaxonomyError('invalid_input', 'Tag cannot be empty.');
    }
    const normalizedTag = slugifyTaxonomyName(rawTag);
    const parseResult = controlledTagSchema.safeParse(normalizedTag);
    if (!parseResult.success) {
      throw new TaxonomyError('invalid_input', 'Tag must be lowercase alphanumeric with hyphens or underscores.');
    }

    const persisted = await this.taxonomyRepo.mutate((current) => {
      // Duplicate check globally in allowedTags
      if (current.allowedTags.includes(normalizedTag)) {
        throw new DuplicateTaxonomyError('tag', normalizedTag);
      }

      return {
        ...current,
        allowedTags: [...current.allowedTags, normalizedTag],
      };
    });

    const found = persisted.allowedTags.find((t) => t === normalizedTag);
    if (!found) {
      throw new Error('Internal error: added tag not found in persisted registry.');
    }
    return found;
  }

  async renameDomain(id: string, newName: string, newDescription?: string): Promise<TaxonomyDomain> {
    const rawName = newName?.trim();
    if (!rawName) {
      throw new TaxonomyError('invalid_input', 'Domain name cannot be empty.');
    }

    const persisted = await this.taxonomyRepo.mutate((current) => {
      const index = current.domains.findIndex((d) => d.id === id);
      if (index === -1) {
        throw new TaxonomyNodeNotFoundError('domain', id);
      }

      // Sibling collision check across domains excluding itself
      const collision = current.domains.some(
        (d) => d.id !== id && normalizeDisplayName(d.name) === normalizeDisplayName(rawName)
      );
      if (collision) {
        throw new DuplicateTaxonomyError('domain', rawName);
      }

      const existing = current.domains[index];
      const updatedNode: TaxonomyDomain = {
        ...existing,
        name: rawName,
        description:
          newDescription !== undefined ? (newDescription.trim() || undefined) : existing.description,
      };

      const domains = [...current.domains];
      domains[index] = updatedNode;

      return {
        ...current,
        domains,
      };
    });

    const updated = persisted.domains.find((d) => d.id === id);
    if (!updated) {
      throw new Error('Internal error: renamed domain not found in persisted registry.');
    }
    return updated;
  }

  async renameTopic(id: string, newName: string, newDescription?: string): Promise<TaxonomyTopic> {
    const rawName = newName?.trim();
    if (!rawName) {
      throw new TaxonomyError('invalid_input', 'Topic name cannot be empty.');
    }

    const persisted = await this.taxonomyRepo.mutate((current) => {
      const index = current.topics.findIndex((t) => t.id === id);
      if (index === -1) {
        throw new TaxonomyNodeNotFoundError('topic', id);
      }

      const existing = current.topics[index];
      // Sibling collision check among topics under the same domain excluding itself
      const collision = current.topics.some(
        (t) =>
          t.domainId === existing.domainId &&
          t.id !== id &&
          normalizeDisplayName(t.name) === normalizeDisplayName(rawName)
      );
      if (collision) {
        throw new DuplicateTaxonomyError('topic', rawName, existing.domainId);
      }

      const updatedNode: TaxonomyTopic = {
        ...existing,
        name: rawName,
        description:
          newDescription !== undefined ? (newDescription.trim() || undefined) : existing.description,
      };

      const topics = [...current.topics];
      topics[index] = updatedNode;

      return {
        ...current,
        topics,
      };
    });

    const updated = persisted.topics.find((t) => t.id === id);
    if (!updated) {
      throw new Error('Internal error: renamed topic not found in persisted registry.');
    }
    return updated;
  }

  async renameSubtopic(id: string, newName: string, newDescription?: string): Promise<TaxonomySubtopic> {
    const rawName = newName?.trim();
    if (!rawName) {
      throw new TaxonomyError('invalid_input', 'Subtopic name cannot be empty.');
    }

    const persisted = await this.taxonomyRepo.mutate((current) => {
      const index = current.subtopics.findIndex((s) => s.id === id);
      if (index === -1) {
        throw new TaxonomyNodeNotFoundError('subtopic', id);
      }

      const existing = current.subtopics[index];
      // Sibling collision check among subtopics under the same topic excluding itself
      const collision = current.subtopics.some(
        (s) =>
          s.topicId === existing.topicId &&
          s.id !== id &&
          normalizeDisplayName(s.name) === normalizeDisplayName(rawName)
      );
      if (collision) {
        throw new DuplicateTaxonomyError('subtopic', rawName, existing.topicId);
      }

      const updatedNode: TaxonomySubtopic = {
        ...existing,
        name: rawName,
        description:
          newDescription !== undefined ? (newDescription.trim() || undefined) : existing.description,
      };

      const subtopics = [...current.subtopics];
      subtopics[index] = updatedNode;

      return {
        ...current,
        subtopics,
      };
    });

    const updated = persisted.subtopics.find((s) => s.id === id);
    if (!updated) {
      throw new Error('Internal error: renamed subtopic not found in persisted registry.');
    }
    return updated;
  }
}
