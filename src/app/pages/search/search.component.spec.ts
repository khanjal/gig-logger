import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { SearchComponent } from './search.component';
import { SearchService } from '@services/search.service';
import { DropdownDataService } from '@services/dropdown-data.service';
import { LoggerService } from '@services/logger.service';
import { ViewportScroller } from '@angular/common';
import type { ISearchResult, ISearchResultGroup } from '@interfaces/search-result.interface';

describe('SearchComponent', () => {
  let component: SearchComponent;
  let fixture: ComponentFixture<SearchComponent>;
  let searchServiceSpy: jasmine.SpyObj<SearchService>;
  let dropdownDataSpy: jasmine.SpyObj<DropdownDataService>;
  let loggerSpy: jasmine.SpyObj<LoggerService>;
  let viewportSpy: jasmine.SpyObj<ViewportScroller>;

  beforeEach(async () => {
    searchServiceSpy = jasmine.createSpyObj('SearchService', ['searchMultipleCategories', 'groupByMonth', 'getCategoryColor', 'getCategoryBorderClass', 'getCategoryIcon']);
    searchServiceSpy.searchMultipleCategories.and.returnValue(Promise.resolve([]));
    searchServiceSpy.groupByMonth.and.returnValue([]);
    searchServiceSpy.getCategoryColor.and.returnValue('text-primary');
    searchServiceSpy.getCategoryBorderClass.and.returnValue('border-primary');
    searchServiceSpy.getCategoryIcon.and.returnValue('place');

    dropdownDataSpy = jasmine.createSpyObj('DropdownDataService', ['filterDropdown']);
    dropdownDataSpy.filterDropdown.and.returnValue(Promise.resolve([]));

    loggerSpy = jasmine.createSpyObj('LoggerService', ['error']);
    viewportSpy = jasmine.createSpyObj('ViewportScroller', ['scrollToPosition']);

    await TestBed.configureTestingModule({
      imports: [SearchComponent],
      providers: [
        { provide: SearchService, useValue: searchServiceSpy },
        { provide: DropdownDataService, useValue: dropdownDataSpy },
        { provide: LoggerService, useValue: loggerSpy },
        { provide: ViewportScroller, useValue: viewportSpy }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(SearchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('selectAllCategories enables every category', async () => {
    component.categoryFilters.set({
      All: false, Address: false, Name: false, Place: false, Region: false, Service: false, Type: false
    });

    await component.selectAllCategories();

    const filters = component.categoryFilters();
    const allEnabled = component.categories.every(cat => filters[cat] === true);
    expect(allEnabled).toBeTrue();
    expect(dropdownDataSpy.filterDropdown).toHaveBeenCalled();
  });

  it('deselectAllCategories disables every category', async () => {
    await component.deselectAllCategories();

    const anyEnabled = Object.values(component.categoryFilters()).some(v => v === true);
    expect(anyEnabled).toBeFalse();
  });

  it('onSearchInput hides filters and updates term', () => {
    component.showFilters.set(true);

    component.onSearchInput('ride');

    expect(component.showFilters()).toBeFalse();
    expect(component.searchTerm()).toBe('ride');
  });

  it('onExactMatchChange triggers search when term exists', async () => {
    const searchSpy = spyOn(component, 'performSearch').and.returnValue(Promise.resolve());
    component.searchTerm.set('uber');

    component.onExactMatchChange();

    expect(searchSpy).toHaveBeenCalledWith('uber');
  });

  it('onCaseSensitiveChange triggers search when term exists', async () => {
    const searchSpy = spyOn(component, 'performSearch').and.returnValue(Promise.resolve());
    component.searchTerm.set('lyft');

    component.onCaseSensitiveChange();

    expect(searchSpy).toHaveBeenCalledWith('lyft');
  });

  it('getEnabledCount reflects disabled state after deselectAll', async () => {
    await component.deselectAllCategories();

    expect(component.getEnabledCount()).toBe(0);
  });

  it('getFilteredAutocompleteOptions aggregates unique sorted values across enabled categories', async () => {
    dropdownDataSpy.filterDropdown.and.callFake((type: any, _value: string) => {
      if (type === 'Service') return Promise.resolve(['DoorDash', 'Uber Eats']);
      if (type === 'Type') return Promise.resolve(['Food Delivery', 'Uber Eats']);
      return Promise.resolve([]);
    });

    component.categoryFilters.set({
      All: false, Address: false, Name: false, Place: false, Region: false, Service: true, Type: true
    });

    const result = await (component as any).getFilteredAutocompleteOptions('u');

    expect(dropdownDataSpy.filterDropdown).toHaveBeenCalledWith('Service', 'u');
    expect(dropdownDataSpy.filterDropdown).toHaveBeenCalledWith('Type', 'u');
    expect(result).toEqual(['DoorDash', 'Food Delivery', 'Uber Eats']);
  });

  it('getFilteredAutocompleteOptions returns empty when no categories are enabled', async () => {
    component.categoryFilters.set({
      All: false, Address: false, Name: false, Place: false, Region: false, Service: false, Type: false
    });

    const result = await (component as any).getFilteredAutocompleteOptions('u');

    expect(result).toEqual([]);
  });

  describe('categoryMetadata', () => {
    it('is populated in constructor for each category', () => {
      const metadata = component.categoryMetadata;
      component.categories.forEach(category => {
        expect(metadata[category]).toBeDefined();
        expect(metadata[category].icon).toBeTruthy();
        expect(metadata[category].color).toBeTruthy();
        expect(metadata[category].borderClass).toBeTruthy();
      });
    });
  });

  describe('enabledCount', () => {
    it('returns 6 by default (all non-All categories enabled)', () => {
      expect(component.enabledCount()).toBe(6);
    });

    it('decreases when a category is disabled', () => {
      component.categoryFilters.set({
        All: false, Address: false, Name: true, Place: true, Region: true, Service: true, Type: true
      });
      expect(component.enabledCount()).toBe(5);
    });

    it('returns 0 after deselectAllCategories', async () => {
      await component.deselectAllCategories();
      expect(component.enabledCount()).toBe(0);
    });
  });

  describe('performSearch - precomputed metrics', () => {
    const makeResult = (value: string, tripId: number, total: number): ISearchResult => ({
      type: 'Service',
      value,
      trips: [{ id: tripId, total, exclude: false } as any],
      totalTrips: 1,
      totalEarnings: total
    });

    const makeGroup = (month: string, results: ISearchResult[]): ISearchResultGroup => ({
      month,
      year: month.split('-')[0],
      results,
      totalTrips: results.reduce((s, r) => s + r.totalTrips, 0),
      totalEarnings: results.reduce((s, r) => s + r.totalEarnings, 0)
    });

    it('sets totalResultsCount and totalTripsCount after successful search', async () => {
      const results: ISearchResult[] = [
        makeResult('Uber', 1, 20),
        makeResult('Lyft', 2, 30)
      ];
      const groups: ISearchResultGroup[] = [makeGroup('2024-01', results)];
      searchServiceSpy.searchMultipleCategories.and.returnValue(Promise.resolve(results));
      searchServiceSpy.groupByMonth.and.returnValue(groups);

      await component.performSearch('uber');

      expect(component.totalResultsCount()).toBe(2);
      expect(component.totalTripsCount()).toBe(2);
    });

    it('sets totalEarnings from unique trips', async () => {
      const results: ISearchResult[] = [makeResult('Uber', 5, 25)];
      const groups: ISearchResultGroup[] = [makeGroup('2024-01', results)];
      searchServiceSpy.searchMultipleCategories.and.returnValue(Promise.resolve(results));
      searchServiceSpy.groupByMonth.and.returnValue(groups);

      await component.performSearch('uber');

      expect(component.totalEarnings()).toBe(25);
    });

    it('resets derived metrics on empty term', async () => {
      component.totalResultsCount.set(5);
      component.totalEarnings.set(100);

      await component.performSearch('');

      expect(component.totalResultsCount()).toBe(0);
      expect(component.totalEarnings()).toBe(0);
    });

    it('resets derived metrics and sets error state on search failure', async () => {
      searchServiceSpy.searchMultipleCategories.and.returnValue(Promise.reject(new Error('fail')));
      component.totalResultsCount.set(5);

      await component.performSearch('error');

      expect(component.totalResultsCount()).toBe(0);
      expect(component.searchState.hasError()).toBeTrue();
    });

    it('marks search as completed after successful search', async () => {
      searchServiceSpy.searchMultipleCategories.and.returnValue(Promise.resolve([]));
      searchServiceSpy.groupByMonth.and.returnValue([]);

      await component.performSearch('test');

      expect(component.hasSearched()).toBeTrue();
    });
  });

  describe('clearSearch', () => {
    it('resets searchTerm and all derived metrics', async () => {
      const results: ISearchResult[] = [{
        type: 'Service', value: 'Uber',
        trips: [{ id: 1, total: 30, exclude: false } as any],
        totalTrips: 1, totalEarnings: 30
      }];
      searchServiceSpy.searchMultipleCategories.and.returnValue(Promise.resolve(results));
      searchServiceSpy.groupByMonth.and.returnValue([]);
      await component.performSearch('uber');

      component.clearSearch();

      expect(component.searchTerm()).toBe('');
      expect(component.totalResultsCount()).toBe(0);
      expect(component.totalTripsCount()).toBe(0);
      expect(component.totalEarnings()).toBe(0);
      expect(component.searchResults().length).toBe(0);
    });

    it('resets searchState', async () => {
      searchServiceSpy.searchMultipleCategories.and.returnValue(Promise.resolve([]));
      searchServiceSpy.groupByMonth.and.returnValue([]);
      await component.performSearch('test');

      component.clearSearch();

      expect(component.hasSearched()).toBeFalse();
      expect(component.isSearching()).toBeFalse();
    });
  });
});
