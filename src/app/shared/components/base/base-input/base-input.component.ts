import { Component, Input, Optional, Self } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, ControlValueAccessor, NgControl, FormGroupDirective } from '@angular/forms';
import { MatFormField, MatLabel, MatHint, MatError } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatIcon } from '@angular/material/icon';

import { firstErrorMessage, controlHasError } from './base-input.helpers';

@Component({
  selector: 'app-base-input',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MatFormField, MatLabel, MatHint, MatError, MatInput, MatIcon],
  templateUrl: './base-input.component.html',
  styleUrl: './base-input.component.scss'
})
export class BaseInputComponent implements ControlValueAccessor {

  private _disabled = false;
  @Input() get disabled(): boolean { return this._disabled; }
  set disabled(v: boolean) {
    this._disabled = v;
  }

  // --- visual inputs ---
  @Input() label?: string;
  @Input() type: string = 'text';
  @Input() placeholder: string = '';
  @Input() hint?: string;
  @Input() error?: string;
  @Input() icon?: string;
  @Input() iconPosition: 'left' | 'right' = 'right';
  @Input() required = false;

  // --- value / touched tracking ---
  private _value: string | number | null = null;
  get value(): string | number | null { return this._value; }
  set value(val: string | number | null) { this._value = val; }
  private _touched = false;

  // --- ControlValueAccessor callbacks ---
  onChange: (value: string | number | null) => void = () => {};
  onTouched: () => void = () => {};

  /**
   * Reusable form input implementing ControlValueAccessor.
   * Works with template-driven and reactive forms.
   */
  constructor(@Optional() @Self() public ngControl: NgControl, @Optional() private parentForm?: FormGroupDirective) {
    if (this.ngControl) {
      this.ngControl.valueAccessor = this;
    }
  }

  // --- ControlValueAccessor ---
  writeValue(value: string | number | null): void { this.value = value; }
  registerOnChange(fn: (value: string | number | null) => void): void { this.onChange = fn; }
  registerOnTouched(fn: () => void): void { this.onTouched = fn; }
  setDisabledState(isDisabled: boolean): void { this.disabled = isDisabled; }

  onValueChange(newValue: string): void {
    if (this.type === 'number') {
      if (newValue === '') {
        this.value = null;
      } else {
        // Keep the raw input text while typing so caret position is preserved.
        // Parsing on every keypress can rewrite the value (e.g. "12.50" -> 12.5)
        // and cause the cursor to jump.
        this.value = newValue;
      }
    } else {
      this.value = newValue;
    }
    this.onChange(this.value);
  }

  onBlur(): void {
    if (this.type === 'number') {
      const rawValue = typeof this.value === 'string' ? this.value.trim() : this.value;

      if (rawValue === '') {
        this.value = null;
      } else if (typeof rawValue === 'string') {
        const parsed = parseFloat(rawValue);
        this.value = isNaN(parsed) ? null : parsed;
      }

      this.onChange(this.value);
    }

    this.onTouched();
    if (this.ngControl && this.ngControl.control) {
      this.ngControl.control.markAsTouched();
    }
    this._touched = true;
  }

  // --- validation helpers / public API ---
  hasError(errorCode?: string): boolean {
    const control = this.ngControl?.control;
    const submitted = !!this.parentForm?.submitted;
    const touched = !!control?.touched;
    return controlHasError(control, errorCode, this.required, touched || this._touched, submitted, this.empty);
  }

  getErrorMessage(): string | null {
    return firstErrorMessage(this.ngControl?.control, this.required, !!this._touched, !!this.parentForm?.submitted, this.empty);
  }

  get isRequired(): boolean {
    if (this.required) return true;
    try {
      const control = this.ngControl?.control;
      if (!control) return false;
      if (control.validator) {
        const errors = control.validator(control);
        return !!(errors && errors['required']);
      }
    } catch {
      // ignore
    }
    return false;
  }

  // --- derived state used by validation helpers ---
  get empty(): boolean { return this.value === null || this.value === undefined || this.value === ''; }

  get errorState(): boolean {
    const control = this.ngControl?.control;
    const submitted = !!this.parentForm?.submitted;
    if (control) {
      const invalid = control.invalid;
      const touched = control.touched;
      return !!(invalid && (touched || submitted));
    }
    return !!(this.required && (this._touched || submitted) && this.empty);
  }
}
