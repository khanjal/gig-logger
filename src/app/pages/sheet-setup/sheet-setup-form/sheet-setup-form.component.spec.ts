import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SheetSetupFormComponent } from './sheet-setup-form.component';

describe('SheetSetupFormComponent', () => {
  let component: SheetSetupFormComponent;
  let fixture: ComponentFixture<SheetSetupFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SheetSetupFormComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SheetSetupFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
