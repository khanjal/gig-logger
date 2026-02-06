import { Component, Input, forwardRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NG_VALUE_ACCESSOR, ControlValueAccessor } from '@angular/forms';
import { MatFormField, MatLabel, MatHint, MatError } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatIcon } from '@angular/material/icon';

@Component({
  selector: 'app-base-input',
  standalone: true,
  imports: [CommonModule, FormsModule, MatFormField, MatLabel, MatHint, MatError, MatInput, MatIcon],
  templateUrl: './base-input.component.html',
  styleUrl: './base-input.component.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => BaseInputComponent),
      multi: true
    }
  ]
})
export class BaseInputComponent implements ControlValueAccessor {
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
    this.value = newValue;
    this.onChange(newValue);
  }

  onBlur(): void {
    this.onTouched();
  }
}
