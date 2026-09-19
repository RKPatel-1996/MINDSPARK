import { z } from 'zod';
import type { Repositories } from './types';
import type { Settings } from '../persistence/repository/interfaces';
import type { TaxonomyRegistry } from '../domain/taxonomy';
import { opaqueIdSchema } from '../domain/id';
import { DEFAULT_SETTINGS } from './bootstrapService';
import { CANONICAL_TAXONOMY_REGISTRY } from './canonicalTaxonomy';

export const settingsSchema = z.object({
  schemaVersion: z.literal(1),
  desiredRetention: z
    .number()
    .min(0.7, 'Desired retention must be at least 0.70')
    .max(0.97, 'Desired retention cannot exceed 0.97'),
  activeParameterSetId: z.string().min(1, 'Active parameter set ID cannot be empty'),
  newCardDailyLimit: z
    .number()
    .int('Daily new card limit must be an integer')
    .min(0, 'Daily new card limit cannot be negative')
    .max(100, 'Daily new card limit capped at 100'),
  reserveHorizonHours: z
    .number()
    .min(1, 'Reserve horizon must be at least 1 hour')
    .max(168, 'Reserve horizon cannot exceed 168 hours (7 days)'),
});

export class SettingsService {
  constructor(private repos: Repositories) {}

  async getSettings(): Promise<Settings> {
    const current = await this.repos.settings.get();
    return current ?? DEFAULT_SETTINGS;
  }

  async updateSettings(partial: Partial<Settings>): Promise<Settings> {
    const current = await this.getSettings();
    const candidate: Settings = {
      ...current,
      ...partial,
      schemaVersion: 1,
    };

    // 1. Zod structural & bounds validation
    const validated = settingsSchema.parse(candidate);

    // 2. Validate that activeParameterSetId exists in repository
    const parameterSet = await this.repos.parameterSets.get(validated.activeParameterSetId);
    if (!parameterSet) {
      throw new Error(
        `Configuration corruption: Active scheduler parameter set "${validated.activeParameterSetId}" was not found in the repository.`
      );
    }

    await this.repos.settings.save(validated);
    return validated;
  }

  async getTaxonomy(): Promise<TaxonomyRegistry> {
    const current = await this.repos.taxonomy.get();
    return current ?? CANONICAL_TAXONOMY_REGISTRY;
  }

  async saveTaxonomy(registry: TaxonomyRegistry): Promise<void> {
    await this.repos.taxonomy.save(registry);
  }
}
