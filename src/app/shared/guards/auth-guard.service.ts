import { Injectable, inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthGoogleService } from '../services/auth-google.service';
import { SpreadsheetService } from '@services/spreadsheet.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuardService {

    constructor(private authService: AuthGoogleService, private router: Router, private _sheetService: SpreadsheetService) {}

    async canActivate(): Promise<boolean> {
        const isAuthenticated = await this.authService.canSync();

        if (isAuthenticated) {
            return true;
        }

        // Allow access to routes when the user is not authenticated but already
        // has an attached spreadsheet. In that case the app should operate in
        // local-only mode (no remote sync) so navigation is permitted.
        try {
            const sheets = await this._sheetService.getSpreadsheets();
            const hasSheets = !!(sheets && sheets.length > 0);
            if (hasSheets) {
                return true;
            }
        } catch (e) {
            // If the spreadsheet service fails, fall back to redirecting to setup
            this.router.navigate(['setup']);
            return false;
        }

        this.router.navigate(['setup']);
        return false;
    }
}

export const canActivateAuth: CanActivateFn = async (route, state) => {
    return await inject(AuthGuardService).canActivate();
};