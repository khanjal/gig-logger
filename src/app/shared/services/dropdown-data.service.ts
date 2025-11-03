import { Injectable } from '@angular/core';
import { ServiceService } from '@services/sheets/service.service';
import { TypeService } from '@services/sheets/type.service';
import { PlaceService } from '@services/sheets/place.service';
import { AddressService } from '@services/sheets/address.service';
import { RegionService } from '@services/sheets/region.service';
import { IService } from '@interfaces/service.interface';
import { IType } from '@interfaces/type.interface';
import { IPlace } from '@interfaces/place.interface';
import { IAddress } from '@interfaces/address.interface';
import { IRegion } from '@interfaces/region.interface';

export type DropdownType = 'Service' | 'Type' | 'Place' | 'Address' | 'Region';

export interface DropdownData {
  services: string[];
  types: string[];
  places: string[];
  addresses: string[];
  regions: string[];
}

@Injectable({
  providedIn: 'root'
})
export class DropdownDataService {
  private cachedData: DropdownData | null = null;

  constructor(
    private _serviceService: ServiceService,
    private _typeService: TypeService,
    private _placeService: PlaceService,
    private _addressService: AddressService,
    private _regionService: RegionService
  ) {}

  /**
   * Fetches all dropdown data and caches it
   */
  async getAllDropdownData(): Promise<DropdownData> {
    if (this.cachedData) {
      return this.cachedData;
    }

    const [services, types, places, addresses, regions] = await Promise.all([
      this._serviceService.list(),
      this._typeService.list(),
      this._placeService.list(),
      this._addressService.list(),
      this._regionService.list()
    ]);

    this.cachedData = {
      services: (services as IService[]).map((s: IService) => s.service),
      types: (types as IType[]).map((t: IType) => t.type),
      places: (places as IPlace[]).map((p: IPlace) => p.place),
      addresses: (addresses as IAddress[]).map((a: IAddress) => a.address),
      regions: (regions as IRegion[]).map((r: IRegion) => r.region)
    };

    return this.cachedData;
  }

  /**
   * Gets a specific dropdown list by type
   */
  async getDropdownList(type: DropdownType): Promise<string[]> {
    const data = await this.getAllDropdownData();
    switch (type) {
      case 'Service':
        return data.services;
      case 'Type':
        return data.types;
      case 'Place':
        return data.places;
      case 'Address':
        return data.addresses;
      case 'Region':
        return data.regions;
      default:
        return [];
    }
  }

  /**
   * Filters a dropdown list by a search term
   */
  async filterDropdown(type: DropdownType, searchTerm: string): Promise<string[]> {
    const list = await this.getDropdownList(type);
    if (!searchTerm) return list;
    
    const lowerSearch = searchTerm.toLowerCase();
    return list.filter(item => item.toLowerCase().includes(lowerSearch));
  }

  /**
   * Finds the best match for a value in a list (case-insensitive, partial allowed)
   * Handles apostrophes, punctuation, and spacing differences
   * Returns properly cased input value if no match found
   */
  findBestMatch(raw: string, list: string[]): string | undefined {
    if (!raw || !list || !list.length) return this.toProperCase(raw);
    
    // Normalize function: lowercase, remove apostrophes, extra spaces, punctuation
    const normalize = (str: string) => 
      str.toLowerCase()
         .replace(/[']/g, '')  // Remove apostrophes
         .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '')  // Remove punctuation
         .replace(/\s+/g, ' ')  // Normalize spaces
         .trim();
    
    const normalizedRaw = normalize(raw);
    
    // Exact match (normalized)
    let found = list.find(item => normalize(item) === normalizedRaw);
    if (found) return found;
    
    // Partial match (normalized)
    found = list.find(item => {
      const normalizedItem = normalize(item);
      return normalizedItem.includes(normalizedRaw) || 
             normalizedRaw.includes(normalizedItem);
    });
    
    // Return the list item if found, otherwise return properly cased input
    return found || this.toProperCase(raw);
  }

  /**
   * Converts a string to proper case (Title Case)
   */
  private toProperCase(str: string): string {
    if (!str) return str;
    return str
      .trim()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  /**
   * Clears the cache (useful when data is updated)
   */
  clearCache(): void {
    this.cachedData = null;
  }
}
