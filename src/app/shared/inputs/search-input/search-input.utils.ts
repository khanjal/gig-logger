import { ISearchItem } from '@interfaces/search-item.interface';

export function createSearchItem(item: any, nameProperty: string): ISearchItem {
  return {
    id: item.id,
    name: item[nameProperty],
    saved: item.saved,
    value: item[nameProperty],
    trips: item.trips
  };
}

// In-memory cache for JSON data per searchType (module-level, shared across all component instances)
const jsonCache: Record<string, any[] | undefined> = {};

export async function searchJson(searchType: string, value: string): Promise<ISearchItem[]> {
  try {
    // Check cache first
    if (!jsonCache[searchType]) {
      jsonCache[searchType] = await fetch(`/assets/json/${searchType}.json`).then(res => res.json());
    }
    const itemsJson = jsonCache[searchType] || [];
    return itemsJson
      .filter((item: string) => item.toLowerCase().includes(value.toLowerCase()))
      .map((item: string, idx: number) => ({
        id: idx + 1, // Use a positive number as a made-up id to avoid triggering the Google icon
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
    error?.status === 429
  );
}

export function isGoogleResult(item: ISearchItem): boolean {
  return item.id === undefined && item.trips === 0 && !item.saved;
}
