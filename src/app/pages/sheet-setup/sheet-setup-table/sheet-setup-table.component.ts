import { Component, Input } from '@angular/core';
import { ISpreadsheet } from '@interfaces/spreadsheet.interface';

@Component({
  selector: 'app-sheet-setup-table',
  templateUrl: './sheet-setup-table.component.html',
  styleUrls: ['./sheet-setup-table.component.scss']
})
export class SheetSetupTableComponent {
  @Input() spreadsheet!: ISpreadsheet;
}
