import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { OAuthService } from 'angular-oauth2-oidc';
import { authConfig } from './auth.config';
import { GigLoggerService } from './gig-logger.service';
import { LoggerService } from './logger.service'; // Adjusted path to match the correct location

@Injectable({
  providedIn: 'root',
})
export class AuthGoogleService {
  profile: any = null; // Replace 'any' with a proper type if available

  constructor(
    private oAuthService: OAuthService,
    private router: Router,
    private gigLoggerService: GigLoggerService,
    private logger: LoggerService // Injecting a logger service
  ) {
    this.initConfiguration();
  }

  private async initConfiguration() {
    try {
      this.logger.info('Initializing OAuth configuration', authConfig);
      this.oAuthService.configure(authConfig);
      this.oAuthService.setupAutomaticSilentRefresh();

      const loggedIn = await this.oAuthService.loadDiscoveryDocumentAndTryLogin();
      if (loggedIn && this.oAuthService.hasValidIdToken()) {
        this.handleSuccessfulLogin();
      }
    } catch (error) {
      this.logger.error('Error during OAuth configuration or login', error);
    }
  }

  private async handleSuccessfulLogin() {
    try {
      const token = this.oAuthService.getAccessToken();
      const claims = this.oAuthService.getIdentityClaims();

      this.logger.info('User claims retrieved', claims);
      this.profile = claims;

      await this.gigLoggerService.setRefreshToken(token);
    } catch (error) {
      this.logger.error('Error handling successful login', error);
    }
  }

  login() {
    this.logger.info('Initiating login flow');
    this.oAuthService.initImplicitFlow(undefined, { prompt: 'consent' });
  }

  logout() {
    try {
      this.oAuthService.revokeTokenAndLogout();
      this.oAuthService.logOut();
      this.profile = null;
      this.logger.info('User logged out successfully');
    } catch (error) {
      this.logger.error('Error during logout', error);
    }
  }

  getProfile() {
    return this.profile;
  }
}
