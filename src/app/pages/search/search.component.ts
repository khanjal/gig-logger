import { Component, OnInit, OnDestroy, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CurrencyPipe } from '@angular/common';

import { SearchService } from '@services/search.service';
import { DropdownDataService } from '@services/dropdown-data.service';
import { LoggerService } from '@services/logger.service';
import { ISearchResult, ISearchResultGroup, SearchCategory } from '@interfaces/search-result.interface';
import type { DropdownType } from '@interfaces/dropdown-data.interface';
import { TripsQuickViewComponent } from '@components/trips/trips-quick-view/trips-quick-view.component';
import { BackToTopComponent } from '@components/ui/back-to-top/back-to-top.component';
import { BaseFabButtonComponent, BaseRectButtonComponent, BaseFieldButtonComponent } from '@components/base';
import { createAsyncOperationState } from '@helpers/async-operation-state.helper';
import { Subject, debounceTime, distinctUntilChanged, Observable, from, startWith, switchMap, takeUntil } from 'rxjs';

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatChipsModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatExpansionModule,
    MatCheckboxModule,
    MatAutocompleteModule,
    MatTooltipModule,
    CurrencyPipe,
    TripsQuickViewComponent,
    BackToTopComponent,
    BaseFabButtonComponent,
    BaseRectButtonComponent,
    BaseFieldButtonComponent
  ],
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.scss'],
  providers: [CurrencyPipe]
})
export class SearchComponent implements OnInit, OnDestroy {
  readonly categories: SearchCategory[] = ['Address', 'Name', 'Place', 'Region', 'Service', 'Type'];
  readonly searchState = createAsyncOperationState();
  readonly allGroupsExpanded = computed(() => {
    const groupedResults = this.groupedResults();
    if (groupedResults.length === 0) {
      return false;
    }

    const expandedGroups = this.expandedGroups();
    return groupedResults.every(group => expandedGroups.has(group.month));
  });
  searchTerm = signal('');
  isSearching = this.searchState.isLoading;
  hasSearched = this.searchState.hasCompleted;
  showFilters = signal(false);
  exactMatch = signal(false);
  caseSensitive = signal(false);

  searchResults = signal<ISearchResult[]>([]);
  groupedResults = signal<ISearchResultGroup[]>([]);
  totalResultsCount = signal(0);
  totalTripsCount = signal(0);
  totalEarnings = signal(0);
  groupAvgPerTripMap = signal(new Map<string, string>());
  groupAvgRateMap = signal(new Map<string, string>());
  resultAvgPerTripMap = signal(new Map<string, string>());
  resultAvgRateMap = signal(new Map<string, string>());
  resultSameAsGroupMap = signal(new Map<string, boolean>());

  // Category filter management
  categoryFilters = signal<Record<SearchCategory, boolean>>({
    All: false,
    Address: true,
    Name: true,
    Place: true,
    Region: true,
    Service: true,
    Type: true
  });
  readonly enabledCount = computed(() => {
    const filters = this.categoryFilters();
    return this.categories.filter(category => filters[category]).length;
  });
  readonly categoryMetadata: Record<SearchCategory, { icon: string; color: string; borderClass: string }>;
  
  // Autocomplete
  filteredAutocomplete$: Observable<string[]> | undefined;
  
  // For debouncing search input
  private searchSubject = new Subject<string>();
  private autocompleteSubject = new Subject<string>();
  private destroy$ = new Subject<void>();

  // Track expanded panels
  expandedGroups = signal(new Set<string>());
  expandedResults = signal(new Set<string>());

  constructor(
    private searchService: SearchService,
    private dropdownDataService: DropdownDataService,
    private currencyPipe: CurrencyPipe,
    private logger: LoggerService
  ) {
    this.categoryMetadata = this.categories.reduce((acc, category) => {
      acc[category] = {
        icon: this.searchService.getCategoryIcon(category),
        color: this.searchService.getCategoryColor(category),
        borderClass: this.searchService.getCategoryBorderClass(category),
      };
      return acc;
    }, {} as Record<SearchCategory, { icon: string; color: string; borderClass: string }>);
  }

  async ngOnInit(): Promise<void> {
    // Setup debounced search
    this.searchSubject
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(term => {
        void this.performSearch(term);
      });

    // Setup autocomplete filtering
    this.setupAutocompleteFilter();
    this.autocompleteSubject.next(this.searchTerm());
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }



  /**
   * Setup autocomplete filtering based on search term
   */
  setupAutocompleteFilter(): void {
    this.filteredAutocomplete$ = this.autocompleteSubject.pipe(
      startWith(this.searchTerm()),
      switchMap((searchValue: string) => from(this.getFilteredAutocompleteOptions(searchValue)))
    );
  }

