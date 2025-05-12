import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { OAuthService } from 'angular-oauth2-oidc';
import { BehaviorSubject } from 'rxjs';
import { authConfig } from './auth.config';
import { GigLoggerService } from './gig-logger.service';
import { LoggerService } from './logger.service';
import { SecureCookieStorageService } from './secure-cookie-storage.service';
import { UserProfile } from '../interfaces/user-profile.interface';

@Injectable({
  providedIn: 'root',
})
export class AuthGoogleService {
  private profile$ = new BehaviorSubject<UserProfile | null>(null);
  private isInitialized = false;

  constructor(
    private oAuthService: OAuthService,
    private logger: LoggerService,
    private secureCookieStorage: SecureCookieStorageService
  ) {
    this.oAuthService.setStorage(this.secureCookieStorage);
    this.initConfiguration().catch(error => {
      this.logger.error('Failed to initialize auth configuration', error);
    });
  }

  private async initConfiguration(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      this.logger.info('Initializing OAuth configuration');
      this.oAuthService.configure(authConfig);
      this.oAuthService.setupAutomaticSilentRefresh();

      const loggedIn = await this.oAuthService.loadDiscoveryDocumentAndTryLogin();
      this.logger.debug('Auth state', {
        loggedIn,
        hasValidAccessToken: this.oAuthService.hasValidAccessToken(),
        hasValidIdToken: this.oAuthService.hasValidIdToken()
      });

      if (loggedIn && this.oAuthService.hasValidIdToken()) {
        this.logger.info('User is logged in with valid tokens');
        await this.handleSuccessfulLogin();
      }

      this.isInitialized = true;
    } catch (error) {
      this.logger.error('Error during OAuth configuration', error);
      throw error;
    }
  }

  private async handleSuccessfulLogin(): Promise<void> {
    try {
      const claims = this.oAuthService.getIdentityClaims() as UserProfile;
      if (!claims?.sub) {
        throw new Error('Invalid user claims received');
      }

      this.logger.info('User authenticated successfully', { userId: claims.sub });
      this.profile$.next(claims);
    } catch (error) {
      this.logger.error('Error handling successful login', error);
      this.logout();
      throw error;
    }
  }

  login(): void {
    this.logger.info('Initiating login flow');
    this.oAuthService.initImplicitFlow(undefined, { prompt: 'consent' });
  }

  logout(): void {
    try {
      this.oAuthService.revokeTokenAndLogout();
      this.oAuthService.logOut();
      this.profile$.next(null);
      this.logger.info('User logged out successfully');
    } catch (error) {
      this.logger.error('Error during logout', error);
      // Force clean state even if logout fails
      this.profile$.next(null);
    }
  }

  isAuthenticated(): boolean {
    return this.oAuthService.hasValidAccessToken();
  }

  async getProfile(): Promise<UserProfile | null> {
    return await this.oAuthService.loadUserProfile().then(profile => profile as UserProfile);
  }

  getAccessToken(): string | null {
    return this.oAuthService.hasValidAccessToken() ? this.oAuthService.getAccessToken() : null;
  }

  getIdToken(): string | null {
    return this.oAuthService.hasValidIdToken() ? this.oAuthService.getIdToken() : null;
  }
}
