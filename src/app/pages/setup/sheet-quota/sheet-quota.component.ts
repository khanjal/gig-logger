import type { OnInit} from '@angular/core';
import { Component, signal, inject } from '@angular/core';
import { NumberHelper } from '@helpers/number.helper';
import { LoggerService } from '@services/logger.service';

@Component({
    selector: 'app-sheet-quota',
    templateUrl: './sheet-quota.component.html',
    standalone: true
})
export class SheetQuotaComponent implements OnInit {
  private _logger = inject(LoggerService);


  public quota = signal<string | undefined>(undefined);
  public usage = signal<string | undefined>(undefined);

  public async ngOnInit(): Promise<void> {
    await this.showEstimatedQuota();
  }
  
  private async showEstimatedQuota() {
    if (navigator.storage && navigator.storage.estimate) {
        const estimation = await navigator.storage.estimate();
        this.quota.set(NumberHelper.getDataSize(estimation?.quota));
        this.usage.set(NumberHelper.getDataSize(estimation?.usage));
        
        return estimation;
    } else {
        this._logger.error("StorageManager not found");
    }

    return;
  }
}
