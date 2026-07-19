import { Component, Input, forwardRef } from '@angular/core';
import type { ControlValueAccessor} from '@angular/forms';
import { NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';
import { MatFormField, MatLabel, MatHint, MatError, MatSuffix } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import type { MatDatepickerInputEvent } from '@angular/material/datepicker';
import { MatDatepicker, MatDatepickerModule } from '@angular/material/datepicker';
import { MatDatepickerToggle } from '@angular/material/datepicker';

@Component({
  selector: 'app-base-datepicker',
  standalone: true,
  imports: [
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
  @Input() public label?: string;

  /** Input placeholder */
  @Input() public placeholder?: string;

  /** Helper/hint text */
  @Input() public hint?: string;

  /** Error message */
  @Input() public error?: string;

  /** Tailwind width class (e.g., 'w-full', 'w-1/2', 'w-[250px]') */
  @Input() public widthClass = 'w-full';

  /** Disabled state */
  @Input() public disabled = false;

  /** Required field indicator */
  @Input() public required = false;

  /** Value */
  public value: Date | null = null;

  // ValueAccessor implementation
  public onChange: (value: Date | null) => void = () => {};
  public onTouched: () => void = () => {};

  public writeValue(value: Date | null): void {
    this.value = value;
  }

  public registerOnChange(fn: (value: Date | null) => void): void {
    this.onChange = fn;
  }

  public registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  public setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  public onDateChange(event: MatDatepickerInputEvent<Date>): void {
    this.value = event.value;
    this.onChange(this.value);
  }

  public onBlur(): void {
    this.onTouched();
  }
}
