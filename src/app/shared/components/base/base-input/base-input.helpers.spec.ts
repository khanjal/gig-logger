import { FormControl, AbstractControl } from '@angular/forms';
import { Subject } from 'rxjs';
import { subscribeControlStatus, firstErrorMessage, controlHasError } from './base-input.helpers';

describe('base-input.helpers', () => {
  it('subscribeControlStatus subscribes to statusChanges and emits stateChanges', () => {
    const control = new FormControl('');
    const state = new Subject<void>();
    spyOn(state, 'next');

    const sub = subscribeControlStatus(control, state as any);
    control.setValue('x');
    control.updateValueAndValidity();

    expect((state as any).next).toHaveBeenCalled();
    if (sub) sub.unsubscribe();
  });

  it('firstErrorMessage returns friendly messages for known errors and required fallback', () => {
    const control = new FormControl('');
    control.setErrors({ required: true });
    expect(firstErrorMessage(control)).toBe('This field is required');

    control.setErrors({ min: true });
    expect(firstErrorMessage(control)).toBe('Value is too small');

    control.setErrors({ maxlength: true });
    expect(firstErrorMessage(control)).toBe('Too long');

    // unknown error returns the key
    control.setErrors({ someCustomError: true } as any);
    expect(firstErrorMessage(control)).toBe('someCustomError');

    // fallback for required input when control missing
    expect(firstErrorMessage(null, true, true, false, true)).toBe('This field is required');
  });

  it('controlHasError handles control present and missing control cases', () => {
    const control = new FormControl('');
    control.setErrors({ minlength: true });

    // with explicit error code
    expect(controlHasError(control as AbstractControl, 'minlength', false, true, false, false)).toBeTrue();

    // invalid without specific code
    expect(controlHasError(control as AbstractControl, undefined, false, true, false, false)).toBeTrue();

    // missing control with required check
    expect(controlHasError(null, 'required', true, true, false, true)).toBeTrue();
    expect(controlHasError(null, undefined, true, true, false, true)).toBeTrue();
  });
});
