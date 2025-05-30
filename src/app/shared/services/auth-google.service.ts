import { Injectable } from '@angular/core';
import { OAuthService } from 'angular-oauth2-oidc';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import { authConfig } from './auth.config';
import { LoggerService } from './logger.service';
import { SecureCookieStorageService } from './secure-cookie-storage.service';
import { UserProfile } from '../interfaces/user-profile.interface';
import { GigLoggerService } from './gig-logger.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AUTH_CONSTANTS } from '@constants/auth.constants';

@Injectable({
  providedIn: 'root',
})
export class AuthGoogleService {
  private profile$ = new BehaviorSubject<UserProfile | null>(null);
  private isInitialized = false;

  constructor(
    private oAuthService: OAuthService,
    private logger: LoggerService,
    private secureCookieStorage: SecureCookieStorageService,
    private gigLoggerService: GigLoggerService,
    private http: HttpClient
  ) {    
    this.oAuthService.setStorage(this.secureCookieStorage);
    this.initConfiguration().catch(error => {
      this.logger.error('Failed to initialize auth configuration', error);
    });
  }

  private async initConfiguration(): Promise<void> {
    if (this.isInitialized) return;

    try {
      this.oAuthService.configure(authConfig);
      await this.oAuthService.loadDiscoveryDocument();
      
      const params = new URLSearchParams(window.location.search);
      if (params.has('code')) {
        await this.handleAuthorizationCode(params.get('code')!);
      }

      this.isInitialized = true;
    } catch (error) {
      this.logger.error('Error during OAuth configuration', error);
      throw error;
    }
  }

  private async handleAuthorizationCode(code: string): Promise<void> {
    try {
      const response = await this.gigLoggerService.setRefreshToken(code);
      if (!response?.accessToken) {
        throw new Error('No access token received from authorization');
      }

      this.logger.info('Successfully exchanged code for tokens');
      this.secureCookieStorage.setItem(AUTH_CONSTANTS.ACCESS_TOKEN, response.accessToken);

      // Validate token by loading profile
      const profile = await this.getProfile();
      if (!profile) {
        throw new Error('Failed to validate access token');
      }
      this.profile$.next(profile);

      window.history.replaceState(null, '', window.location.pathname);
    } catch (error) {
      this.logger.error('Error exchanging code for tokens', error);
      await this.logout();
      throw error;
    }
  }

  login(): void {
    this.logger.info('Initiating login flow');
    this.oAuthService.initCodeFlow();
  }

  async refreshToken(): Promise<void> {
    try {
      const result = await this.gigLoggerService.refreshAuthToken();
      if (!result?.accessToken) {
        throw new Error('No access token received from refresh');
      }
      
      this.secureCookieStorage.setItem(AUTH_CONSTANTS.ACCESS_TOKEN, result.accessToken);
      
      // Validate refreshed token
      const profile = await this.getProfile();
      if (!profile) {
        throw new Error('Invalid token received from refresh');
      }
      this.profile$.next(profile);
      
      this.logger.info('Access token refreshed and validated successfully');
    } catch (error) {
      this.logger.error('Error refreshing token', error);
      await this.logout();
      throw error;
    }
  }

  async logout(): Promise<void> {
    this.logger.info('Starting logout process');
    
    try {
      // Clear backend tokens first
      await this.gigLoggerService.clearRefreshToken();
    } catch (error) {
      this.logger.error('Error clearing refresh token', error);
    } finally {
      // Always clear local state
      this.secureCookieStorage.removeItem(AUTH_CONSTANTS.ACCESS_TOKEN);
      this.oAuthService.logOut();
      this.profile$.next(null);
      this.logger.info('Local state cleared');
    }
  }

  isAuthenticated(): boolean {
    return !!this.secureCookieStorage.getItem(AUTH_CONSTANTS.ACCESS_TOKEN);
  }

  async getProfile(): Promise<UserProfile | null> {
    try {
      const token = this.secureCookieStorage.getItem(AUTH_CONSTANTS.ACCESS_TOKEN);
      if (!token) return null;
      
      const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
      return await firstValueFrom(
        this.http.get<UserProfile>('https://www.googleapis.com/oauth2/v3/userinfo', { headers })
      );
    } catch (error) {
      this.logger.error('Error loading user profile', error);
      return null;
    }
  }

  getAccessToken(): string | null {
    return this.secureCookieStorage.getItem(AUTH_CONSTANTS.ACCESS_TOKEN);
  }
}
