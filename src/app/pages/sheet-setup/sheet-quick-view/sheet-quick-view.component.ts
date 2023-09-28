import { Component, Input, OnInit } from '@angular/core';
import { NumberHelper } from '@helpers/number.helper';
import { ISpreadsheet } from '@interfaces/spreadsheet.interface';

@Component({
  selector: 'app-sheet-quick-view',
  templateUrl: './sheet-quick-view.component.html',
  styleUrls: ['./sheet-quick-view.component.scss']
})
export class SheetQuickViewComponent implements OnInit {
  @Input() spreadsheet!: ISpreadsheet;
  size: string | undefined;
  percent: number = 0;

  async ngOnInit() {
    this.percent = (this.spreadsheet.size/6000000) * 100;
    console.log(this.percent);
    this.size = NumberHelper.getDataSize(this.spreadsheet.size);
  }
}
