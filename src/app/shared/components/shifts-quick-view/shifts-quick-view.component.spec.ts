import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ShiftsQuickViewComponent } from './shifts-quick-view.component';

describe('ShiftsQuickViewComponent', () => {
  let component: ShiftsQuickViewComponent;
  let fixture: ComponentFixture<ShiftsQuickViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ShiftsQuickViewComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ShiftsQuickViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
