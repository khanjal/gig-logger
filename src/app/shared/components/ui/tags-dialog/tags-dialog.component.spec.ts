import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { TagsDialogComponent } from './tags-dialog.component';
import { TagService } from '@services/tag.service';

describe('TagsDialogComponent', () => {
  let fixture: ComponentFixture<TagsDialogComponent>;
  let component: TagsDialogComponent;
  let dialogRef: jasmine.SpyObj<MatDialogRef<TagsDialogComponent>>;
  let tagService: jasmine.SpyObj<TagService>;

  const build = async (tags: string[]) => {
    dialogRef = jasmine.createSpyObj<MatDialogRef<TagsDialogComponent>>('MatDialogRef', ['close']);
    tagService = jasmine.createSpyObj<TagService>('TagService', ['suggest', 'getAllTags']);
    tagService.suggest.and.resolveTo([]);
    tagService.getAllTags.and.resolveTo([]);

    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [TagsDialogComponent],
      providers: [
        provideNoopAnimations(),
        { provide: MatDialogRef, useValue: dialogRef },
        { provide: MAT_DIALOG_DATA, useValue: { tags } },
        { provide: TagService, useValue: tagService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TagsDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  };

  beforeEach(async () => await build([]));

  it('starts from the tags it was given', async () => {
    await build(['rain', 'surge']);

    expect(component.tags()).toEqual(['rain', 'surge']);
  });

  it('does not mutate the caller’s array', async () => {
    const original = ['rain'];
    await build(original);

    await component.add('surge');

    expect(original).toEqual(['rain']);
  });

  it('adds a typed tag', async () => {
    await component.add('rain');

    expect(component.tags()).toEqual(['rain']);
  });

  it('strips commas rather than accepting them', async () => {
    // The sheet stores tags comma-delimited, so a tag containing one would corrupt the column.
    // The user is never asked to type commas, and typing one anyway must not break storage.
    await component.add('rain, surge');

    expect(component.tags()).toEqual(['rain surge']);
  });

  it('collapses whitespace and ignores an empty entry', async () => {
    await component.add('  wet   roads  ');
    await component.add('   ');

    expect(component.tags()).toEqual(['wet roads']);
  });

  it('does not add the same tag twice, regardless of casing', async () => {
    await component.add('rain');
    await component.add('Rain');

    expect(component.tags()).toEqual(['rain']);
  });

  it('removes a tag', async () => {
    await build(['rain', 'surge']);

    await component.remove('rain');

    expect(component.tags()).toEqual(['surge']);
  });

  it('excludes already-added tags from suggestions', async () => {
    await build(['rain']);

    await component.onInput('r');

    expect(tagService.suggest).toHaveBeenCalledWith('r', ['rain']);
  });

  it('closes with the edited list on Done', async () => {
    await component.add('rain');

    component.onDone();

    expect(dialogRef.close).toHaveBeenCalledWith(['rain']);
  });

  it('commits whatever is still typed when Done is pressed', async () => {
    // Otherwise a tag typed but not confirmed is silently lost, which looks like a bug.
    component.inputControl.setValue('surge');

    component.onDone();

    expect(dialogRef.close).toHaveBeenCalledWith(['surge']);
  });

  it('closes with undefined on Cancel', async () => {
    await build(['rain']);

    component.onCancel();

    expect(dialogRef.close).toHaveBeenCalledWith(undefined);
  });

  it('renders each tag as its own row with a remove button', async () => {
    // A list rather than chips: a chip's × is roughly a 16px target, well under what a thumb hits
    // reliably, and this dialog is used one-handed on a phone.
    await build(['rain', 'surge']);

    const rows = (fixture.nativeElement as HTMLElement).querySelectorAll('.tags-dialog__row');
    expect(rows.length).toBe(2);

    rows.forEach(row => {
      expect(row.querySelector('.tags-dialog__remove')).withContext('row has a remove button').not.toBeNull();
    });
  });

  it('removes the tag whose row button is pressed', async () => {
    await build(['rain', 'surge']);

    const firstRemove = (fixture.nativeElement as HTMLElement)
      .querySelector('.tags-dialog__row .tags-dialog__remove') as HTMLButtonElement;
    firstRemove.click();
    fixture.detectChanges();

    expect(component.tags()).toEqual(['surge']);
  });

  it('keeps the list alphabetical as tags are added', async () => {
    // A newly added tag jumping to the bottom until the dialog reopened would be the one place
    // the ordering did not hold.
    await build(['rain']);

    await component.add('airport');
    await component.add('surge');

    expect(component.tags()).toEqual(['airport', 'rain', 'surge']);
  });

  it('disables Add until something is typed', async () => {
    // The button is the primary way in on a phone, so it must not look pressable when it would
    // do nothing.
    const addButton = () =>
      (fixture.nativeElement as HTMLElement).querySelector('.tags-dialog__add button') as HTMLButtonElement | null;

    fixture.detectChanges();
    expect(addButton()?.disabled).toBeTrue();

    component.inputControl.setValue('rain');
    fixture.detectChanges();
    expect(addButton()?.disabled).toBeFalse();
  });

  it('closes with an empty array when every tag is removed', async () => {
    // Distinct from cancelling - the caller must write this through rather than ignore it.
    await build(['rain']);

    await component.remove('rain');
    component.onDone();

    expect(dialogRef.close).toHaveBeenCalledWith([]);
  });
});
