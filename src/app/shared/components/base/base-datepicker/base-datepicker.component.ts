import { Component, Input, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NG_VALUE_ACCESSOR, ControlValueAccessor, ReactiveFormsModule } from '@angular/forms';
import { MatFormField, MatLabel, MatHint, MatError, MatSuffix } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatDatepicker, MatDatepickerModule } from '@angular/material/datepicker';
import { MatDatepickerToggle } from '@angular/material/datepicker';

@Component({
  selector: 'app-base-datepicker',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormField,
    MatLabel,
    MatHint,
    MatError,
    MatInput,
    MatSuffix,
    MatDatepickerModule,
    MatDatepicker,
    MatDatepickerToggle
  ],
  templateUrl: './base-datepicker.component.html',
  styleUrl: './base-datepicker.component.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => BaseDatepickerComponent),
      multi: true
    }
  ]
})
export class BaseDatepickerComponent implements ControlValueAccessor {
  /**
   * BaseDatepickerComponent
   *
   * Reusable date picker that implements `ControlValueAccessor` so it works with
   * both template-driven (`[(ngModel)]`) and reactive (`formControlName`) forms.
   *
   * Inputs:
   * - `label`, `placeholder`, `hint`, `error` : display text
   * - `widthClass` : Tailwind width class (e.g., 'w-full', 'w-1/2 min-w-[120px]')
   * - `disabled`, `required` : boolean flags (use property binding: `[disabled]="true"`)
   *
   * Example (Reactive form):
   * <app-base-datepicker 
   *   formControlName="date" 
   *   label="Date"
   *   widthClass="w-full col-span-2">
   * </app-base-datepicker>
   *
   * Example (NgModel):
   * <app-base-datepicker [(ngModel)]="selectedDate" label="Date"></app-base-datepicker>
   */

  /** Input label */
  @Input() label?: string;

  /** Input placeholder */
  @Input() placeholder?: string;

  /** Helper/hint text */
  @Input() hint?: string;

  /** Error message */
  @Input() error?: string;

  /** Tailwind width class (e.g., 'w-full', 'w-1/2', 'w-[250px]') */
  @Input() widthClass: string = 'w-full';

  /** Disabled state */
  @Input() disabled = false;

  /** Required field indicator */
  @Input() required = false;

  /** Value */
  value: Date | null = null;

  // ValueAccessor implementation
  onChange: (value: Date | null) => void = () => {};
  onTouched: () => void = () => {};

  writeValue(value: Date | null): void {
    this.value = value;
  }

  registerOnChange(fn: (value: Date | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  onDateChange(event: any): void {
    this.value = event.value;
    this.onChange(this.value);
  }

  onBlur(): void {
    this.onTouched();
  }
}
