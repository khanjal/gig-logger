/**
 * Dropdown type for categorizing dropdown data lists.
 */
export type DropdownType = 'Service' | 'Type' | 'Place' | 'Address' | 'Region' | 'Name';

/**
 * Dropdown data interface for dynamic form dropdowns.
 */
export interface IDropdownData {
  services: string[];
  types: string[];
  places: string[];
  addresses: string[];
  regions: string[];
  names: string[];
}
