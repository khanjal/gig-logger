import { ISearchItem } from '@interfaces/search-item.interface';
import { LoggerService } from '@services/logger.service';

// Module-level logger for utility functions (no DI available here)
const logger = new LoggerService();

export function createSearchItem(item: any, nameProperty: string): ISearchItem {
  if (!item || typeof item !== 'object') {
    throw new Error('Invalid item provided to createSearchItem');
  }
  
  const name = item[nameProperty];
  if (typeof name !== 'string') {
    logger.warn(`Invalid name property '${nameProperty}' in item:`, item as any);
    return {
      id: item.id,
      name: String(name || ''),
      saved: Boolean(item.saved),
      value: String(name || ''),
      trips: Number(item.trips) || 0
    };
  }
  
  return {
    id: item.id,
    name: name,
    saved: Boolean(item.saved),
    value: name,
    trips: Number(item.trips) || 0
  };
}

export function isRateLimitError(error: any): boolean {
  if (!error) return false;
  
  const errorMessage = error.message?.toLowerCase() || '';
  const errorCode = error.code?.toLowerCase() || '';
  const status = error.status;
  
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

