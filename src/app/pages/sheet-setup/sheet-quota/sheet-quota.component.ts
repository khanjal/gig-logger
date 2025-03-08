import { Component } from '@angular/core';
import { SpreadsheetService } from '@services/spreadsheet.service';
import { NumberHelper } from '@helpers/number.helper';

@Component({
    selector: 'app-sheet-quota',
    templateUrl: './sheet-quota.component.html',
    styleUrls: ['./sheet-quota.component.scss'],
    standalone: true
})
export class SheetQuotaComponent {

  quota: string | undefined;
  usage: string | undefined;

  constructor(
    private _spreadsheetService: SpreadsheetService,
  ) { }

  async ngOnInit(): Promise<void> {
    let estimation = await this._spreadsheetService.showEstimatedQuota();
    this.quota = NumberHelper.getDataSize(estimation?.quota);
    this.usage = NumberHelper.getDataSize(estimation?.usage);
  }
}
