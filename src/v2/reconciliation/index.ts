import { reviewCardSchema, type ReviewCard } from '../domain/card';
import { type CardState } from '../domain/cardState';
import { reviewEventSchema, type ReviewEvent } from '../domain/event';
import { schedulerParameterSetSchema, type SchedulerParameterSet } from '../domain/schedulerParameterSet';
import { scheduleReview, createInitialCardState } from '../engine/fsrsAdapter';

export interface ReconciliationDiagnostics {
  eventsProcessed: number;
  eventsIgnored: number;
  eventsDeduplicated: number;
}

export type ReconciliationError =
  | 'invalid_card'
  | 'invalid_event'
  | 'foreign_event'
  | 'conflicting_duplicate_event'
  | 'missing_parameter_set'
  | 'parameter_set_mismatch'
  | 'unsupported_scheduler';

export type ReconciliationResult =
  | {
      ok: true;
      state: CardState;
      diagnostics: ReconciliationDiagnostics;
      message?: string;
    }
  | {
      ok: false;
      error: ReconciliationError;
      diagnostics: ReconciliationDiagnostics;
      message: string;
    };

function isDeepEqual(a: any, b: any): boolean {
  if (a === b) return true;
  if (typeof a !== 'object' || a === null || typeof b !== 'object' || b === null) return false;
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  if (keysA.length !== keysB.length) return false;
  for (const key of keysA) {
    if (!keysB.includes(key) || !isDeepEqual(a[key], b[key])) return false;
  }
  return true;
}

/**
 * Pure function to deterministically compute a card's current state from its event history.
 */
export function reconcileCardHistory(
  card: ReviewCard,
  events: ReviewEvent[],
  parameterSets: Record<string, SchedulerParameterSet>
): ReconciliationResult {
  const diagnostics: ReconciliationDiagnostics = {
    eventsProcessed: 0,
    eventsIgnored: 0,
    eventsDeduplicated: 0,
  };

  const parsedCardResult = reviewCardSchema.safeParse(card);
  if (!parsedCardResult.success) {
    return { ok: false, error: 'invalid_card', diagnostics, message: 'Invalid ReviewCard data' };
  }
  const validCard = parsedCardResult.data;

  let currentState = createInitialCardState(validCard.id as string, new Date(validCard.createdAt as string));

  if (events.length === 0) {
    return { ok: true, state: currentState, diagnostics };
  }

  const validEvents = new Map<string, ReviewEvent>();

  for (const rawEvent of events) {
    const parsedEventResult = reviewEventSchema.safeParse(rawEvent);
    if (!parsedEventResult.success) {
      return { ok: false, error: 'invalid_event', diagnostics, message: `Invalid event data: ${rawEvent.id}` };
    }
    const event = parsedEventResult.data;

    if (event.cardId !== validCard.id || event.knowledgeItemId !== validCard.knowledgeItemId) {
      return { ok: false, error: 'foreign_event', diagnostics, message: `Event ${event.id} belongs to different card or knowledge item` };
    }

    if (validEvents.has(event.id)) {
      const existing = validEvents.get(event.id)!;
      if (!isDeepEqual(existing, event)) {
        return { ok: false, error: 'conflicting_duplicate_event', diagnostics, message: `Conflicting content for event ID ${event.id}` };
      } else {
        diagnostics.eventsDeduplicated++;
      }
    } else {
      validEvents.set(event.id, event);
    }
  }

  const sortedEvents = Array.from(validEvents.values()).sort((a, b) => {
    const timeA = new Date(a.reviewTimestamp).getTime();
    const timeB = new Date(b.reviewTimestamp).getTime();
    if (timeA !== timeB) return timeA - timeB;
    return (a.id as string).localeCompare(b.id as string);
  });

  for (const event of sortedEvents) {
    const paramSetId = event.schedulerMetadata.parameterSetId;
    const rawParamSet = parameterSets[paramSetId];

    if (!rawParamSet) {
      return { ok: false, error: 'missing_parameter_set', diagnostics, message: `Missing parameter set ${paramSetId} for event ${event.id}` };
    }

    const parsedParamSetResult = schedulerParameterSetSchema.safeParse(rawParamSet);
    if (!parsedParamSetResult.success) {
      return { ok: false, error: 'parameter_set_mismatch', diagnostics, message: `Invalid parameter set data for ${paramSetId}` };
    }
    const paramSet = parsedParamSetResult.data;
    
    if (paramSet.id !== paramSetId) {
       return { ok: false, error: 'parameter_set_mismatch', diagnostics, message: `Parameter set ID mismatch: expected ${paramSetId}, got ${paramSet.id}` };
    }

    if (
      paramSet.algorithm !== event.schedulerMetadata.algorithm ||
      paramSet.implementation !== event.schedulerMetadata.implementation ||
      paramSet.implementationVersion !== event.schedulerMetadata.implementationVersion
    ) {
      return { ok: false, error: 'parameter_set_mismatch', diagnostics, message: `Parameter set identity metadata mismatch for event ${event.id}` };
    }

    if (
      event.schedulerMetadata.algorithm !== 'fsrs-6' || 
      event.schedulerMetadata.implementation !== 'ts-fsrs'
    ) {
      return { ok: false, error: 'unsupported_scheduler', diagnostics, message: `Unsupported algorithm/implementation for event ${event.id}` };
    }

    const reviewResult = scheduleReview(
      currentState,
      event.rating,
      new Date(event.reviewTimestamp),
      {
        desiredRetention: event.schedulerMetadata.desiredRetention,
        parameterSet: paramSet,
        enableFuzz: false
      }
    );

    currentState = reviewResult.nextState;
    diagnostics.eventsProcessed++;
  }

  return { ok: true, state: currentState, diagnostics };
}
