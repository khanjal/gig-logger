import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomRangePanelComponent } from './custom-range-panel.component';

describe('CustomRangePanelComponent', () => {
  let component: CustomRangePanelComponent;
  let fixture: ComponentFixture<CustomRangePanelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CustomRangePanelComponent ]
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
