import { Injectable } from '@angular/core';
import { spreadsheetDB } from '@data/spreadsheet.db';
import { ITrip } from '@interfaces/trip.interface';
import { ISearchResult, ISearchResultGroup, SearchCategory } from '@interfaces/search-result.interface';

@Injectable({
  providedIn: 'root'
})
export class SearchService {

  constructor() { }

  /**
   * Search across all database tables for a given search term
   * @param searchTerm The term to search for
   * @param category The category to filter by ('All' searches all categories)
   * @returns Promise of search results
   */
  async search(searchTerm: string, category: SearchCategory = 'All'): Promise<ISearchResult[]> {
    if (!searchTerm || searchTerm.trim().length === 0) {
      return [];
    }

    const normalizedTerm = searchTerm.toLowerCase().trim();
    const results: ISearchResult[] = [];

    // Get all trips once for efficiency
    const allTrips = await spreadsheetDB.trips.toArray();

    if (category === 'All' || category === 'Service') {
      const serviceResults = await this.searchServices(normalizedTerm, allTrips);
      results.push(...serviceResults);
    }

    if (category === 'All' || category === 'Place') {
      const placeResults = await this.searchPlaces(normalizedTerm, allTrips);
      results.push(...placeResults);
    }

    if (category === 'All' || category === 'Name') {
      const nameResults = await this.searchNames(normalizedTerm, allTrips);
      results.push(...nameResults);
    }

    if (category === 'All' || category === 'Address') {
      const addressResults = await this.searchAddresses(normalizedTerm, allTrips);
      results.push(...addressResults);
    }

    if (category === 'All' || category === 'Region') {
      const regionResults = await this.searchRegions(normalizedTerm, allTrips);
      results.push(...regionResults);
    }

    if (category === 'All' || category === 'Type') {
      const typeResults = await this.searchTypes(normalizedTerm, allTrips);
      results.push(...typeResults);
    }

    return results;
  }

  /**
   * Search across multiple selected categories
   * @param searchTerm The term to search for
   * @param categories Array of categories to search within
   * @returns Promise of search results
   */
  async searchMultipleCategories(searchTerm: string, categories: SearchCategory[]): Promise<ISearchResult[]> {
    if (!searchTerm || searchTerm.trim().length === 0 || categories.length === 0) {
      return [];
    }

    const normalizedTerm = searchTerm.toLowerCase().trim();
    const results: ISearchResult[] = [];

    // Get all trips once for efficiency
    const allTrips = await spreadsheetDB.trips.toArray();

    if (categories.includes('Service')) {
      const serviceResults = await this.searchServices(normalizedTerm, allTrips);
      results.push(...serviceResults);
    }

    if (categories.includes('Place')) {
      const placeResults = await this.searchPlaces(normalizedTerm, allTrips);
      results.push(...placeResults);
    }

    if (categories.includes('Name')) {
      const nameResults = await this.searchNames(normalizedTerm, allTrips);
      results.push(...nameResults);
    }

    if (categories.includes('Address')) {
      const addressResults = await this.searchAddresses(normalizedTerm, allTrips);
      results.push(...addressResults);
    }

    if (categories.includes('Region')) {
      const regionResults = await this.searchRegions(normalizedTerm, allTrips);
      results.push(...regionResults);
    }

    if (categories.includes('Type')) {
      const typeResults = await this.searchTypes(normalizedTerm, allTrips);
      results.push(...typeResults);
    }

    return results;
  }

  /**
   * Get all possible autocomplete options for selected categories
   * @param categories Array of categories to get options from
   * @returns Promise of unique autocomplete options
   */
  async getAutocompleteOptions(categories: SearchCategory[]): Promise<string[]> {
    const options = new Set<string>();

    if (categories.includes('Service')) {
      const services = await spreadsheetDB.services.toArray();
      services.forEach(s => options.add(s.service));
    }

    if (categories.includes('Place')) {
      const places = await spreadsheetDB.places.toArray();
      places.forEach(p => options.add(p.place));
    }

    if (categories.includes('Name')) {
      const names = await spreadsheetDB.names.toArray();
      names.forEach(n => options.add(n.name));
    }

    if (categories.includes('Address')) {
      const addresses = await spreadsheetDB.addresses.toArray();
      addresses.forEach(a => options.add(a.address));
    }

    if (categories.includes('Region')) {
      const regions = await spreadsheetDB.regions.toArray();
      regions.forEach(r => options.add(r.region));
    }

    if (categories.includes('Type')) {
      const types = await spreadsheetDB.types.toArray();
      types.forEach(t => options.add(t.type));
    }

    return Array.from(options).sort();
  }

  /**
   * Search services and return matching results with associated trips
   */
  private async searchServices(searchTerm: string, allTrips: ITrip[]): Promise<ISearchResult[]> {
    const services = await spreadsheetDB.services.toArray();
    const matchingServices = services
      .filter(s => s.service.toLowerCase().includes(searchTerm))
      .sort((a, b) => a.service.localeCompare(b.service));

    return matchingServices.map(service => {
      const trips = allTrips.filter(t => t.service === service.service);
      return this.createSearchResult('Service', service.service, trips, service.id);
    }).filter(r => r.totalTrips > 0);
  }

  /**
   * Search places and return matching results with associated trips
   */
  private async searchPlaces(searchTerm: string, allTrips: ITrip[]): Promise<ISearchResult[]> {
    const places = await spreadsheetDB.places.toArray();
    const matchingPlaces = places
      .filter(p => p.place.toLowerCase().includes(searchTerm))
      .sort((a, b) => a.place.localeCompare(b.place));

    return matchingPlaces.map(place => {
      const trips = allTrips.filter(t => t.place === place.place);
      return this.createSearchResult('Place', place.place, trips, place.id);
    }).filter(r => r.totalTrips > 0);
  }