  /**
   * Filter autocomplete options using centralized dropdown service logic.
   */
  private async getFilteredAutocompleteOptions(value: string): Promise<string[]> {
    const enabledTypes = this.getEnabledCategories() as DropdownType[];
    if (enabledTypes.length === 0) {
      return [];
    }

    const resultsByType = await Promise.all(
      enabledTypes.map((type: DropdownType) => this.dropdownDataService.filterDropdown(type, value))
    );

    const uniqueOptions = new Set<string>();
    resultsByType.forEach((options: string[]) => {
      options.forEach((option: string) => uniqueOptions.add(option));
    });

    return Array.from(uniqueOptions)
      .sort((a: string, b: string) => a.localeCompare(b))
      .slice(0, 50);
  }

  /**
   * Called when user types in search input
   */
  onSearchInput(value: string): void {
    this.searchTerm.set(value);
    this.showFilters.set(false);
    this.searchSubject.next(value);
    this.autocompleteSubject.next(value);
  }

  /**
   * Called when autocomplete option is selected
   */
  onAutocompleteSelected(value: string): void {
    this.searchTerm.set(value);
    void this.performSearch(value);
  }

  /**
   * Toggle filter section visibility
   */
  toggleFilters(): void {
    this.showFilters.update(show => !show);
  }

  /**
   * Get list of enabled categories
   */
  getEnabledCategories(): SearchCategory[] {
    const filters = this.categoryFilters();
    const enabled = this.categories.filter(category => filters[category]);
    // Return alphabetically sorted or default alphabetical list
    return enabled.length > 0 ? [...enabled].sort() : [...this.categories];
  }

  /**
   * Toggle a category filter
   */
  toggleCategory(category: SearchCategory): void {
    this.categoryFilters.update(filters => ({
      ...filters,
      [category]: !filters[category]
    }));

    // Refresh autocomplete based on current filters
    this.autocompleteSubject.next(this.searchTerm());
    
    // Re-run search if already searched
    if (this.searchTerm().trim().length > 0) {
      void this.performSearch(this.searchTerm());
    }
  }

  /**
   * Check if a category is enabled
   */
  isCategoryEnabled(category: SearchCategory): boolean {
    return this.categoryFilters()[category] || false;
  }

  /**
   * Get count of enabled categories
   */
  getEnabledCount(): number {
    return this.enabledCount();
  }

  /**
   * Select all categories
   */
  selectAllCategories(): void {
    this.categoryFilters.set({
      All: false,
      Address: true,
      Name: true,
      Place: true,
      Region: true,
      Service: true,
      Type: true
    });
    this.autocompleteSubject.next(this.searchTerm());
    if (this.searchTerm().trim().length > 0) {
      void this.performSearch(this.searchTerm());
    }
  }

  /**
   * Deselect all categories
   */
  deselectAllCategories(): void {
    this.categoryFilters.set({
      All: false,
      Address: false,
      Name: false,
      Place: false,
      Region: false,
      Service: false,
      Type: false
    });
    this.autocompleteSubject.next(this.searchTerm());
    if (this.searchTerm().trim().length > 0) {
      void this.performSearch(this.searchTerm());
    }
  }

  /**
   * Handle exact match toggle
   */
  onExactMatchChange(): void {
    if (this.searchTerm().trim().length > 0) {
      void this.performSearch(this.searchTerm());
    }
  }

  /**
   * Handle case sensitive toggle
   */
  onCaseSensitiveChange(): void {
    if (this.searchTerm().trim().length > 0) {
      void this.performSearch(this.searchTerm());
    }
  }

  /**
   * Called when user selects a category filter
   */
  onCategoryChange(category: SearchCategory): void {
    this.toggleCategory(category);
  }

  /**
   * Perform the actual search
   */
  async performSearch(term: string): Promise<void> {
    if (!term || term.trim().length === 0) {
      this.searchResults.set([]);
      this.groupedResults.set([]);
      this.resetDerivedMetrics();
      this.searchState.reset();
      this.expandedGroups.set(new Set<string>());
      this.expandedResults.set(new Set<string>());
      return;
    }

    this.searchState.setLoading();
    this.expandedGroups.set(new Set<string>());
    this.expandedResults.set(new Set<string>());

    try {
      const enabledCategories = this.getEnabledCategories();
      const searchResults = await this.searchService.searchMultipleCategories(term, enabledCategories, this.exactMatch(), this.caseSensitive());
      const groupedResults = this.searchService.groupByMonth(searchResults);
      this.searchResults.set(searchResults);
      this.groupedResults.set(groupedResults);
      this.updateDerivedMetrics(searchResults, groupedResults);
    } catch (error) {
      this.logger.error('Search error:', error);
      this.searchResults.set([]);
      this.groupedResults.set([]);
      this.resetDerivedMetrics();
      this.searchState.setError('Search failed');
    } finally {
      if (!this.searchState.hasError()) {
        this.searchState.setSuccess();
      }
    }
  }

