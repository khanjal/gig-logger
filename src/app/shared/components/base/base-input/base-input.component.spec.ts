import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { BaseInputComponent } from './base-input.component';

@Component({
  template: `
    <form [formGroup]="form" (ngSubmit)="onSubmit()">
      <mat-form-field>
        <app-base-input formControlName="name" label="Name"></app-base-input>
      </mat-form-field>
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
      imports: [ReactiveFormsModule, MatFormFieldModule, MatInputModule, NoopAnimationsModule, BaseInputComponent],
      declarations: [HostComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
  });

  it('shows required error after control is touched', async () => {
    const baseDbg = fixture.debugElement.query(By.directive(BaseInputComponent));
    const inputDbg = baseDbg.query(By.css('input'));
    inputDbg.nativeElement.dispatchEvent(new Event('blur'));
    fixture.detectChanges();

    const dbg = fixture.debugElement.query(By.directive(BaseInputComponent));
    const comp = dbg.componentInstance as BaseInputComponent;
    expect(comp.hasError()).toBeTrue();
    expect(comp.getErrorMessage()).toContain('required');
  });

  it('shows required error after form submit', async () => {
    const formEl = fixture.debugElement.query(By.css('form')).nativeElement as HTMLFormElement;
    formEl.dispatchEvent(new Event('submit'));
    fixture.detectChanges();
    const dbg = fixture.debugElement.query(By.directive(BaseInputComponent));
    const comp = dbg.componentInstance as BaseInputComponent;
    expect(comp.hasError()).toBeTrue();
    expect(comp.getErrorMessage()).toContain('required');
  });
});

