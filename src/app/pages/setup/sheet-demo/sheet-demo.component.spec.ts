import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SheetDemoComponent } from './sheet-demo.component';

describe('SheetDemoComponent', () => {
  let component: SheetDemoComponent;
  let fixture: ComponentFixture<SheetDemoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SheetDemoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SheetDemoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