  /**
   * Clear search results and reset form
   */
  clearSearch(): void {
    this.searchTerm.set('');
    this.searchResults.set([]);
    this.groupedResults.set([]);
    this.resetDerivedMetrics();
    this.searchState.reset();
    this.expandedGroups.set(new Set<string>());
    this.expandedResults.set(new Set<string>());
    // Reset autocomplete suggestions
    this.autocompleteSubject.next(this.searchTerm());
  }

  /**
   * Get icon for a category
   */
  getCategoryIcon(category: SearchCategory): string {
    return this.searchService.getCategoryIcon(category);
  }

  /**
   * Get color class for a category
   */
  getCategoryColor(category: SearchCategory): string {
    return this.searchService.getCategoryColor(category);
  }

  /**
   * Get border color class for a category.
   */
  getCategoryBorderClass(category: SearchCategory): string {
    return this.searchService.getCategoryBorderClass(category);
  }

  /**
   * Get categories as array for template iteration
   */
  getCategoriesArray(): SearchCategory[] {
    return this.categories;
  }

  /**
   * Toggle group expansion
   */
  toggleGroup(monthKey: string): void {
    this.expandedGroups.update(current => {
      const next = new Set(current);
      if (next.has(monthKey)) {
        next.delete(monthKey);
      } else {
        next.add(monthKey);
      }
      return next;
    });
  }

  /**
   * Check if group is expanded
   */
  isGroupExpanded(monthKey: string): boolean {
    return this.expandedGroups().has(monthKey);
  }

  /**
   * Toggle result expansion to show trips
   */
  toggleResult(resultKey: string): void {
    this.expandedResults.update(current => {
      const next = new Set(current);
      if (next.has(resultKey)) {
        next.delete(resultKey);
      } else {
        next.add(resultKey);
      }
      return next;
    });
  }

  /**
   * Check if result is expanded
   */
  isResultExpanded(resultKey: string): boolean {
    return this.expandedResults().has(resultKey);
  }

  /**
   * Get unique key for a result
   */
  getResultKey(result: ISearchResult, monthKey: string): string {
    return `${monthKey}-${result.type}-${result.value}`;
  }

  getResultMetric(result: ISearchResult, monthKey: string, metricMap: Map<string, string>): string {
    return metricMap.get(this.getResultKey(result, monthKey)) || '-';
  }

  isResultSameAsGroupByKey(result: ISearchResult, group: ISearchResultGroup): boolean {
    return this.resultSameAsGroupMap().get(this.getResultKey(result, group.month)) || false;
  }

  private updateDerivedMetrics(searchResults: ISearchResult[], groupedResults: ISearchResultGroup[]): void {
    const uniqueTrips = new Map<number, any>();
    searchResults.forEach(result => {
      result.trips.forEach(trip => {
        if (typeof trip.id === 'number' && !trip.exclude && !uniqueTrips.has(trip.id)) {
          uniqueTrips.set(trip.id, trip);
        }
      });
    });

    let earnings = 0;
    uniqueTrips.forEach(trip => {
      earnings += trip.total || 0;
    });

    const groupAvgPerTripMap = new Map<string, string>();
    const groupAvgRateMap = new Map<string, string>();
    const resultAvgPerTripMap = new Map<string, string>();
    const resultAvgRateMap = new Map<string, string>();
    const resultSameAsGroupMap = new Map<string, boolean>();

    groupedResults.forEach(group => {
      groupAvgPerTripMap.set(group.month, this.computeGroupAvgPerTrip(group));
      groupAvgRateMap.set(group.month, this.computeGroupAvgRate(group));

      group.results.forEach(result => {
        const key = this.getResultKey(result, group.month);
        resultAvgPerTripMap.set(key, this.computeResultAvgPerTrip(result));
        resultAvgRateMap.set(key, this.computeResultAvgRate(result));
        resultSameAsGroupMap.set(key, this.computeResultSameAsGroup(result, group));
      });
    });

    this.totalResultsCount.set(searchResults.length);
    this.totalTripsCount.set(uniqueTrips.size);
    this.totalEarnings.set(earnings);
    this.groupAvgPerTripMap.set(groupAvgPerTripMap);
    this.groupAvgRateMap.set(groupAvgRateMap);
    this.resultAvgPerTripMap.set(resultAvgPerTripMap);
    this.resultAvgRateMap.set(resultAvgRateMap);
    this.resultSameAsGroupMap.set(resultSameAsGroupMap);
  }

