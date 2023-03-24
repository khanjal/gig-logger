import { Injectable } from '@angular/core';
import { JwtHelperService } from '@auth0/angular-jwt';

@Injectable()
export class AuthService {
    constructor(public jwtHelper: JwtHelperService) {}

    public isAuthenticated(): boolean {
        const token = sessionStorage.getItem('token');
        // console.log(token);

        if (!token) {
            return false;
        }
        else {
            // Check whether the token is expired and return
            // true or false
            // let decoded = this.jwtHelper.decodeToken(token);
            // console.log(decoded);
            return !this.jwtHelper.isTokenExpired(token);
        }
    }
}