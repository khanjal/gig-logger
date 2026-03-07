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

