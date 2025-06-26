import { ISearchItem } from '@interfaces/search-item.interface';

/**
 * Creates a search item from a generic object and a property name.
 */
export function createSearchItem(item: any, nameProperty: string): ISearchItem {
  return {
    id: item.id,
    name: item[nameProperty],
    saved: item.saved,
    value: item[nameProperty],
    trips: item.trips
  };
}

/**
 * Loads and filters a JSON file for search results.
 * Returns ISearchItem[] matching the value (case-insensitive).
 */
export async function searchJson(searchType: string, value: string): Promise<ISearchItem[]> {
  try {
    const itemsJson = await fetch(`/assets/json/${searchType}.json`).then(res => res.json());
    return itemsJson
      .filter((item: string) => item.toLowerCase().includes(value.toLowerCase()))
      .map((item: string) => ({
        id: item,
        name: item,
        saved: false,
        value: item,
        trips: 0
      }));
  } catch (error) {
    console.warn(`Error loading ${searchType}.json:`, error);
    return [];
  }
}

/**
 * Determines if an error is a Google rate limit or quota error.
 */
export function isRateLimitError(error: any): boolean {
  if (!error) return false;
  const errorMessage = error.message?.toLowerCase() || '';
  const errorCode = error.code?.toLowerCase() || '';
  return (
    errorCode === 'over_query_limit' ||
    errorCode === 'request_denied' ||
    errorMessage.includes('over query limit') ||
    errorMessage.includes('quota exceeded') ||
    errorMessage.includes('rate limit') ||
    errorMessage.includes('too many requests') ||
    error.status === 429
  );
}

/**
 * Checks if an ISearchItem is a Google result (not saved, no id, no trips).
 */
export function isGoogleResult(item: ISearchItem): boolean {
  return item.id === undefined && item.trips === 0 && !item.saved;
}
