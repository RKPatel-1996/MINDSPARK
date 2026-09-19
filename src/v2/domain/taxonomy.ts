import { z } from 'zod';

/**
 * Controlled Taxonomy Representation
 * Domain -> Topic -> (Optional) Subtopic
 * 
 * Taxonomy nodes have stable IDs and display names.
 * Free-form AI categories must never become canonical automatically.
 * Taxonomy organizes knowledge but must NEVER determine memory scheduling.
 */

export const taxonomyDomainSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
});
export type TaxonomyDomain = z.infer<typeof taxonomyDomainSchema>;

export const taxonomyTopicSchema = z.object({
  id: z.string().min(1),
  domainId: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
});
export type TaxonomyTopic = z.infer<typeof taxonomyTopicSchema>;

export const taxonomySubtopicSchema = z.object({
  id: z.string().min(1),
  topicId: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
});
export type TaxonomySubtopic = z.infer<typeof taxonomySubtopicSchema>;

export const taxonomyReferenceSchema = z.object({
  domainId: z.string().min(1),
  topicId: z.string().min(1),
  subtopicId: z.string().min(1).optional(),
});
export type TaxonomyReference = z.infer<typeof taxonomyReferenceSchema>;

export const controlledTagSchema = z.string().min(1).regex(/^[a-z0-9-_]+$/, {
  message: 'Tags must be lowercase alphanumeric with hyphens or underscores',
});
export type ControlledTag = z.infer<typeof controlledTagSchema>;

export const taxonomyRegistrySchema = z.object({
  domains: z.array(taxonomyDomainSchema),
  topics: z.array(taxonomyTopicSchema),
  subtopics: z.array(taxonomySubtopicSchema),
  allowedTags: z.array(controlledTagSchema),
});
export type TaxonomyRegistry = z.infer<typeof taxonomyRegistrySchema>;

export interface TaxonomyValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Pure validation of a taxonomy reference and optional tags against a supplied registry.
 */
export function validateTaxonomy(
  taxonomy: TaxonomyReference,
  tags: string[] | undefined,
  registry: TaxonomyRegistry
): TaxonomyValidationResult {
  // 1. Verify domain exists
  const domain = registry.domains.find((d) => d.id === taxonomy.domainId);
  if (!domain) {
    return { valid: false, error: `Unknown domain ID: "${taxonomy.domainId}"` };
  }

  // 2. Verify topic exists
  const topic = registry.topics.find((t) => t.id === taxonomy.topicId);
  if (!topic) {
    return { valid: false, error: `Unknown topic ID: "${taxonomy.topicId}"` };
  }

  // 3. Verify topic belongs to domain
  if (topic.domainId !== taxonomy.domainId) {
    return {
      valid: false,
      error: `Topic "${taxonomy.topicId}" belongs to domain "${topic.domainId}", not "${taxonomy.domainId}"`,
    };
  }

  // 4. Verify subtopic if present
  if (taxonomy.subtopicId) {
    const subtopic = registry.subtopics.find((s) => s.id === taxonomy.subtopicId);
    if (!subtopic) {
      return { valid: false, error: `Unknown subtopic ID: "${taxonomy.subtopicId}"` };
    }
    if (subtopic.topicId !== taxonomy.topicId) {
      return {
        valid: false,
        error: `Subtopic "${taxonomy.subtopicId}" belongs to topic "${subtopic.topicId}", not "${taxonomy.topicId}"`,
      };
    }
  }

  // 5. Verify tags
  if (tags && tags.length > 0) {
    const allowedTagSet = new Set(registry.allowedTags);
    for (const tag of tags) {
      if (!allowedTagSet.has(tag)) {
        return { valid: false, error: `Disallowed or unknown tag: "${tag}"` };
      }
    }
  }

  return { valid: true };
}
