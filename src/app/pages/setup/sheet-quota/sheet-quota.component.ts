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

  async ngOnInit(): Promise<void> {
    await this.showEstimatedQuota();
  }
  
  private async showEstimatedQuota() {
    if (navigator.storage && navigator.storage.estimate) {
        const estimation = await navigator.storage.estimate();
        this.quota = NumberHelper.getDataSize(estimation?.quota);
        this.usage = NumberHelper.getDataSize(estimation?.usage);
        
        // console.log("Quota", this.quota);
        // console.log("Usage", this.usage);

        return estimation;
    } else {
        console.error("StorageManager not found");
    }

    return;
}
}
