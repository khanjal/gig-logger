import { CommonModule } from '@angular/common';
import { Component, Input, forwardRef, inject, signal } from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';

import { BaseRectButtonComponent } from '@components/base/base-rect-button/base-rect-button.component';
import { TagsDialogComponent } from '@components/ui/tags-dialog/tags-dialog.component';
import { TAG_INPUT } from '@constants/tag.constants';
import type { ITagsDialog } from '@interfaces/ui/tags-dialog.interface';

/**
 * Shows a trip or shift's tags, and opens a dialog to edit them.
 *
 * Displays rather than accepts input: tags are a list, and a single-line field reads as "one
 * value, then save" - the wrong expectation. The dialog makes the list and its multiplicity
 * obvious, and keeps this row looking like every other row in the form.
 */
@Component({
  selector: 'app-tag-input',
  standalone: true,
  imports: [CommonModule, MatIconModule, BaseRectButtonComponent],
  templateUrl: './tag-input.component.html',
  styleUrl: './tag-input.component.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => TagInputComponent),
      multi: true,
    },
  ],
})
export class TagInputComponent {
  private _dialog = inject(MatDialog);

  @Input() public fieldName = TAG_INPUT.DEFAULT_LABEL;

  public readonly tags = signal<string[]>([]);
  public readonly disabled = signal(false);

  private _onChange: (value: string[]) => void = () => undefined;
  private _onTouched: () => void = () => undefined;

  // #region ControlValueAccessor
  public writeValue(value: string[] | string | null | undefined): void {
    // Tolerates the raw sheet string as well as the array, so a control bound before
    // deserialization has run still renders something sensible rather than throwing.
    this.tags.set(Array.isArray(value) ? [...value] : this.splitRaw(value));
  }

  public registerOnChange(fn: (value: string[]) => void): void {
    this._onChange = fn;
  }

  public registerOnTouched(fn: () => void): void {
    this._onTouched = fn;
  }

  public setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }
  // #endregion

  public openDialog(): void {
    if (this.disabled()) {
      return;
    }

    this._dialog
      .open<TagsDialogComponent, ITagsDialog, string[] | undefined>(TagsDialogComponent, {
        data: { tags: this.tags() },
        autoFocus: true,
        // The shared panel class every other dialog uses. It themes .mdc-dialog__surface with
        // --color-surface / --color-text-primary and clips the rounded corners, which is what was
        // missing: hand-rolling a themed wrapper inside an unthemed container left white corners
        // in dark mode and a black title.
        panelClass: 'custom-modalbox',
        // A fixed width, as every other dialog here passes. `custom-modalbox` sets
        // `max-width: calc(100vw - 2rem) !important`, which beats a maxWidth given in config - so
        // asking for 92vw and capping it did not work, and the dialog spanned the whole desktop.
        // Giving a fixed width instead lets that same rule clamp it on a phone.
        width: '420px',
      })
      .afterClosed()
      .subscribe(result => {
        this._onTouched();

        // undefined means cancelled - leave the existing tags untouched. An empty array is a
        // deliberate "remove them all" and must be written through.
        if (result === undefined) {
          return;
        }

        this.tags.set(result);
        this._onChange(result);
      });
  }

  private splitRaw(value: string | null | undefined): string[] {
    if (typeof value !== 'string') {
      return [];
    }

    return value.split(TAG_INPUT.SEPARATOR).map(tag => tag.trim()).filter(tag => tag.length > 0);
  }
}
