import { LoggerService } from '@services/logger.service';
import type { ISearchItem } from '@interfaces/search/search-item.interface';

// Module-level logger for utility functions (no DI available here)
const logger = new LoggerService();

export function createSearchItem(item: object | null | undefined, nameProperty: string): ISearchItem {
  if (!item || typeof item !== 'object') {
    throw new Error('Invalid item provided to createSearchItem');
  }

  const record = item as unknown as Record<string, unknown>;
  const name = record[nameProperty];
  if (typeof name !== 'string') {
    logger.warn(`Invalid name property '${nameProperty}' in item:`, item);
    return {
      id: record['id'] as number | undefined,
      name: String(name || ''),
      saved: Boolean(record['saved']),
      value: String(name || ''),
      trips: Number(record['trips']) || 0
    };
  }

  return {
    id: record['id'] as number | undefined,
    name: name,
    saved: Boolean(record['saved']),
    value: name,
    trips: Number(record['trips']) || 0
  };
}

export function isRateLimitError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;

  const err = error as { message?: string; code?: string; status?: number };
  const errorMessage = err.message?.toLowerCase() || '';
  const errorCode = err.code?.toLowerCase() || '';
  const status = err.status;

  return (
    errorCode === 'over_query_limit' ||
    errorCode === 'request_denied' ||
    errorMessage.includes('over query limit') ||
    errorMessage.includes('quota exceeded') ||
    errorMessage.includes('rate limit') ||
    errorMessage.includes('too many requests') ||
    status === 429
  );
}

export function isGoogleResult(item: ISearchItem): boolean {
  return item.id === undefined && item.trips === 0 && !item.saved;
}

/**
 * Validates if a search type is supported
 */
export function isValidSearchType(searchType: string): boolean {
  const validTypes = ['Address', 'Name', 'Place', 'Region', 'Service', 'Type'];
  return validTypes.includes(searchType);
}

