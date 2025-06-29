export interface ISearchItem {
  id?: number;
  name: string;
  saved: boolean;
  value: string;
  trips?: number;
  placeId?: string; // For Google Places integration
}