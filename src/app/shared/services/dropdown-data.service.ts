import { Injectable } from '@angular/core';
import { ServiceService } from '@services/sheets/service.service';
import { TypeService } from '@services/sheets/type.service';
import { PlaceService } from '@services/sheets/place.service';
import { AddressService } from '@services/sheets/address.service';
import { RegionService } from '@services/sheets/region.service';
import { LoggerService } from '@services/logger.service';
import { IService } from '@interfaces/service.interface';
import { IType } from '@interfaces/type.interface';
import { IPlace } from '@interfaces/place.interface';
import { IAddress } from '@interfaces/address.interface';
import { IRegion } from '@interfaces/region.interface';
import { DropdownType, IDropdownData } from '@interfaces/dropdown-data.interface';

export { DropdownType };

/**
 * @deprecated Use IDropdownData from @interfaces/dropdown-data.interface instead
 */
export type DropdownData = IDropdownData;

@Injectable({
  providedIn: 'root'
})
export class DropdownDataService {
  private cachedData: DropdownData | null = null;
  
  // Canonical lists from static JSON files (fallback for proper casing)
  private canonicalServices: string[] = [];
  private canonicalTypes: string[] = [];
  private canonicalPlaces: string[] = [];
  private canonicalLoaded: boolean = false;

  constructor(
    private _serviceService: ServiceService,
    private _typeService: TypeService,
    private _placeService: PlaceService,
    private _addressService: AddressService,
    private _regionService: RegionService,
    private logger: LoggerService
  ) {
    this.loadCanonicalLists();
  }

  /**
   * Loads canonical lists from static JSON files for proper casing fallback
   */
  private async loadCanonicalLists(): Promise<void> {
    if (this.canonicalLoaded) return;
    
    try {
      const [services, types, places] = await Promise.all([
        fetch('/assets/json/services.json').then(r => r.json()),
        fetch('/assets/json/types.json').then(r => r.json()),
        fetch('/assets/json/places.json').then(r => r.json())
      ]);
      
      this.canonicalServices = services || [];
      this.canonicalTypes = types || [];
      this.canonicalPlaces = places || [];
      this.canonicalLoaded = true;
      
      this.logger.info('DropdownDataService - Loaded canonical lists');
    } catch (error) {
      this.logger.error('DropdownDataService - Failed to load canonical lists:', error);
      // Continue anyway - will use database values only
    }
  }

  /**
   * Fetches all dropdown data and caches it
   */
  async getAllDropdownData(): Promise<DropdownData> {
    if (this.cachedData) {
      return this.cachedData;
    }

    // Ensure canonical lists are loaded
    await this.loadCanonicalLists();

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
   * Checks both database list and canonical JSON list for proper casing
   * Returns properly cased input value if no match found
   */
  findBestMatch(raw: string, list: string[], type?: DropdownType): string | undefined {
    if (!raw) return this.toProperCase(raw);
    
    // Normalize function: lowercase, remove apostrophes, extra spaces, punctuation
    const normalize = (str: string) => 
      str.toLowerCase()
         .replace(/[']/g, '')  // Remove apostrophes
         .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '')  // Remove punctuation
         .replace(/\s+/g, ' ')  // Normalize spaces
         .trim();
    
    const normalizedRaw = normalize(raw);
    
    // Get canonical list based on type
    let canonicalList: string[] = [];
    if (type) {
      switch (type) {
        case 'Service':
          canonicalList = this.canonicalServices;
          break;
        case 'Type':
          canonicalList = this.canonicalTypes;
          break;
        case 'Place':
          canonicalList = this.canonicalPlaces;
          break;
      }
    }
    
    // 1. Try exact match in database list
    let found = list?.find(item => normalize(item) === normalizedRaw);
    if (found) {
      this.logger.debug(`DropdownDataService - Exact match in database: "${raw}" -> "${found}"`);
      return found;
    }
    
    // 2. Try exact match in canonical list
    if (canonicalList.length > 0) {
      found = canonicalList.find(item => normalize(item) === normalizedRaw);
      if (found) {
        this.logger.debug(`DropdownDataService - Exact match in canonical list: "${raw}" -> "${found}"`);
        return found;
      }
    }
    
    // 3. Try partial match in database list
    found = list?.find(item => {
      const normalizedItem = normalize(item);
      return normalizedItem.includes(normalizedRaw) || 
             normalizedRaw.includes(normalizedItem);
    });
    if (found) {
      this.logger.debug(`DropdownDataService - Partial match in database: "${raw}" -> "${found}"`);
      return found;
    }
    
    // 4. Try partial match in canonical list
    if (canonicalList.length > 0) {
      found = canonicalList.find(item => {
        const normalizedItem = normalize(item);
        return normalizedItem.includes(normalizedRaw) || 
               normalizedRaw.includes(normalizedItem);
      });
      if (found) {
        this.logger.debug(`DropdownDataService - Partial match in canonical list: "${raw}" -> "${found}"`);
        return found;
      }
    }
    
    // 5. No match - return properly cased input
    this.logger.debug(`DropdownDataService - No match found for: "${raw}", returning proper case`);
    return this.toProperCase(raw);
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
