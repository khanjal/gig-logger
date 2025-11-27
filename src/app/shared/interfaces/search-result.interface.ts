import { ITrip } from "./trip.interface";

export type SearchCategory = 'Service' | 'Place' | 'Name' | 'Address' | 'Region' | 'Type' | 'All';

export interface ISearchResult {
  id?: number;
  type: SearchCategory;
  value: string;
  trips: ITrip[];
  totalTrips: number;
  totalEarnings: number;
  firstDate?: string;
  lastDate?: string;
}

export interface ISearchResultGroup {
  month: string; // e.g., "2024-11" or "November 2024"
  monthKey?: string; // e.g., "2024-11" for sorting
  year: string;
  results: ISearchResult[];
  totalTrips: number;
  totalEarnings: number;
}
