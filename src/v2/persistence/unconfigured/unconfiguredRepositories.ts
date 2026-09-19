import type { Repositories } from '../../application/types';
import type {
  KnowledgeRepository,
  ReviewCardRepository,
  ReviewEventRepository,
  TaxonomyRepository,
  SchedulerParameterSetRepository,
  SettingsRepository,
} from '../repository/interfaces';

export const CONFIG_REQUIRED_MSG =
  'Configuration required: Firebase Firestore credentials are not configured. Cloud persistence is unavailable and ephemeral mutations are disabled.';

/**
 * Creates repositories for an unconfigured environment when ephemeral developer mode is not active.
 * Query methods return empty/null results.
 * Mutation methods throw an explicit Configuration required error, preventing
 * silent ephemeral mutations into disposable memory that would vanish on refresh.
 */
export function createUnconfiguredRepositories(): Repositories {
  const knowledge: KnowledgeRepository = {
    get: async () => null,
    list: async () => [],
    create: async () => {
      throw new Error(CONFIG_REQUIRED_MSG);
    },
    createBundle: async () => {
      throw new Error(CONFIG_REQUIRED_MSG);
    },
    createKnowledgeBundle: async () => {
      throw new Error(CONFIG_REQUIRED_MSG);
    },
    update: async () => {
      throw new Error(CONFIG_REQUIRED_MSG);
    },
    archive: async () => {
      throw new Error(CONFIG_REQUIRED_MSG);
    },
    updateStatus: async () => {
      throw new Error(CONFIG_REQUIRED_MSG);
    },
  };

  const reviewCards: ReviewCardRepository = {
    get: async () => null,
    list: async () => [],
    listForKnowledgeItem: async () => [],
    create: async () => {
      throw new Error(CONFIG_REQUIRED_MSG);
    },
    update: async () => {
      throw new Error(CONFIG_REQUIRED_MSG);
    },
  };

  const reviewEvents: ReviewEventRepository = {
    append: async () => {
      throw new Error(CONFIG_REQUIRED_MSG);
    },
    get: async () => null,
    listForCard: async () => [],
    observeForCard: () => () => {},
    observeSyncState: (callback) => {
      callback({ state: 'synced', hasPendingWrites: false, fromCache: false });
      return () => {};
    },
    getSyncMetadata: () => ({ state: 'synced', hasPendingWrites: false, fromCache: false }),
    listReceivedAfter: async () => ({ events: [], nextWatermark: null }),
  };

  const taxonomy: TaxonomyRepository = {
    get: async () => null,
    save: async () => {
      throw new Error(CONFIG_REQUIRED_MSG);
    },
    mutate: async () => {
      throw new Error(CONFIG_REQUIRED_MSG);
    },
  };

  const parameterSets: SchedulerParameterSetRepository = {
    get: async () => null,
    list: async () => [],
    create: async () => {
      throw new Error(CONFIG_REQUIRED_MSG);
    },
  };

  const settings: SettingsRepository = {
    get: async () => null,
    save: async () => {
      throw new Error(CONFIG_REQUIRED_MSG);
    },
  };

  return {
    knowledge,
    reviewCards,
    reviewEvents,
    taxonomy,
    parameterSets,
    settings,
  };
}