  private resetDerivedMetrics(): void {
    this.totalResultsCount.set(0);
    this.totalTripsCount.set(0);
    this.totalEarnings.set(0);
    this.groupAvgPerTripMap.set(new Map<string, string>());
    this.groupAvgRateMap.set(new Map<string, string>());
    this.resultAvgPerTripMap.set(new Map<string, string>());
    this.resultAvgRateMap.set(new Map<string, string>());
    this.resultSameAsGroupMap.set(new Map<string, boolean>());
  }

  private computeGroupAvgPerTrip(group: ISearchResultGroup): string {
    if (!group || !group.results) return '-';
    const uniqueTrips = new Map<number, any>();
    group.results.forEach(result => {
      result.trips.forEach(trip => {
        if (typeof trip.id === 'number' && !trip.exclude && !uniqueTrips.has(trip.id)) {
          uniqueTrips.set(trip.id, trip);
        }
      });
    });
    const tripsArr = Array.from(uniqueTrips.values());
    if (tripsArr.length === 0) return '-';
    const total = tripsArr.reduce((sum, trip) => sum + (trip.total || 0), 0);
    return this.currencyPipe.transform(total / tripsArr.length) || '-';
  }

  private computeGroupAvgRate(group: ISearchResultGroup): string {
    if (!group || !group.results) return '-';
    const uniqueTrips = new Map<number, any>();
    group.results.forEach(result => {
      result.trips.forEach(trip => {
        if (typeof trip.id === 'number' && !trip.exclude && !uniqueTrips.has(trip.id)) {
          uniqueTrips.set(trip.id, trip);
        }
      });
    });
    const tripsArr = Array.from(uniqueTrips.values());
    if (tripsArr.length === 0) return '-';
    const withRate = tripsArr.filter(trip => typeof trip.amountPerTime === 'number');
    if (withRate.length === 0) return '-';
    const avg = withRate.reduce((sum, trip) => sum + trip.amountPerTime, 0) / withRate.length;
    return `$${avg.toFixed(2)}`;
  }

  private computeResultAvgPerTrip(result: ISearchResult): string {
    if (!result || !result.trips) return '-';
    const trips = result.trips.filter(trip => typeof trip.id === 'number' && !trip.exclude);
    if (trips.length === 0) return '-';
    const total = trips.reduce((sum, trip) => sum + (trip.total || 0), 0);
    return this.currencyPipe.transform(total / trips.length) || '-';
  }

  private computeResultAvgRate(result: ISearchResult): string {
    if (!result || !result.trips) return '-';
    const trips = result.trips.filter(trip => typeof trip.amountPerTime === 'number' && !trip.exclude);
    if (trips.length === 0) return '-';
    const avg = trips.reduce((sum, trip) => sum + trip.amountPerTime, 0) / trips.length;
    return `$${avg.toFixed(2)}`;
  }

  private computeResultSameAsGroup(result: ISearchResult, group: ISearchResultGroup): boolean {
    if (!result || !group) return false;

    const resultTripIds = new Set<number>();
    result.trips.forEach(trip => {
      if (typeof trip.id === 'number' && !trip.exclude) {
        resultTripIds.add(trip.id);
      }
    });

    const groupTripIds = new Set<number>();
    group.results.forEach(r => {
      r.trips.forEach(trip => {
        if (typeof trip.id === 'number' && !trip.exclude) {
          groupTripIds.add(trip.id);
        }
      });
    });

    if (resultTripIds.size !== groupTripIds.size) return false;

    for (const id of resultTripIds) {
      if (!groupTripIds.has(id)) return false;
    }

    return true;
  }

  /**
   * Get total unique results count (not grouped)
   */
  getTotalResultsCount(): number {
    return this.searchResults().length;
  }

  /**
   * Get total trips across all results
   */
  getTotalTripsCount(): number {
    const uniqueTripIds = new Set<number>();
    this.searchResults().forEach(result => {
      result.trips.forEach(trip => {
        if (typeof trip.id === 'number' && !trip.exclude) uniqueTripIds.add(trip.id);
      });
    });
    return uniqueTripIds.size;
  }

