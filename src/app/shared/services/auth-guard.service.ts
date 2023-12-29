import { Injectable, inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from './auth.service';

@Injectable()
export class AuthGuardService {

    constructor(private auth: AuthService, private _router: Router) {}

    canActivate(): boolean {
        if (!this.auth.isAuthenticated()) {
            this._router.navigate(['login']);
            return false;
        }

        return true;
    }
}

export const canActivateAuth: CanActivateFn = (route, state) => {
    return inject(AuthGuardService).canActivate();
};