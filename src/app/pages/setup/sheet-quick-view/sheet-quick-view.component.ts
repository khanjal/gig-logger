import { Component, Input, OnInit } from '@angular/core';
import { NumberHelper } from '@helpers/number.helper';
import { ISpreadsheet } from '@interfaces/spreadsheet.interface';
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
export class SheetQuickViewComponent implements OnInit {
  @Input() spreadsheet!: ISpreadsheet;
  size: string | undefined;
  async ngOnInit() {
    this.size = NumberHelper.getDataSize(this.spreadsheet.size);
  }
}
