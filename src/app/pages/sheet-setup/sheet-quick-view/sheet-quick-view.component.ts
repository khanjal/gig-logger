import { Component, Input } from '@angular/core';
import { ISpreadsheet } from '@interfaces/spreadsheet.interface';

@Component({
  selector: 'app-sheet-quick-view',
  templateUrl: './sheet-quick-view.component.html',
  styleUrls: ['./sheet-quick-view.component.scss']
})
export class SheetQuickViewComponent {
  @Input() spreadsheet!: ISpreadsheet;
}
