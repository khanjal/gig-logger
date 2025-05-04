// import { SocialAuthService } from '@abacritt/angularx-social-login';
import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root'
  })
export class LoginService {
    providerId = "1037406003641-06neo4a41bh84equ3tafo5dgl2ftvopm.apps.googleusercontent.com";

    constructor(
        // private socialAuthService: SocialAuthService
        ) {}

    public async refreshToken() {
        // console.log(await this.socialAuthService.refreshAuthToken(this.providerId));
    }
}