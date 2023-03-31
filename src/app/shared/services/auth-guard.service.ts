import { Injectable } from '@angular/core';
import { Router, CanActivate } from '@angular/router';
import { AuthService } from './auth.service';

@Injectable()
export class AuthGuardService implements CanActivate {

    constructor(public auth: AuthService, private _router: Router) {}

    canActivate(): boolean {
        if (!this.auth.isAuthenticated()) {
            this._router.navigate(['login']);
            return false;
        }

        return true;
        }
}