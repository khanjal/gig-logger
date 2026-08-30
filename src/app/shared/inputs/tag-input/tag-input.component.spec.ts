import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { of } from 'rxjs';

import { TagInputComponent } from './tag-input.component';

describe('TagInputComponent', () => {
  let fixture: ComponentFixture<TagInputComponent>;
  let component: TagInputComponent;
  let dialog: jasmine.SpyObj<MatDialog>;

  const dialogReturning = (result: string[] | undefined) =>
    dialog.open.and.returnValue({ afterClosed: () => of(result) } as never);

  beforeEach(async () => {
    dialog = jasmine.createSpyObj<MatDialog>('MatDialog', ['open']);

    await TestBed.configureTestingModule({
      imports: [TagInputComponent],
      providers: [provideNoopAnimations(), { provide: MatDialog, useValue: dialog }],
    }).compileComponents();

    fixture = TestBed.createComponent(TagInputComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('writes an array value straight through', () => {
    component.writeValue(['rain', 'surge']);

    expect(component.tags()).toEqual(['rain', 'surge']);
  });

  it('accepts raw comma-delimited text', () => {
    // A control bound before deserialization has run should still render something sensible.
    component.writeValue('rain, surge' as never);

    expect(component.tags()).toEqual(['rain', 'surge']);
  });

  it('treats null or undefined as no tags', () => {
    component.writeValue(null);
    expect(component.tags()).toEqual([]);

    component.writeValue(undefined);
    expect(component.tags()).toEqual([]);
  });

  it('applies the dialog result and notifies the form', () => {
    const changes: string[][] = [];
    component.registerOnChange(value => changes.push(value));
    dialogReturning(['rain', 'surge']);

    component.openDialog();

    expect(component.tags()).toEqual(['rain', 'surge']);
    expect(changes).toEqual([['rain', 'surge']]);
  });

  it('leaves tags untouched when the dialog is cancelled', () => {
    component.writeValue(['rain']);
    const changes: string[][] = [];
    component.registerOnChange(value => changes.push(value));
    dialogReturning(undefined);

    component.openDialog();

    expect(component.tags()).toEqual(['rain']);
    expect(changes).toEqual([]);
  });

  it('writes through an empty result, which is a deliberate clear', () => {
    // Distinct from cancelling: removing every tag must reach the form, not be ignored as "no
    // change" the way an undefined result is.
    component.writeValue(['rain']);
    const changes: string[][] = [];
    component.registerOnChange(value => changes.push(value));
    dialogReturning([]);

    component.openDialog();

    expect(component.tags()).toEqual([]);
    expect(changes).toEqual([[]]);
  });

  it('marks the control touched once the dialog closes', () => {
    let touched = false;
    component.registerOnTouched(() => (touched = true));
    dialogReturning(undefined);

    component.openDialog();

    expect(touched).toBeTrue();
  });

  it('does not open the dialog while disabled', () => {
    component.setDisabledState(true);

    component.openDialog();

    expect(dialog.open).not.toHaveBeenCalled();
  });
});
