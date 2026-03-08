import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroupDirective } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { BaseInputComponent } from './base-input.component';

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, BaseInputComponent],
  template: `
    <form [formGroup]="form" (ngSubmit)="onSubmit()">
      <app-base-input formControlName="name" label="Name"></app-base-input>
      <button type="submit">Submit</button>
    </form>
  `
})
class HostComponent {
  form = this.fb.group({ name: ['', Validators.required] });
  submitted = false;
  constructor(private fb: FormBuilder) {}
  onSubmit() { this.submitted = true; }
}

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, BaseInputComponent],
  template: `
    <form [formGroup]="form">
      <app-base-input formControlName="amount" label="Amount" type="number"></app-base-input>
    </form>
  `
})
class NumberHostComponent {
  form = this.fb.group({ amount: [null as number | string | null] });
  constructor(private fb: FormBuilder) {}
}

describe('BaseInputComponent (integration)', () => {
  let fixture: ComponentFixture<HostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent, NoopAnimationsModule]
    }).compileComponents();

    fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
  });

  it('shows required error after control is touched', async () => {
    // Programmatically mark the control as touched (simulates user blur)
    const control = fixture.componentInstance.form.get('name')!;
    control.markAsTouched();
    control.updateValueAndValidity();
    fixture.detectChanges();
    await fixture.whenStable();

    const dbg = fixture.debugElement.query(By.css('app-base-input'));
    const comp = dbg.componentInstance as BaseInputComponent;
    fixture.detectChanges();

    expect(comp.hasError()).toBeTrue();
    expect(comp.getErrorMessage()).toContain('required');
  });

  it('shows required error after form submit', async () => {
    // Mark the parent FormGroupDirective as submitted so the control shows errors
    const formDbg = fixture.debugElement.query(By.css('form'));
    try {
      const fg = formDbg.injector.get<FormGroupDirective>(FormGroupDirective);
      (fg as any).submitted = true;
    } catch {
      // ignore if FormGroupDirective not available in this test harness
    }

    fixture.detectChanges();
    await fixture.whenStable();
    const dbg = fixture.debugElement.query(By.css('app-base-input'));
    const comp = dbg.componentInstance as BaseInputComponent;
    fixture.detectChanges();
    expect(comp.hasError()).toBeTrue();
    expect(comp.getErrorMessage()).toContain('required');
  });
});

describe('BaseInputComponent (number input behavior)', () => {
  let fixture: ComponentFixture<NumberHostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NumberHostComponent, NoopAnimationsModule]
    }).compileComponents();

    fixture = TestBed.createComponent(NumberHostComponent);
    fixture.detectChanges();
  });

  it('keeps raw decimal text while typing', () => {
    const dbg = fixture.debugElement.query(By.css('app-base-input'));
    const comp = dbg.componentInstance as BaseInputComponent;

    comp.onValueChange('12.50');

    expect(comp.value).toBe('12.50');
    expect(fixture.componentInstance.form.get('amount')?.value).toBe('12.50');
  });

  it('normalizes numeric text to a number on blur', () => {
    const dbg = fixture.debugElement.query(By.css('app-base-input'));
    const comp = dbg.componentInstance as BaseInputComponent;

    comp.onValueChange('12.50');
    comp.onBlur();

    expect(comp.value).toBe(12.5);
    expect(fixture.componentInstance.form.get('amount')?.value).toBe(12.5);
  });

  it('does not reparse while deleting decimal characters', () => {
    const dbg = fixture.debugElement.query(By.css('app-base-input'));
    const comp = dbg.componentInstance as BaseInputComponent;

    comp.onValueChange('12.50');
    comp.onValueChange('1250');

    expect(comp.value).toBe('1250');
    expect(fixture.componentInstance.form.get('amount')?.value).toBe('1250');
  });

  it('shows clear button for number input when value exists', () => {
    const dbg = fixture.debugElement.query(By.css('app-base-input'));
    const comp = dbg.componentInstance as BaseInputComponent;

    comp.onValueChange('12.50');
    fixture.detectChanges();

    expect(comp.showClearButton).toBeTrue();
    expect(dbg.query(By.css('app-base-field-button.standard-button'))).toBeTruthy();
  });

  it('clears number value when clear action is used', () => {
    const dbg = fixture.debugElement.query(By.css('app-base-input'));
    const comp = dbg.componentInstance as BaseInputComponent;

    comp.onValueChange('12.50');
    comp.onClear();

    expect(comp.value).toBeNull();
    expect(fixture.componentInstance.form.get('amount')?.value).toBeNull();
    expect(comp.showClearButton).toBeFalse();
  });
});

