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

// In-memory cache for JSON data per searchType (module-level, shared across all component instances)
const jsonCache: Record<string, string[]> = {};

export async function searchJson(searchType: string, value: string): Promise<ISearchItem[]> {
  try {
    // Check cache first
    if (!jsonCache[searchType]) {
      const response = await fetch(`/assets/json/${searchType}.json`);
      if (!response.ok) {
        throw new Error(`Failed to load ${searchType}.json: ${response.status}`);
      }
      jsonCache[searchType] = await response.json();
    }
    
    const itemsJson = jsonCache[searchType] || [];
    const searchValue = value.toLowerCase();
    
    return itemsJson
      .filter((item: string) => item.toLowerCase().includes(searchValue))
      .map((item: string, idx: number) => ({
        id: idx + 1, // Use a positive number as a made-up id to avoid triggering the Google icon
        name: item,
        saved: false,
        value: item,
        trips: 0
      }));
  } catch (error) {
    logger.warn(`Error loading ${searchType}.json:`, error as any);
    return [];
  }
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

/**
 * Clears the JSON cache for a specific search type or all types
 */
export function clearJsonCache(searchType?: string): void {
  if (searchType) {
    delete jsonCache[searchType];
  } else {
    Object.keys(jsonCache).forEach(key => delete jsonCache[key]);
  }
}
