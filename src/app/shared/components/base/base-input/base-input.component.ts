import { Component, Input, forwardRef, ViewChild, Optional, Self } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NG_VALUE_ACCESSOR, ControlValueAccessor, NgControl } from '@angular/forms';
import { MatFormField, MatLabel, MatHint, MatError } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatIcon } from '@angular/material/icon';

@Component({
  selector: 'app-base-input',
  standalone: true,
  imports: [CommonModule, FormsModule, MatFormField, MatLabel, MatHint, MatError, MatInput, MatIcon],
  templateUrl: './base-input.component.html',
  styleUrl: './base-input.component.scss'
})
export class BaseInputComponent implements ControlValueAccessor {
/**
 * BaseInputComponent
 *
 * Reusable form input that implements `ControlValueAccessor` so it works with
 * both template-driven (`[(ngModel)]`) and reactive (`formControlName`) forms.
 *
 * Inputs:
 * - `label`, `placeholder`, `hint`, `error` : display text
 * - `type` : HTML input type (text, number, email, password, etc.)
 * - `icon`, `iconPosition` : optional Material icon and placement
 * - `disabled`, `required` : boolean flags (use property binding: `[disabled]="true"`)
 *
 * Example (Reactive form):
 * <mat-form-field appearance="outline">
 *   <mat-label>Amount</mat-label>
 *   <app-base-input formControlName="amount" [type]="'number'" [hint]="'USD'"></app-base-input>
 * </mat-form-field>
 *
 * Example (NgModel):
 * <app-base-input [(ngModel)]="value" label="Name"></app-base-input>
 */
  @ViewChild('inputElement') inputElement?: MatInput;

  /** Input label */
  @Input() label?: string;

  /** Input type (text, email, password, number, etc.) */
  @Input() type: string = 'text';

  /** Input placeholder */
  @Input() placeholder?: string;

  /** Helper/hint text */
  @Input() hint?: string;

  /** Error message */
  @Input() error?: string;

  /** Icon to display (Material icon name) */
  @Input() icon?: string;

  /** Icon position (left/right) */
  @Input() iconPosition: 'left' | 'right' = 'right';

  /** Disabled state */
  @Input() disabled = false;

  /** Required field indicator */
  @Input() required = false;

  /** Value */
  value: any;

  // ValueAccessor implementation
  onChange: (value: any) => void = () => {};
  onTouched: () => void = () => {};

  constructor(@Optional() @Self() public ngControl: NgControl) {
    if (this.ngControl) {
      this.ngControl.valueAccessor = this;
    }
  }

  writeValue(value: any): void {
    this.value = value;
  }

  registerOnChange(fn: (value: any) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  onValueChange(newValue: any): void {
    // Convert to number for number inputs
    if (this.type === 'number') {
      if (newValue === '' || newValue === null) {
        this.value = null;
      } else {
        const numValue = parseFloat(newValue);
        this.value = isNaN(numValue) ? null : numValue;
      }
    } else {
      this.value = newValue;
    }
    this.onChange(this.value);
  }

  onBlur(): void {
    this.onTouched();
    // Explicitly mark the control as touched to trigger validation display
    if (this.ngControl && this.ngControl.control) {
      this.ngControl.control.markAsTouched();
    }
  }

  hasError(errorCode?: string): boolean {
    if (!this.ngControl || !this.ngControl.control) return false;
    const control = this.ngControl.control;
    if (!control.touched) return false;
    if (errorCode) {
      return control.hasError(errorCode);
    }
    return control.invalid;
  }

  get isRequired(): boolean {
    // Return the @Input required value if explicitly set
    if (this.required) return true;
    
    // Otherwise, check if the control has a required validator
    try {
      const control = this.ngControl?.control;
      if (!control) return false;
      
      // Test if the control has a required validator by checking for required error
      // when the control is empty
      if (control.validator) {
        const errors = control.validator(control);
        return !!(errors && errors['required']);
      }
    } catch {
      // Silently fail and return false
    }
    
    return false;
  }
}
