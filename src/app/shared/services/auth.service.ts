import { Injectable, inject } from '@angular/core';
import { JwtHelperService } from '@auth0/angular-jwt';
import { LoggerService } from './logger.service';
import { SESSION_CONSTANTS } from '@constants/session.constants';

@Injectable()
export class AuthService {
    jwtHelper = inject(JwtHelperService);
    private _logger = inject(LoggerService);


    public isAuthenticated(): boolean {
        const token = sessionStorage.getItem(SESSION_CONSTANTS.AUTH_TOKEN);

        if (!token) {
            return false;
        }
        else {
            // Check whether the token is expired and return
            // true or false
            const isTokenExpired = this.jwtHelper.isTokenExpired(token);
            this._logger.debug('Token expiration status', { isTokenExpired });

            if (isTokenExpired) {
                // Refresh token
            }
            
            return !isTokenExpired;
        }
    }
}