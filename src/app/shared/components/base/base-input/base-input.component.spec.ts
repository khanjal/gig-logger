import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BaseInputComponent } from './base-input.component';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { FormsModule } from '@angular/forms';

describe('BaseInputComponent', () => {
  let component: BaseInputComponent;
  let fixture: ComponentFixture<BaseInputComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BaseInputComponent, FormsModule],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(BaseInputComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Input Properties', () => {
    it('should have text type by default', () => {
      expect(component.type).toBe('text');
    });

    it('should accept custom type', () => {
      component.type = 'email';
      expect(component.type).toBe('email');
    });

    it('should not be required by default', () => {
      expect(component.required).toBe(false);
    });

    it('should not be disabled by default', () => {
      expect(component.disabled).toBe(false);
    });
  });

  describe('ControlValueAccessor Implementation', () => {
    it('should write value', () => {
      component.writeValue('test value');
      expect(component.value).toBe('test value');
    });

    it('should register onChange callback', () => {
      const onChangeFn = jasmine.createSpy('onChange');
      component.registerOnChange(onChangeFn);
      component.onValueChange('new value');
      expect(onChangeFn).toHaveBeenCalledWith('new value');
    });

    it('should register onTouched callback', () => {
      const onTouchedFn = jasmine.createSpy('onTouched');
      component.registerOnTouched(onTouchedFn);
      component.onBlur();
      expect(onTouchedFn).toHaveBeenCalled();
    });

    it('should set disabled state', () => {
      component.setDisabledState(true);
      expect(component.disabled).toBe(true);
      
      component.setDisabledState(false);
      expect(component.disabled).toBe(false);
    });
  });

  describe('Value Changes', () => {
    it('should update value and call onChange when value changes', () => {
      const onChangeSpy = jasmine.createSpy('onChange');
      component.registerOnChange(onChangeSpy);
      
      component.onValueChange('new value');
      
      expect(component.value).toBe('new value');
      expect(onChangeSpy).toHaveBeenCalledWith('new value');
    });
  });

  describe('Icon Display', () => {
    it('should display icon when provided', () => {
      component.icon = 'email';
      component.iconPosition = 'right';
      fixture.detectChanges();
      expect(component.icon).toBe('email');
      expect(component.iconPosition).toBe('right');
    });

    it('should have right icon position by default', () => {
      expect(component.iconPosition).toBe('right');
    });
  });

  describe('Error and Hint Display', () => {
    it('should display hint text when provided', () => {
      component.hint = 'This is a hint';
      fixture.detectChanges();
      expect(component.hint).toBe('This is a hint');
    });

    it('should display error message when provided', () => {
      component.error = 'This is an error';
      fixture.detectChanges();
      expect(component.error).toBe('This is an error');
    });
  });
});
