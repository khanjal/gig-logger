import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SheetSetupTableComponent } from './sheet-setup-table.component';

describe('SheetSetupTableComponent', () => {
  let component: SheetSetupTableComponent;
  let fixture: ComponentFixture<SheetSetupTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SheetSetupTableComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SheetSetupTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
