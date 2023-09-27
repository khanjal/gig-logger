import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SheetQuotaComponent } from './sheet-quota.component';

describe('SheetQuotaComponent', () => {
  let component: SheetQuotaComponent;
  let fixture: ComponentFixture<SheetQuotaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SheetQuotaComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SheetQuotaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
