import { Timestamp } from 'firebase/firestore';
import { knowledgeItemSchema, type KnowledgeItem } from '../../../domain/knowledge';
import { reviewCardSchema, type ReviewCard } from '../../../domain/card';
import { reviewEventSchema, type ReviewEvent } from '../../../domain/event';
import { taxonomyRegistrySchema, type TaxonomyRegistry } from '../../../domain/taxonomy';
import { schedulerParameterSetSchema, type SchedulerParameterSet } from '../../../domain/schedulerParameterSet';
import { z } from 'zod';
import type { Settings } from '../../repository/interfaces';

// --- DTOs ---
// Remote DTOs use string representation or Timestamp for date fields

export const settingsSchema = z.object({
  schemaVersion: z.number().int(),
  desiredRetention: z.number().min(0.7).max(0.99),
  activeParameterSetId: z.string().min(1),
  newCardDailyLimit: z.number().int().nonnegative(),
  reserveHorizonHours: z.number().int().nonnegative(),
});

/**
 * Recursively sanitizes data for Cloud Firestore writes by omitting undefined properties
 * while preserving nulls, primitives, arrays, and Firestore-specific sentinel types
 * (Timestamp, FieldValue, etc.).
 */
export function sanitizeFirestoreDto<T>(input: T): T {
  if (input === null || input === undefined) {
    return input;
  }
  if (typeof input !== 'object') {
    return input;
  }
  // Preserve special Firestore objects (Timestamp, Date, FieldValue transforms)
  if (input instanceof Timestamp || input instanceof Date) {
    return input;
  }
  const constructorName = input.constructor?.name;
  if (
    constructorName === 'FieldValue' ||
    constructorName === 'ServerTimestampTransform' ||
    '_methodName' in (input as any)
  ) {
    return input;
  }
  if (Array.isArray(input)) {
    return input
      .map((item) => sanitizeFirestoreDto(item))
      .filter((item) => item !== undefined) as unknown as T;
  }

  // Plain object: omit undefined values, keep nulls, recursively sanitize nested objects
  const sanitized: Record<string, any> = {};
  for (const [key, val] of Object.entries(input)) {
    if (val === undefined) {
      continue;
    }
    const cleanVal = sanitizeFirestoreDto(val);
    if (cleanVal !== undefined) {
      sanitized[key] = cleanVal;
    }
  }
  return sanitized as T;
}

// --- Mappers ---

export function mapKnowledgeItemToDTO(item: KnowledgeItem): any {
  return sanitizeFirestoreDto({ ...item });
}

export function mapDTOToKnowledgeItem(data: any): KnowledgeItem {
  return knowledgeItemSchema.parse(data);
}

export function mapReviewCardToDTO(card: ReviewCard): any {
  return sanitizeFirestoreDto({ ...card });
}

export function mapDTOToReviewCard(data: any): ReviewCard {
  return reviewCardSchema.parse(data);
}

export function mapReviewEventToDTO(event: ReviewEvent): any {
  const dto = {
    ...event,
    reviewTimestamp: Timestamp.fromDate(new Date(event.reviewTimestamp)),
    // Note: serverReceivedAt is added at the repository level using serverTimestamp()
  };
  return sanitizeFirestoreDto(dto);
}

export function mapDTOToReviewEvent(data: any): ReviewEvent {
  const parsedData = {
    ...data,
    reviewTimestamp: data.reviewTimestamp instanceof Timestamp
      ? data.reviewTimestamp.toDate().toISOString()
      : data.reviewTimestamp,
  };
  return reviewEventSchema.parse(parsedData);
}

export function mapTaxonomyToDTO(taxonomy: TaxonomyRegistry): any {
  return sanitizeFirestoreDto({ ...taxonomy });
}

export function mapDTOToTaxonomy(data: any): TaxonomyRegistry {
  return taxonomyRegistrySchema.parse(data);
}

export function mapSchedulerParameterSetToDTO(paramSet: SchedulerParameterSet): any {
  return sanitizeFirestoreDto({ ...paramSet });
}

export function mapDTOToSchedulerParameterSet(data: any): SchedulerParameterSet {
  return schedulerParameterSetSchema.parse(data);
}

export function mapSettingsToDTO(settings: Settings): any {
  return sanitizeFirestoreDto({ ...settings });
}

export function mapDTOToSettings(data: any): Settings {
  return settingsSchema.parse(data);
}
