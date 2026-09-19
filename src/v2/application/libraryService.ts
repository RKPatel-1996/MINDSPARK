import type { Repositories, KnowledgeItemWithCards } from './types';
import type { KnowledgeItem, KnowledgeStatus } from '../domain/knowledge';
import type { ReviewCard } from '../domain/card';
import type { CardState } from '../domain/cardState';
import { knowledgeItemSchema } from '../domain/knowledge';
import {
  validateLifecycleTransition,
  type LifecycleTransitionResult,
} from '../domain/lifecycle';
import { reconcileCardHistory } from '../reconciliation';
import { validateTaxonomy } from '../domain/taxonomy';
import { CANONICAL_TAXONOMY_REGISTRY } from './canonicalTaxonomy';

export class LibraryService {
  constructor(private repos: Repositories) {}

  async listKnowledgeItems(): Promise<KnowledgeItemWithCards[]> {
    const [items, cards] = await Promise.all([
      this.repos.knowledge.list(),
      this.repos.reviewCards.list(),
    ]);

    const cardsByItem = new Map<string, ReviewCard[]>();
    for (const card of cards) {
      const list = cardsByItem.get(card.knowledgeItemId) ?? [];
      list.push(card);
      cardsByItem.set(card.knowledgeItemId, list);
    }

    const paramSetsList = await this.repos.parameterSets.list();
    const paramSetsDict = Object.fromEntries(paramSetsList.map((p) => [p.id, p]));

    const result: KnowledgeItemWithCards[] = [];

    for (const item of items) {
      const itemCards = cardsByItem.get(item.id) ?? [];
      const cardStates: Record<string, CardState> = {};
      const reconciliationErrors: Record<string, string> = {};

      for (const card of itemCards) {
        const events = await this.repos.reviewEvents.listForCard(card.id);
        const reconciliation = reconcileCardHistory(card, events, paramSetsDict);
        if (reconciliation.ok) {
          cardStates[card.id] = reconciliation.state;
        } else {
          reconciliationErrors[card.id] = reconciliation.message;
        }
      }

      result.push({
        item,
        cards: itemCards,
        cardStates,
        reconciliationErrors: Object.keys(reconciliationErrors).length > 0 ? reconciliationErrors : undefined,
      });
    }

    return result;
  }

  async getKnowledgeItem(id: string): Promise<KnowledgeItemWithCards | null> {
    const item = await this.repos.knowledge.get(id);
    if (!item) return null;

    const cards = await this.repos.reviewCards.listForKnowledgeItem(id);
    const paramSetsList = await this.repos.parameterSets.list();
    const paramSetsDict = Object.fromEntries(paramSetsList.map((p) => [p.id, p]));

    const cardStates: Record<string, CardState> = {};
    const reconciliationErrors: Record<string, string> = {};
    for (const card of cards) {
      const events = await this.repos.reviewEvents.listForCard(card.id);
      const reconciliation = reconcileCardHistory(card, events, paramSetsDict);
      if (reconciliation.ok) {
        cardStates[card.id] = reconciliation.state;
      } else {
        reconciliationErrors[card.id] = reconciliation.message;
      }
    }

    return {
      item,
      cards,
      cardStates,
      reconciliationErrors: Object.keys(reconciliationErrors).length > 0 ? reconciliationErrors : undefined,
    };
  }

  /**
   * Updates a knowledge item while strictly validating against the domain schema and TaxonomyRegistry.
   * Preserves knowledge item ID and status (reactivation/deactivation remains explicit; editing a
   * needs_review item does not clear needs_review).
   */
  async updateKnowledgeItem(item: KnowledgeItem): Promise<KnowledgeItem> {
    const existing = await this.repos.knowledge.get(item.id);
    if (!existing) {
      throw new Error(`KnowledgeItem ${item.id} not found`);
    }

    // Validate taxonomy and tags against current TaxonomyRegistry
    const registry = (await this.repos.taxonomy.get()) ?? CANONICAL_TAXONOMY_REGISTRY;
    const taxValidation = validateTaxonomy(item.taxonomy, item.tags, registry);
    if (!taxValidation.valid) {
      throw new Error(`Taxonomy validation failed: ${taxValidation.error}`);
    }

    // Preserve ID, schemaVersion, createdAt, and status
    const candidate: KnowledgeItem = {
      ...item,
      id: existing.id,
      schemaVersion: 1,
      status: existing.status, // Text edits do NOT automatically clear needs_review
      createdAt: existing.createdAt,
      updatedAt: new Date().toISOString(),
    };

    const validated = knowledgeItemSchema.parse(candidate);
    await this.repos.knowledge.update(validated);
    return validated;
  }

  /**
   * Authoritative typed KnowledgeItem lifecycle transition.
   * Enforces exact allowed transitions (active <-> needs_review, active -> archived,
   * needs_review -> archived, archived -> active).
   * Rejects invalid transitions with a typed failure.
   * Updates only lifecycle metadata (status, updatedAt), strictly preserving
   * review cards, review events, card states, FSRS data, taxonomy, and content.
   */
  async transitionKnowledgeItemStatus(
    itemId: string,
    targetStatus: KnowledgeStatus
  ): Promise<LifecycleTransitionResult> {
    const existing = await this.repos.knowledge.get(itemId);
    if (!existing) {
      return {
        success: false,
        error: {
          type: 'item_not_found',
          itemId,
          message: `KnowledgeItem "${itemId}" was not found.`,
        },
      };
    }

    const validation = validateLifecycleTransition(existing.status, targetStatus);
    if ('error' in validation) {
      return {
        success: false,
        error: validation.error,
      };
    }

    const now = new Date().toISOString();
    try {
      if (this.repos.knowledge.updateStatus) {
        await this.repos.knowledge.updateStatus(itemId, targetStatus, now);
      } else {
        await this.repos.knowledge.update({
          ...existing,
          status: targetStatus,
          updatedAt: now,
        });
      }

      const updatedItem: KnowledgeItem = {
        ...existing,
        status: targetStatus,
        updatedAt: now,
      };

      return {
        success: true,
        item: updatedItem,
        action: validation.action,
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      return {
        success: false,
        error: {
          type: 'persistence_failure',
          message,
        },
      };
    }
  }

  async toggleNeedsAttention(id: string): Promise<KnowledgeItem | null> {
    const item = await this.repos.knowledge.get(id);
    if (!item) return null;

    const nextStatus = item.status === 'needs_review' ? 'active' : 'needs_review';
    const res = await this.transitionKnowledgeItemStatus(id, nextStatus);
    if ('item' in res) {
      return res.item;
    }
    throw new Error(res.error.message);
  }

  async archiveKnowledgeItem(id: string): Promise<void> {
    const res = await this.transitionKnowledgeItemStatus(id, 'archived');
    if ('error' in res) {
      throw new Error(res.error.message);
    }
  }

  async updateReviewCard(card: ReviewCard): Promise<void> {
    await this.repos.reviewCards.update({
      ...card,
      updatedAt: new Date().toISOString(),
    });
  }
}
