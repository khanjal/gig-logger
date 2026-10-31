import { Component, computed, input } from '@angular/core';
import { NumberHelper } from '@helpers/number.helper';
import type { ISpreadsheet } from '@interfaces/sheets/spreadsheet.interface';
import { MatCard, MatCardHeader, MatCardContent } from '@angular/material/card';
import { MatIcon } from '@angular/material/icon';
import { TruncatePipe } from "@pipes/truncate.pipe";
import { SheetSourceLabelPipe } from '@pipes/sheet-source-label.pipe';

@Component({
    selector: 'app-sheet-quick-view',
    templateUrl: './sheet-quick-view.component.html',
    styleUrls: ['./sheet-quick-view.component.scss'],
    standalone: true,
    imports: [MatCard, MatCardHeader, MatIcon, MatCardContent, TruncatePipe, SheetSourceLabelPipe]
})
export class SheetQuickViewComponent {
  public readonly spreadsheet = input.required<ISpreadsheet>();

  /**
   * Derived rather than computed once in ngOnInit. The setup page lists these with
   * `@for (... track spreadsheet.id)`, so a refreshed list reuses this component instance and only
   * updates the input - ngOnInit never runs again. Size was left showing whatever it read the first
   * time, which is 0 for a sheet linked before its data had been fetched.
   */
  public readonly size = computed(() => NumberHelper.getDataSize(this.spreadsheet().size));
}
