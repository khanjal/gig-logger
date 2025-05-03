import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UberCalculatorComponent } from './uber-calculator.component';

describe('UberCalculatorComponent', () => {
  let component: UberCalculatorComponent;
  let fixture: ComponentFixture<UberCalculatorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
    imports: [UberCalculatorComponent]
})
    .compileComponents();

    fixture = TestBed.createComponent(UberCalculatorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
