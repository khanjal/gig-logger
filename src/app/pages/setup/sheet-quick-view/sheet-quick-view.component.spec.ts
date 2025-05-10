import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SheetQuickViewComponent } from './sheet-quick-view.component';

describe('SheetQuickViewComponent', () => {
  let component: SheetQuickViewComponent;
  let fixture: ComponentFixture<SheetQuickViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
    imports: [SheetQuickViewComponent]
})
    .compileComponents();

    fixture = TestBed.createComponent(SheetQuickViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
