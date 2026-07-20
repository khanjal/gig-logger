import type { ComponentFixture} from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { commonTestingImports, commonTestingProviders } from '@test-harness';
import { CustomRangePanelComponent } from './custom-range-panel.component';
import { MAT_DATE_LOCALE } from '@angular/material/core';
import { MatDateRangePicker } from '@angular/material/datepicker';

describe('CustomRangePanelComponent', () => {
  let component: CustomRangePanelComponent<Date>;
  let fixture: ComponentFixture<CustomRangePanelComponent<Date>>;
  const mockDateRangePicker = jasmine.createSpyObj('MatDateRangePicker', ['select', 'close']);

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [...commonTestingImports, CustomRangePanelComponent],
      providers: [
        ...commonTestingProviders,
        { provide: MAT_DATE_LOCALE, useValue: 'en-US' },
        { provide: MatDateRangePicker, useValue: mockDateRangePicker }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CustomRangePanelComponent<Date>);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
