import { Component, Input, forwardRef, ViewChild, Optional, Self, HostBinding, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, ControlValueAccessor, NgControl, FormControl, FormGroupDirective } from '@angular/forms';
import { MatFormField, MatLabel, MatHint, MatError, MatFormFieldControl } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatIcon } from '@angular/material/icon';
import { Subject, Subscription } from 'rxjs';

import { subscribeControlStatus, firstErrorMessage, controlHasError } from './base-input.helpers';

@Component({
  selector: 'app-base-input',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MatFormField, MatLabel, MatHint, MatError, MatInput, MatIcon],
  templateUrl: './base-input.component.html',
  styleUrl: './base-input.component.scss',
  providers: [
    { provide: MatFormFieldControl, useExisting: forwardRef(() => BaseInputComponent) }
  ]
})
export class BaseInputComponent implements ControlValueAccessor, MatFormFieldControl<any>, OnDestroy {
  // --- static / id ---
  static nextId = 0;
  @HostBinding() id = `app-base-input-${BaseInputComponent.nextId++}`;

  // --- ViewChild / state ---
  @ViewChild('inputElement') inputElement?: MatInput;
  stateChanges = new Subject<void>();

  // --- public descriptor used by MatFormField ---
  controlType = 'app-base-input';

  // --- focus/disabled state ---
  private _focused = false;
  get focused(): boolean { return this._focused; }

  private _disabled = false;
  @Input() get disabled(): boolean { return this._disabled; }
  set disabled(v: boolean) {
    this._disabled = v;
    this.stateChanges.next();
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
  private _value: any;
  get value(): any { return this._value; }
  set value(val: any) { this._value = val; this.stateChanges.next(); }
  private _touched = false;

  // --- ControlValueAccessor callbacks ---
  onChange: (value: any) => void = () => {};
  onTouched: () => void = () => {};

  private _statusSub?: Subscription;

  /**
   * Reusable form input implementing ControlValueAccessor + MatFormFieldControl.
   * Works with template-driven and reactive forms.
   */
  constructor(@Optional() @Self() public ngControl: NgControl, @Optional() private parentForm?: FormGroupDirective) {
    if (this.ngControl) {
      this.ngControl.valueAccessor = this;
      this._statusSub = subscribeControlStatus(this.ngControl.control as FormControl, this.stateChanges);
    }
  }

  // --- ControlValueAccessor ---
  writeValue(value: any): void { this.value = value; }
  registerOnChange(fn: (value: any) => void): void { this.onChange = fn; }
  registerOnTouched(fn: () => void): void { this.onTouched = fn; }
  setDisabledState(isDisabled: boolean): void { this.disabled = isDisabled; }

  onValueChange(newValue: any): void {
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
    if (this.ngControl && this.ngControl.control) {
      this.ngControl.control.markAsTouched();
    }
    this._focused = false;
    this._touched = true;
    this.stateChanges.next();
  }

  onFocus(): void { this._focused = true; this.stateChanges.next(); }

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

  // --- MatFormFieldControl implementation ---
  get empty(): boolean { return this.value === null || this.value === undefined || this.value === ''; }
  get shouldLabelFloat(): boolean { return !this.empty; }

  setDescribedByIds(ids: string[]): void { /* noop */ }

  onContainerClick(event: MouseEvent): void {
    try { (this.inputElement as any)?.focus(); } catch {}
  }

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

  // --- lifecycle ---
  ngOnDestroy(): void { this._statusSub?.unsubscribe(); this.stateChanges.complete(); }
}
