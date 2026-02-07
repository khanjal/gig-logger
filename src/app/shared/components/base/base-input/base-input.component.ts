import { Component, Input, forwardRef, ViewChild, Optional, Self, HostBinding, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, NG_VALUE_ACCESSOR, ControlValueAccessor, NgControl, FormControl, FormGroupDirective } from '@angular/forms';
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
  /** MatFormFieldControl state changes */
  stateChanges = new Subject<void>();
  /** Unique id for the control */
  @HostBinding() id = `app-base-input-${BaseInputComponent.nextId++}`;
  static nextId = 0;
  /** Control type used by form-field */
  controlType = 'app-base-input';
  private _focused = false;
  get focused(): boolean { return this._focused; }
  /** Whether the control is disabled */
  @Input() get disabled(): boolean {
    return this._disabled;
  }
  set disabled(v: boolean) {
    this._disabled = v;
    this.stateChanges.next();
  }
  private _disabled = false;

  /** Input label */
  @Input() label?: string;

  /** Input type (text, email, password, number, etc.) */
  @Input() type: string = 'text';

  /** Input placeholder */
  @Input() placeholder: string = '';

  /** Helper/hint text */
  @Input() hint?: string;

  /** Error message */
  @Input() error?: string;

  /** Icon to display (Material icon name) */
  @Input() icon?: string;

  /** Icon position (left/right) */
  @Input() iconPosition: 'left' | 'right' = 'right';


  /** Required field indicator */
  @Input() required = false;

  /** Value */
  private _value: any;
  get value(): any { return this._value; }
  set value(val: any) {
    this._value = val;
    this.stateChanges.next();
  }
  // Local touched tracking for non-reactive usage fallback
  private _touched = false;

  // ValueAccessor implementation
  onChange: (value: any) => void = () => {};
  onTouched: () => void = () => {};

  private _statusSub?: Subscription;

  constructor(@Optional() @Self() public ngControl: NgControl, @Optional() private parentForm?: FormGroupDirective) {
    if (this.ngControl) {
      this.ngControl.valueAccessor = this;
      // subscribe to status changes so the form-field updates when validity changes
      this._statusSub = subscribeControlStatus(this.ngControl.control as FormControl, this.stateChanges);
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
    this._focused = false;
    this._touched = true;
    this.stateChanges.next();
  }

  onFocus(): void {
    this._focused = true;
    this.stateChanges.next();
  }

  hasError(errorCode?: string): boolean {
    const control = this.ngControl?.control;
    const submitted = !!this.parentForm?.submitted;
    const touched = !!control?.touched;
    return controlHasError(control, errorCode, this.required, touched || this._touched, submitted, this.empty);
  }

  // MatFormFieldControl methods
  get empty(): boolean {
    return this.value === null || this.value === undefined || this.value === '';
  }

  get shouldLabelFloat(): boolean {
    return !this.empty;
  }

  setDescribedByIds(ids: string[]): void {
    // noop for now
  }

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

    // Fallback: if no reactive control, consider required + touched + empty
    return !!(this.required && (this._touched || submitted) && this.empty);
  }

  ngOnDestroy(): void {
    this._statusSub?.unsubscribe();
    this.stateChanges.complete();
  }

  /** Return a short validation message based on the control's first error */
  getErrorMessage(): string | null {
    return firstErrorMessage(this.ngControl?.control, this.required, !!this._touched, !!this.parentForm?.submitted, this.empty);
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
