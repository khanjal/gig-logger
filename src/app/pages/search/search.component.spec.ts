import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { SearchComponent } from './search.component';
import { SearchService } from '@services/search.service';
import { LoggerService } from '@services/logger.service';
import { ViewportScroller } from '@angular/common';

describe('SearchComponent', () => {
  let component: SearchComponent;
  let fixture: ComponentFixture<SearchComponent>;
  let searchServiceSpy: jasmine.SpyObj<SearchService>;
  let loggerSpy: jasmine.SpyObj<LoggerService>;
  let viewportSpy: jasmine.SpyObj<ViewportScroller>;

  beforeEach(async () => {
    searchServiceSpy = jasmine.createSpyObj('SearchService', ['getAutocompleteOptions', 'searchMultipleCategories', 'groupByMonth', 'getCategoryColor', 'getCategoryIcon']);
    searchServiceSpy.getAutocompleteOptions.and.returnValue(Promise.resolve(['Alpha', 'Beta']));
    searchServiceSpy.searchMultipleCategories.and.returnValue(Promise.resolve([]));
    searchServiceSpy.groupByMonth.and.returnValue([]);
    searchServiceSpy.getCategoryColor.and.returnValue('text-blue-600');
    searchServiceSpy.getCategoryIcon.and.returnValue('place');

    loggerSpy = jasmine.createSpyObj('LoggerService', ['error']);
    viewportSpy = jasmine.createSpyObj('ViewportScroller', ['scrollToPosition']);

    await TestBed.configureTestingModule({
      imports: [SearchComponent],
      providers: [
        { provide: SearchService, useValue: searchServiceSpy },
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
    component.categoryFilters.forEach((_, key) => component.categoryFilters.set(key, false));

    await component.selectAllCategories();

    const allEnabled = Array.from(component.categoryFilters.values()).every(v => v === true);
    expect(allEnabled).toBeTrue();
    expect(searchServiceSpy.getAutocompleteOptions).toHaveBeenCalled();
  });

  it('deselectAllCategories disables every category', async () => {
    await component.deselectAllCategories();

    const anyEnabled = Array.from(component.categoryFilters.values()).some(v => v === true);
    expect(anyEnabled).toBeFalse();
  });

  it('onSearchInput hides filters and updates term', () => {
    component.showFilters = true;

    component.onSearchInput('ride');

    expect(component.showFilters).toBeFalse();
    expect(component.searchTerm).toBe('ride');
  });

  it('onExactMatchChange triggers search when term exists', async () => {
    const searchSpy = spyOn(component, 'performSearch').and.returnValue(Promise.resolve());
    component.searchTerm = 'uber';

    component.onExactMatchChange();

    expect(searchSpy).toHaveBeenCalledWith('uber');
  });

  it('onCaseSensitiveChange triggers search when term exists', async () => {
    const searchSpy = spyOn(component, 'performSearch').and.returnValue(Promise.resolve());
    component.searchTerm = 'lyft';

    component.onCaseSensitiveChange();

    expect(searchSpy).toHaveBeenCalledWith('lyft');
  });

  it('getEnabledCount reflects disabled state after deselectAll', async () => {
    await component.deselectAllCategories();

    expect(component.getEnabledCount()).toBe(0);
  });
});
