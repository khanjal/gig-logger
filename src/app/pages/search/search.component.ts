import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CurrencyPipe, DatePipe } from '@angular/common';

import { SearchService } from '@services/search.service';
import { ISearchResult, ISearchResultGroup, SearchCategory } from '@interfaces/search-result.interface';
import { ITrip } from '@interfaces/trip.interface';
import { TripsQuickViewComponent } from '@components/trips/trips-quick-view/trips-quick-view.component';
import { Subject, debounceTime, distinctUntilChanged, Observable, map, startWith } from 'rxjs';

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    MatChipsModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatExpansionModule,
    MatCheckboxModule,
    MatAutocompleteModule,
    MatTooltipModule,
    CurrencyPipe,
    DatePipe,
    TripsQuickViewComponent
  ],
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.scss']
})
export class SearchComponent implements OnInit, OnDestroy {
  searchTerm: string = '';
  isSearching: boolean = false;
  hasSearched: boolean = false;
  showFilters: boolean = false;
  
  searchResults: ISearchResult[] = [];
  groupedResults: ISearchResultGroup[] = [];
  
  // Category filter management
  categoryFilters = new Map<SearchCategory, boolean>([
    ['Service', true],
    ['Place', true],
    ['Name', true],
    ['Address', true],
    ['Region', true],
    ['Type', true]
  ]);
  
  // Autocomplete
  autocompleteOptions: string[] = [];
  filteredAutocomplete$: Observable<string[]> | undefined;
  
  // For debouncing search input
  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();

  // Track expanded panels
  expandedGroups = new Set<string>();
  expandedResults = new Set<string>();

  constructor(private searchService: SearchService) { }

