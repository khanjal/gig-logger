import { Injectable, inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthGoogleService } from '../services/auth-google.service';
import { SpreadsheetService } from '@services/spreadsheet.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuardService {

    constructor(private authService: AuthGoogleService, private router: Router, private _sheetService: SpreadsheetService) {}

    /**
     * Route guard flow:
     * 1. If the user can sync remotely (`canSync()`), allow navigation.
     * 2. Otherwise, permit navigation when local spreadsheets exist so the
     *    app can operate in local-only mode.
     * 3. If neither condition is met, redirect to the setup page.
     */
    async canActivate(): Promise<boolean> {
        const isAuthenticated = await this.authService.canSync();

        if (isAuthenticated) {
            return true;
        }

        // If not authenticated, allow navigation when local spreadsheets exist.
        try {
            const hasLocal = await this.hasLocalSpreadsheets();
            if (hasLocal) {
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

    private async hasLocalSpreadsheets(): Promise<boolean> {
        const sheets = await this._sheetService.getSpreadsheets();
        return !!(sheets && sheets.length > 0);
    }
}

export const canActivateAuth: CanActivateFn = async (route, state) => {
    return await inject(AuthGuardService).canActivate();
};