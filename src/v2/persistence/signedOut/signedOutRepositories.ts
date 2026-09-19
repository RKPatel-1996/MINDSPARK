import type { Repositories } from '../../application/types';
import type {
  KnowledgeRepository,
  ReviewCardRepository,
  ReviewEventRepository,
  TaxonomyRepository,
  SchedulerParameterSetRepository,
  SettingsRepository,
} from '../repository/interfaces';
import { BulkLifecycleError } from '../../domain/lifecycle';

const AUTH_REQUIRED_MSG = 'Authentication required: Sign in to perform mutations in your cloud library.';

/**
 * Creates repositories for a signed-out user when Firebase is configured.
 * Query methods return empty/null results.
 * Mutation methods throw an explicit Authentication required error, preventing
 * silent ephemeral mutations into disposable memory that would vanish on refresh.
 */
export function createSignedOutRepositories(): Repositories {
  const knowledge: KnowledgeRepository = {
    get: async () => null,
    list: async () => [],
    create: async () => {
      throw new Error(AUTH_REQUIRED_MSG);
    },
    createBundle: async () => {
      throw new Error(AUTH_REQUIRED_MSG);
    },
    createKnowledgeBundle: async () => {
      throw new Error(AUTH_REQUIRED_MSG);
    },
    update: async () => {
      throw new Error(AUTH_REQUIRED_MSG);
    },
    archive: async () => {
      throw new Error(AUTH_REQUIRED_MSG);
    },
    updateStatus: async () => {
      throw new Error(AUTH_REQUIRED_MSG);
    },
    bulkUpdateStatusAtomic: async () => {
      throw new BulkLifecycleError('authentication_required', AUTH_REQUIRED_MSG);
    },
  };

  const reviewCards: ReviewCardRepository = {
    get: async () => null,
    list: async () => [],
    listForKnowledgeItem: async () => [],
    create: async () => {
      throw new Error(AUTH_REQUIRED_MSG);
    },
    update: async () => {
      throw new Error(AUTH_REQUIRED_MSG);
    },
  };

  const reviewEvents: ReviewEventRepository = {
    append: async () => {
      throw new Error(AUTH_REQUIRED_MSG);
    },
    get: async () => null,
    listForCard: async () => [],
    observeForCard: () => () => {},
    listReceivedAfter: async () => ({ events: [], nextWatermark: null }),
  };

  const taxonomy: TaxonomyRepository = {
    get: async () => null,
    save: async () => {
      throw new Error(AUTH_REQUIRED_MSG);
    },
    mutate: async () => {
      throw new Error(AUTH_REQUIRED_MSG);
    },
  };

  const parameterSets: SchedulerParameterSetRepository = {
    get: async () => null,
    list: async () => [],
    create: async () => {
      throw new Error(AUTH_REQUIRED_MSG);
    },
  };

  const settings: SettingsRepository = {
    get: async () => null,
    save: async () => {
      throw new Error(AUTH_REQUIRED_MSG);
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
