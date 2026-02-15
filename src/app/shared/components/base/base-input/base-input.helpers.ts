import { AbstractControl, FormControl } from '@angular/forms';
import { Subject, Subscription } from 'rxjs';

export function subscribeControlStatus(control: FormControl | AbstractControl | null | undefined, stateChanges: Subject<void>): Subscription | undefined {
  try {
    return (control as any)?.statusChanges?.subscribe(() => stateChanges.next());
  } catch {
    return undefined;
  }
}

export function firstErrorMessage(control: AbstractControl | null | undefined, requiredInput = false, touched = false, submitted = false, empty = false): string | null {
  if (control && control.errors) {
    const errors = control.errors;
    if (errors['required']) return 'This field is required';
    if (errors['min']) return 'Value is too small';
    if (errors['max']) return 'Value is too large';
    if (errors['minlength']) return 'Too short';
    if (errors['maxlength']) return 'Too long';
    try { return Object.keys(errors)[0]; } catch { return 'Invalid'; }
  }

  if (requiredInput && (touched || submitted) && empty) return 'This field is required';
  return null;
}

export function controlHasError(control: AbstractControl | null | undefined, errorCode: string | undefined, requiredInput: boolean, touched: boolean, submitted: boolean, empty: boolean): boolean {
  if (control) {
    if (errorCode) return !!(control.hasError(errorCode) && (touched || submitted));
    return !!(control.invalid && (touched || submitted));
  }

  if (errorCode === 'required') return !!(requiredInput && (touched || submitted) && empty);
  return !!(requiredInput && (touched || submitted) && empty);
}
