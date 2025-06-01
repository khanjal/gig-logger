import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SheetLinkComponent } from './sheet-link.component';

describe('SheetLinkComponent', () => {
  let component: SheetLinkComponent;
  let fixture: ComponentFixture<SheetLinkComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SheetLinkComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SheetLinkComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