  /**
   * Get total earnings across all results
   */
  getTotalEarnings(): number {
    const uniqueTrips = new Map<number, any>();
    this.searchResults().forEach(result => {
      result.trips.forEach(trip => {
        if (typeof trip.id === 'number' && !trip.exclude && !uniqueTrips.has(trip.id)) {
          uniqueTrips.set(trip.id, trip);
        }
      });
    });
    let total = 0;
    uniqueTrips.forEach(trip => {
      total += trip.total || 0;
    });
    return total;
  }

  /**
   * Expand all groups
   */
  expandAll(): void {
    this.expandedGroups.set(new Set(this.groupedResults().map(group => group.month)));
  }

  /**
   * Collapse all groups
   */
  collapseAll(): void {
    this.expandedGroups.set(new Set<string>());
    this.expandedResults.set(new Set<string>());
  }

  /**
   * Check if all groups are expanded
   */
  areAllGroupsExpanded(): boolean {
    return this.allGroupsExpanded();
  }

  /**
   * Toggle all groups between expanded and collapsed
   */
  toggleAllGroups(): void {
    if (this.areAllGroupsExpanded()) {
      this.collapseAll();
    } else {
      this.expandAll();
    }
  }

  getGroupAvgPerTrip(group: ISearchResultGroup): string {
    if (!group || !group.results) return '-';
    // Collect unique, non-excluded trips
    const uniqueTrips = new Map<number, any>();
    group.results.forEach(result => {
      result.trips.forEach(trip => {
        if (typeof trip.id === 'number' && !trip.exclude && !uniqueTrips.has(trip.id)) {
          uniqueTrips.set(trip.id, trip);
        }
      });
    });
    const tripsArr = Array.from(uniqueTrips.values());
    if (tripsArr.length === 0) return '-';
    const total = tripsArr.reduce((sum, trip) => sum + (trip.total || 0), 0);
    return this.currencyPipe.transform(total / tripsArr.length) || '-';
  }

  getGroupAvgRate(group: ISearchResultGroup): string {
    if (!group || !group.results) return '-';
    // Collect unique, non-excluded trips
    const uniqueTrips = new Map<number, any>();
    group.results.forEach(result => {
      result.trips.forEach(trip => {
        if (typeof trip.id === 'number' && !trip.exclude && !uniqueTrips.has(trip.id)) {
          uniqueTrips.set(trip.id, trip);
        }
      });
    });
    const tripsArr = Array.from(uniqueTrips.values());
    if (tripsArr.length === 0) return '-';
    // Only count trips with amountPerTime
    const withRate = tripsArr.filter(trip => typeof trip.amountPerTime === 'number');
    if (withRate.length === 0) return '-';
    const avg = withRate.reduce((sum, trip) => sum + trip.amountPerTime, 0) / withRate.length;
    return `$${avg.toFixed(2)}`;
  }

  getResultAvgPerTrip(result: ISearchResult): string {
    if (!result || !result.trips) return '-';
    const trips = result.trips.filter(trip => typeof trip.id === 'number' && !trip.exclude);
    if (trips.length === 0) return '-';
    const total = trips.reduce((sum, trip) => sum + (trip.total || 0), 0);
    return this.currencyPipe.transform(total / trips.length) || '-';
  }

  getResultAvgRate(result: ISearchResult): string {
    if (!result || !result.trips) return '-';
    const trips = result.trips.filter(trip => typeof trip.amountPerTime === 'number' && !trip.exclude);
    if (trips.length === 0) return '-';
    const avg = trips.reduce((sum, trip) => sum + trip.amountPerTime, 0) / trips.length;
    return `$${avg.toFixed(2)}`;
  }

  /**
   * Check if a sub-result's trips are the same as the month group's trips
   * Used to hide redundant sub-results
   */
  isResultSameAsGroup(result: ISearchResult, group: ISearchResultGroup): boolean {
    if (!result || !group) return false;
    
    // Get unique trip IDs from the result (excluding excluded trips)
    const resultTripIds = new Set<number>();
    result.trips.forEach(trip => {
      if (typeof trip.id === 'number' && !trip.exclude) {
        resultTripIds.add(trip.id);
      }
    });
    
    // Get unique trip IDs from the entire group (excluding excluded trips)
    const groupTripIds = new Set<number>();
    group.results.forEach(r => {
      r.trips.forEach(trip => {
        if (typeof trip.id === 'number' && !trip.exclude) {
          groupTripIds.add(trip.id);
        }
      });
    });
    
    // Check if both sets have the same size and contain the same IDs
    if (resultTripIds.size !== groupTripIds.size) return false;
    
    for (const id of resultTripIds) {
      if (!groupTripIds.has(id)) return false;
    }
    
    return true;
  }
}
