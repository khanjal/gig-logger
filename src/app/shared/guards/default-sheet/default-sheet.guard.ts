import { Injectable, inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SpreadsheetService } from '@services/spreadsheet.service';

@Injectable({
  providedIn: 'root'
})
export class DefaultSheetGuard {
  private _sheetService = inject(SpreadsheetService);
  private _router = inject(Router);


  async canActivate() {

    if (!(await this.isDefaultSheet())) {
      this._router.navigate(['setup']);
      return false;
    }

    return true;
  }

    private async isDefaultSheet(): Promise<boolean> {
        const sheet = await this._sheetService.getDefaultSheet();

        if (sheet) {
            return true;
        }

        return false;
    }

  
}

export const canActivateSheet: CanActivateFn = () => {
    return inject(DefaultSheetGuard).canActivate();
};
