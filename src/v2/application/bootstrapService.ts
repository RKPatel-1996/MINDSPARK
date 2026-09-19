import type { Repositories } from './types';
import { DEFAULT_PARAMETER_SET } from '../domain/schedulerParameterSet';
import { CANONICAL_TAXONOMY_REGISTRY } from './canonicalTaxonomy';
import type { Settings } from '../persistence/repository/interfaces';

export const DEFAULT_SETTINGS: Readonly<Settings> = Object.freeze({
  schemaVersion: 1,
  desiredRetention: 0.90,
  activeParameterSetId: 'fsrs-6-default',
  newCardDailyLimit: 5,
  reserveHorizonHours: 24,
});

export async function bootstrapUserRepositories(repos: Repositories): Promise<{
  settingsCreated: boolean;
  parameterSetCreated: boolean;
  taxonomyCreated: boolean;
}> {
  let settingsCreated = false;
  let parameterSetCreated = false;
  let taxonomyCreated = false;

  // 1. Settings
  const existingSettings = await repos.settings.get();
  if (!existingSettings) {
    await repos.settings.save(DEFAULT_SETTINGS);
    settingsCreated = true;
  }

  // 2. Default Scheduler Parameter Set
  const existingParamSet = await repos.parameterSets.get(DEFAULT_PARAMETER_SET.id);
  if (!existingParamSet) {
    await repos.parameterSets.create(DEFAULT_PARAMETER_SET);
    parameterSetCreated = true;
  }

  // 3. Taxonomy Registry
  const existingTaxonomy = await repos.taxonomy.get();
  if (!existingTaxonomy) {
    await repos.taxonomy.save(CANONICAL_TAXONOMY_REGISTRY);
    taxonomyCreated = true;
  }

  return { settingsCreated, parameterSetCreated, taxonomyCreated };
}