  /**
   * Search names and return matching results with associated trips
   */
  private async searchNames(searchTerm: string, allTrips: ITrip[]): Promise<ISearchResult[]> {
    const names = await spreadsheetDB.names.toArray();
    const matchingNames = names
      .filter(n => n.name.toLowerCase().includes(searchTerm))
      .sort((a, b) => a.name.localeCompare(b.name));

    return matchingNames.map(name => {
      const trips = allTrips.filter(t => t.name === name.name);
      return this.createSearchResult('Name', name.name, trips, name.id);
    }).filter(r => r.totalTrips > 0);
  }

  /**
   * Search addresses (both start and end) and return matching results
   */
  private async searchAddresses(searchTerm: string, allTrips: ITrip[]): Promise<ISearchResult[]> {
    const addresses = await spreadsheetDB.addresses.toArray();
    const matchingAddresses = addresses
      .filter(a => a.address.toLowerCase().includes(searchTerm))
      .sort((a, b) => a.address.localeCompare(b.address));

    const resultsMap = new Map<string, ISearchResult>();

    matchingAddresses.forEach(address => {
      const trips = allTrips.filter(t => 
        t.startAddress === address.address || t.endAddress === address.address
      );
      
      if (trips.length > 0) {
        resultsMap.set(address.address, this.createSearchResult('Address', address.address, trips, address.id));
      }
    });

    return Array.from(resultsMap.values());
  }

  /**
   * Search regions and return matching results with associated trips
   */
  private async searchRegions(searchTerm: string, allTrips: ITrip[]): Promise<ISearchResult[]> {
    const regions = await spreadsheetDB.regions.toArray();
    const matchingRegions = regions
      .filter(r => r.region.toLowerCase().includes(searchTerm))
      .sort((a, b) => a.region.localeCompare(b.region));

    return matchingRegions.map(region => {
      const trips = allTrips.filter(t => t.region === region.region);
      return this.createSearchResult('Region', region.region, trips, region.id);
    }).filter(r => r.totalTrips > 0);
  }

  /**
   * Search types and return matching results with associated trips
   */
  private async searchTypes(searchTerm: string, allTrips: ITrip[]): Promise<ISearchResult[]> {
    const types = await spreadsheetDB.types.toArray();
    const matchingTypes = types
      .filter(t => t.type.toLowerCase().includes(searchTerm))
      .sort((a, b) => a.type.localeCompare(b.type));

    return matchingTypes.map(type => {
      const trips = allTrips.filter(t => t.type === type.type);
      return this.createSearchResult('Type', type.type, trips, type.id);
    }).filter(r => r.totalTrips > 0);
  }

  /**
   * Create a search result object from trips
   */
  private createSearchResult(type: SearchCategory, value: string, trips: ITrip[], id?: number): ISearchResult {
    const totalEarnings = trips.reduce((sum, trip) => sum + (trip.total || 0), 0);
    const dates = trips
      .filter(t => t.date)
      .map(t => t.date)
      .sort();

    return {
      id,
      type,
      value,
      trips,
      totalTrips: trips.length,
      totalEarnings,
      firstDate: dates.length > 0 ? dates[0] : undefined,
      lastDate: dates.length > 0 ? dates[dates.length - 1] : undefined
    };
  }

  /**
   * Group search results by month
   * @param results Array of search results to group
   * @returns Array of grouped results by month
   */
  groupByMonth(results: ISearchResult[]): ISearchResultGroup[] {
    const groupMap = new Map<string, ISearchResultGroup>();

    results.forEach(result => {
      result.trips.forEach(trip => {
        if (!trip.date) return;

        const date = new Date(trip.date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const monthDisplay = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });

        if (!groupMap.has(monthKey)) {
          groupMap.set(monthKey, {
            month: monthDisplay,
            year: date.getFullYear().toString(),
            results: [],
            totalTrips: 0,
            totalEarnings: 0
          });
        }

        const group = groupMap.get(monthKey)!;
        
        // Check if this result already exists in the group
        let existingResult = group.results.find(r => r.type === result.type && r.value === result.value);
        
        if (!existingResult) {
          existingResult = {
            ...result,
            trips: [],
            totalTrips: 0,
            totalEarnings: 0
          };
          group.results.push(existingResult);
        }

        // Add this trip to the result
        existingResult.trips.push(trip);
        existingResult.totalTrips++;
        existingResult.totalEarnings += trip.total || 0;

        group.totalTrips++;
        group.totalEarnings += trip.total || 0;
      });
    });

    // Sort groups by month (newest first) and sort results within each group
    return Array.from(groupMap.values())
      .sort((a, b) => b.month.localeCompare(a.month))
      .map(group => ({
        ...group,
        results: group.results.sort((a, b) => b.totalEarnings - a.totalEarnings)
      }));
  }

  /**
   * Get category icon for Material Icons
   */
  getCategoryIcon(category: SearchCategory): string {
    const icons: Record<SearchCategory, string> = {
      'Service': 'drive_eta',
      'Place': 'place',
      'Name': 'person',
      'Address': 'home',
      'Region': 'map',
      'Type': 'category',
      'All': 'search'
    };
    return icons[category];
  }

  /**
   * Get category color class for Tailwind
   */
  getCategoryColor(category: SearchCategory): string {
    const colors: Record<SearchCategory, string> = {
      'Service': 'text-blue-600',
      'Place': 'text-green-600',
      'Name': 'text-purple-600',
      'Address': 'text-orange-600',
      'Region': 'text-teal-600',
      'Type': 'text-pink-600',
      'All': 'text-gray-600'
    };
    return colors[category];
  }
}
