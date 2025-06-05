import { Component } from '@angular/core';
import { NumberHelper } from '@helpers/number.helper';
import { LoggerService } from '@services/logger.service';

@Component({
    selector: 'app-sheet-quota',
    templateUrl: './sheet-quota.component.html',
    styleUrls: ['./sheet-quota.component.scss'],
    standalone: true
})
export class SheetQuotaComponent {

  quota: string | undefined;
  usage: string | undefined;

  constructor(private _logger: LoggerService) {}

  async ngOnInit(): Promise<void> {
    await this.showEstimatedQuota();
  }
  
  private async showEstimatedQuota() {
    if (navigator.storage && navigator.storage.estimate) {
        const estimation = await navigator.storage.estimate();
        this.quota = NumberHelper.getDataSize(estimation?.quota);
        this.usage = NumberHelper.getDataSize(estimation?.usage);
        
        return estimation;
    } else {
        this._logger.error("StorageManager not found");
    }

    return;
  }
}
