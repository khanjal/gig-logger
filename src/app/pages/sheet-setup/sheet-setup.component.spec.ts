import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SheetSetupComponent } from './sheet-setup.component';

describe('SheetSetupComponent', () => {
  let component: SheetSetupComponent;
  let fixture: ComponentFixture<SheetSetupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SheetSetupComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SheetSetupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