  async ngOnInit(): Promise<void> {
    // Setup debounced search
    this.searchSubject
      .pipe(
        debounceTime(300),
        distinctUntilChanged()
      )
      .subscribe(term => {
        this.performSearch(term);
      });

    // Load autocomplete options
    await this.loadAutocompleteOptions();
    
    // Setup autocomplete filtering
    this.setupAutocompleteFilter();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Load all possible autocomplete options based on enabled filters
   */
  async loadAutocompleteOptions(): Promise<void> {
    const options = await this.searchService.getAutocompleteOptions(this.getEnabledCategories());
    this.autocompleteOptions = options;
  }

  /**
   * Setup autocomplete filtering based on search term
   */
  setupAutocompleteFilter(): void {
    this.filteredAutocomplete$ = new Observable<string[]>(observer => {
      observer.next(this.filterAutocomplete(this.searchTerm));
    }).pipe(
      startWith(''),
      map(() => this.filterAutocomplete(this.searchTerm))
    );
  }

  /**
   * Filter autocomplete options
   */
  private filterAutocomplete(value: string): string[] {
    if (!value || value.trim().length === 0) {
      return this.autocompleteOptions.slice(0, 50); // Limit to 50 for performance
    }
    const filterValue = value.toLowerCase();
    return this.autocompleteOptions
      .filter(option => option.toLowerCase().includes(filterValue))
      .slice(0, 50);
  }

  /**
   * Called when user types in search input
   */
  onSearchInput(value: string): void {
    this.searchTerm = value;
    this.searchSubject.next(value);
    this.setupAutocompleteFilter();
  }

  /**
   * Called when autocomplete option is selected
   */
  onAutocompleteSelected(value: string): void {
    this.searchTerm = value;
    this.performSearch(value);
  }

  /**
   * Toggle filter section visibility
   */
  toggleFilters(): void {
    this.showFilters = !this.showFilters;
  }

  /**
   * Get list of enabled categories
   */
  getEnabledCategories(): SearchCategory[] {
    const enabled: SearchCategory[] = [];
    this.categoryFilters.forEach((isEnabled, category) => {
      if (isEnabled) {
        enabled.push(category);
      }
    });
    return enabled.length > 0 ? enabled : ['Service', 'Place', 'Name', 'Address', 'Region', 'Type'];
  }

  /**
   * Toggle a category filter
   */
  async toggleCategory(category: SearchCategory): Promise<void> {
    const currentValue = this.categoryFilters.get(category) || false;
    this.categoryFilters.set(category, !currentValue);
    
    // Reload autocomplete options
    await this.loadAutocompleteOptions();
    this.setupAutocompleteFilter();
    
    // Re-run search if already searched
    if (this.searchTerm && this.searchTerm.trim().length > 0) {
      this.performSearch(this.searchTerm);
    }
  }

  /**
   * Check if a category is enabled
   */
  isCategoryEnabled(category: SearchCategory): boolean {
    return this.categoryFilters.get(category) || false;
  }

  /**
   * Get count of enabled categories
   */
  getEnabledCount(): number {
    let count = 0;
    this.categoryFilters.forEach(isEnabled => {
      if (isEnabled) count++;
    });
    return count;
  }

  /**
   * Select all categories
   */
  async selectAllCategories(): Promise<void> {
    this.categoryFilters.forEach((_, category) => {
      this.categoryFilters.set(category, true);
    });
    await this.loadAutocompleteOptions();
    this.setupAutocompleteFilter();
    if (this.searchTerm && this.searchTerm.trim().length > 0) {
      this.performSearch(this.searchTerm);
    }
  }

  /**
   * Deselect all categories
   */
  async deselectAllCategories(): Promise<void> {
    this.categoryFilters.forEach((_, category) => {
      this.categoryFilters.set(category, false);
    });
    await this.loadAutocompleteOptions();
    this.setupAutocompleteFilter();
    if (this.searchTerm && this.searchTerm.trim().length > 0) {
      this.performSearch(this.searchTerm);
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
      this.searchResults = [];
      this.groupedResults = [];
      this.hasSearched = false;
      return;
    }

    this.isSearching = true;
    this.hasSearched = true;

    try {
      const enabledCategories = this.getEnabledCategories();
      this.searchResults = await this.searchService.searchMultipleCategories(term, enabledCategories);
      this.groupedResults = this.searchService.groupByMonth(this.searchResults);
    } catch (error) {
      console.error('Search error:', error);
      this.searchResults = [];
      this.groupedResults = [];
    } finally {
      this.isSearching = false;
    }
  }

  /**
   * Clear search and reset
   */
  clearSearch(): void {
    this.searchTerm = '';
    this.searchResults = [];
    this.groupedResults = [];
    this.hasSearched = false;
    this.expandedGroups.clear();
    this.expandedResults.clear();
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
   * Get categories as array for template iteration
   */
  getCategoriesArray(): SearchCategory[] {
    return Array.from(this.categoryFilters.keys());
  }

  /**
   * Toggle group expansion
   */
  toggleGroup(monthKey: string): void {
    if (this.expandedGroups.has(monthKey)) {
      this.expandedGroups.delete(monthKey);
    } else {
      this.expandedGroups.add(monthKey);
    }
  }

  /**
   * Check if group is expanded
   */
  isGroupExpanded(monthKey: string): boolean {
    return this.expandedGroups.has(monthKey);
  }

  /**
   * Toggle result expansion to show trips
   */
  toggleResult(resultKey: string): void {
    if (this.expandedResults.has(resultKey)) {
      this.expandedResults.delete(resultKey);
    } else {
      this.expandedResults.add(resultKey);
    }
  }

  /**
   * Check if result is expanded
   */
  isResultExpanded(resultKey: string): boolean {
    return this.expandedResults.has(resultKey);
  }

  /**
   * Get unique key for a result
   */
  getResultKey(result: ISearchResult, monthKey: string): string {
    return `${monthKey}-${result.type}-${result.value}`;
  }

  /**
   * Get total unique results count (not grouped)
   */
  getTotalResultsCount(): number {
    return this.searchResults.length;
  }

  /**
   * Get total trips across all results
   */
  getTotalTripsCount(): number {
    return this.searchResults.reduce((sum, result) => sum + result.totalTrips, 0);
  }

  /**
   * Get total earnings across all results
   */
  getTotalEarnings(): number {
    return this.searchResults.reduce((sum, result) => sum + result.totalEarnings, 0);
  }

  /**
   * Expand all groups
   */
  expandAll(): void {
    this.groupedResults.forEach(group => {
      this.expandedGroups.add(group.month);
    });
  }

  /**
   * Collapse all groups
   */
  collapseAll(): void {
    this.expandedGroups.clear();
    this.expandedResults.clear();
  }
}
