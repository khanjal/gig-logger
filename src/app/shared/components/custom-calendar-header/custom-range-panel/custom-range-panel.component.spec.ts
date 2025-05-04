import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomRangePanelComponent } from './custom-range-panel.component';
import { DateAdapter } from '@angular/material/core';
import { MatDateRangePicker } from '@angular/material/datepicker';

describe('CustomRangePanelComponent', () => {
  let component: CustomRangePanelComponent<any>;
  let fixture: ComponentFixture<CustomRangePanelComponent<any>>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
    imports: [CustomRangePanelComponent],
    providers: [DateAdapter, MatDateRangePicker]
})
    .compileComponents();

    fixture = TestBed.createComponent(CustomRangePanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
