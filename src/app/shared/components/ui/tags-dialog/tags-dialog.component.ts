import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import type { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';

import { BaseRectButtonComponent } from '@components/base/base-rect-button/base-rect-button.component';
import { TAG_INPUT } from '@constants/tag.constants';
import type { ITagsDialog } from '@interfaces/ui/tags-dialog.interface';
import { TagService } from '@services/tag.service';

/**
 * Adds and removes tags on a trip or shift.
 *
 * A dialog rather than an inline field because tags are a list: a single-line input reads as
 * "one value, then save", which is the wrong expectation. Here the list is visible, each entry is
 * removable, and adding several in a row is the obvious thing to do.
 *
 * Commas never appear in the UI. The sheet stores tags comma-delimited, but that is our encoding,
 * not something a user should have to type - and a tag containing a comma would corrupt the
 * column, so one is stripped rather than accepted.
 */
@Component({
  selector: 'app-tags-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatAutocompleteModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    BaseRectButtonComponent,
  ],
  templateUrl: './tags-dialog.component.html',
  styleUrl: './tags-dialog.component.scss',
})
export class TagsDialogComponent {
  public dialogRef = inject<MatDialogRef<TagsDialogComponent, string[] | undefined>>(MatDialogRef);
  public data = inject<ITagsDialog>(MAT_DIALOG_DATA);
  private _tagService = inject(TagService);

  public readonly tags = signal<string[]>([]);
  public readonly suggestions = signal<string[]>([]);
  public readonly inputControl = new FormControl('');
  public readonly placeholder = TAG_INPUT.PLACEHOLDER;

  constructor() {
    this.tags.set([...(this.data?.tags ?? [])]
      .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' })));
    void this.refreshSuggestions('');
  }

  public async add(raw: string | null | undefined): Promise<void> {
    if (this.commit(raw)) {
      this.inputControl.setValue('');
    }

    await this.refreshSuggestions('');
  }

  public async selected(event: MatAutocompleteSelectedEvent): Promise<void> {
    await this.add(event.option.viewValue);
  }

  public async remove(tag: string): Promise<void> {
    this.tags.update(current => current.filter(existing => existing !== tag));
    await this.refreshSuggestions(this.inputControl.value ?? '');
  }

  public async onInput(value: string): Promise<void> {
    await this.refreshSuggestions(value);
  }

  public onCancel(): void {
    this.dialogRef.close(undefined);
  }

  /** Commits whatever is still in the box, so a typed tag is not lost by pressing Done. */
  public onDone(): void {
    this.commit(this.inputControl.value);
    this.dialogRef.close(this.tags());
  }

  private commit(raw: string | null | undefined): boolean {
    // Strip commas rather than splitting on them: the user is not being asked to think in
    // commas, and a tag containing one would break the sheet's delimited storage.
    const value = (raw ?? '').replace(TAG_INPUT.SEPARATOR, ' ').trim().replace(/\s+/g, ' ');

    if (value.length === 0) {
      return false;
    }

    if (this.tags().some(tag => tag.toLowerCase() === value.toLowerCase())) {
      return true; // Already present - clear the box rather than leaving a duplicate sitting there.
    }

    // Insert in order rather than appending: the list is alphabetical everywhere else, and a tag
    // that jumps to the bottom until the dialog is reopened would be the one place it is not.
    this.tags.update(current =>
      [...current, value].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' })));

    return true;
  }

  private async refreshSuggestions(query: string): Promise<void> {
    this.suggestions.set(await this._tagService.suggest(query, this.tags()));
  }
}
