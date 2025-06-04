import { Component, Input, OnInit } from '@angular/core';
import { NumberHelper } from '@helpers/number.helper';
import { ISpreadsheet } from '@interfaces/spreadsheet.interface';
import { MatCard, MatCardHeader, MatCardContent } from '@angular/material/card';
import { MatIcon } from '@angular/material/icon';
import { MatProgressBar } from '@angular/material/progress-bar';
import { TruncatePipe } from "@pipes/truncate.pipe";

@Component({
    selector: 'app-sheet-quick-view',
    templateUrl: './sheet-quick-view.component.html',
    styleUrls: ['./sheet-quick-view.component.scss'],
    standalone: true,
    imports: [MatCard, MatCardHeader, MatIcon, MatCardContent, MatProgressBar, TruncatePipe]
})
export class SheetQuickViewComponent implements OnInit {
  @Input() spreadsheet!: ISpreadsheet;
  size: string | undefined;
  percent: number = 0;

  async ngOnInit() {
    this.percent = (this.spreadsheet.size/6000000) * 100;
    // console.log(this.percent);
    this.size = NumberHelper.getDataSize(this.spreadsheet.size);
  }
}
