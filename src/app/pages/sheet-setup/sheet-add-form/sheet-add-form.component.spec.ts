import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SheetAddFormComponent } from './sheet-add-form.component';

describe('SheetSetupFormComponent', () => {
  let component: SheetAddFormComponent;
  let fixture: ComponentFixture<SheetAddFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SheetAddFormComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SheetAddFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
