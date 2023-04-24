import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { SpreadsheetService } from '@services/spreadsheet.service';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DefaultSheetGuard {
  
  constructor(private _sheetService: SpreadsheetService, private _router: Router) {}

  async canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Promise<Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree> {

    if (!(await this.isDefaultSheet())) {
      this._router.navigate(['setup']);
      return false;
    }

    return true;
  }

  private async isDefaultSheet(): Promise<boolean> {
    let sheet = await this._sheetService.getDefaultSheet();

    if (sheet) {
        return true;
    }

    return false;
}
  
}
