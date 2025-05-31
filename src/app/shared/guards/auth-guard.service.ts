import { Injectable, inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthGoogleService } from '../services/auth-google.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuardService {

    constructor(private authService: AuthGoogleService, private router: Router) {}

    async canActivate(): Promise<boolean> {
        const isAuthenticated = await this.authService.isAuthenticated();
        
        if (!isAuthenticated) {
            this.router.navigate(['setup']);
            return false;
        }

        return true;
    }
}

export const canActivateAuth: CanActivateFn = async (route, state) => {
    return await inject(AuthGuardService).canActivate();
};