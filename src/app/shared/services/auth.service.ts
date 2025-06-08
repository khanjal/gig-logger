import { Injectable } from '@angular/core';
import { JwtHelperService } from '@auth0/angular-jwt';
import { LoggerService } from './logger.service';

@Injectable()
export class AuthService {
    constructor(
        public jwtHelper: JwtHelperService,
        private _logger: LoggerService
    ) {}

    public isAuthenticated(): boolean {
        const token = sessionStorage.getItem('token');

        if (!token) {
            return false;
        }
        else {
            // Check whether the token is expired and return
            // true or false
            let isTokenExpired = this.jwtHelper.isTokenExpired(token);
            this._logger.debug('Token expiration status', { isTokenExpired });

            if (isTokenExpired) {
                // Refresh token
            }
            
            return !isTokenExpired;
        }
    }
}