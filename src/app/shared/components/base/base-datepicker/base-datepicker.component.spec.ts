import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BaseDatepickerComponent } from './base-datepicker.component';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatNativeDateModule } from '@angular/material/core';

describe('BaseDatepickerComponent', () => {
  let component: BaseDatepickerComponent;
  let fixture: ComponentFixture<BaseDatepickerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        BaseDatepickerComponent,
        NoopAnimationsModule,
        MatNativeDateModule
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(BaseDatepickerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default widthClass', () => {
    expect(component.widthClass).toBe('w-full');
  });

  it('should accept custom widthClass', () => {
    component.widthClass = 'w-1/2 min-w-[120px]';
    expect(component.widthClass).toBe('w-1/2 min-w-[120px]');
  });

  it('should implement ControlValueAccessor', () => {
    const testDate = new Date('2026-02-07');
    component.writeValue(testDate);
    expect(component.value).toEqual(testDate);
  });

  it('should register onChange callback', () => {
    const onChangeSpy = jasmine.createSpy('onChange');
    component.registerOnChange(onChangeSpy);
    
    const testDate = new Date('2026-02-07');
    component.onDateChange({ value: testDate });
    
    expect(onChangeSpy).toHaveBeenCalledWith(testDate);
  });

  it('should register onTouched callback', () => {
    const onTouchedSpy = jasmine.createSpy('onTouched');
    component.registerOnTouched(onTouchedSpy);
    
    component.onBlur();
    
    expect(onTouchedSpy).toHaveBeenCalled();
  });

  it('should set disabled state', () => {
    component.setDisabledState(true);
    expect(component.disabled).toBe(true);
    
    component.setDisabledState(false);
    expect(component.disabled).toBe(false);
  });
});
