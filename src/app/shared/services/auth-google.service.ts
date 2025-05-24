import { Injectable } from '@angular/core';
import { OAuthService } from 'angular-oauth2-oidc';
import { BehaviorSubject } from 'rxjs';
import { authConfig } from './auth.config';
import { LoggerService } from './logger.service';
import { SecureCookieStorageService } from './secure-cookie-storage.service';
import { UserProfile } from '../interfaces/user-profile.interface';
import { GigLoggerService } from './gig-logger.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { firstValueFrom } from 'rxjs';

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

    // Only handle URL params since we're not using the library's token management
    this.oAuthService.events.subscribe(event => {
      this.logger.debug('Auth event:', event);
      if (event.type === 'discovery_document_loaded') {
        // Check URL for auth code
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');
        if (code) {
          this.handleAuthorizationCode(code);
        }
      }
    });
  }

  private async initConfiguration(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      this.logger.info('Initializing OAuth configuration');
      this.oAuthService.configure(authConfig);
      await this.oAuthService.loadDiscoveryDocument();
      
      // Check for authorization code in URL
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
      // Send the authorization code to our backend to exchange for tokens
      const response = await this.gigLoggerService.setRefreshToken(code);
      if (!response?.accessToken) {
        throw new Error('Failed to exchange code for tokens');
      }

      this.logger.info('Successfully exchanged code for tokens');
      
      // Store the access token
      this.secureCookieStorage.setItem('access_token', response.accessToken);

      // Try to load profile to validate token
      const profile = await this.getProfile();
      if (!profile) {
        throw new Error('Failed to get user profile');
      }
      
      this.profile$.next(profile);

      // Clean up the URL
      window.history.replaceState(null, '', window.location.pathname);
    } catch (error) {
      this.logger.error('Error exchanging code for tokens', error);
      this.logout();
      throw error;
    }
  }

  async refreshToken(): Promise<void> {
    try {
      const result = await this.gigLoggerService.refreshAuthToken();
      if (!result?.accessToken) {
        throw new Error('No access token received from refresh');
      }
      
      this.secureCookieStorage.setItem('access_token', result.accessToken);
      this.logger.info('Access token refreshed through backend successfully');
      
      // Validate token
      const profile = await this.getProfile();
      if (!profile) {
        throw new Error('Invalid token received from refresh');
      }
    } catch (error) {
      this.logger.error('Error refreshing token', error);
      this.logout();
      throw error;
    }
  }

  login(): void {
    this.logger.info('Initiating login flow');
    this.oAuthService.initCodeFlow();
  }

  logout(): void {
    try {
      // Clear backend tokens first
      this.gigLoggerService.clearRefreshToken()
        .then(observable => {
          observable.subscribe(() => {
            // Then clear local state
            this.secureCookieStorage.removeItem('access_token');
            this.oAuthService.logOut();
            this.profile$.next(null);
            this.logger.info('User logged out successfully');
          });
        })
        .catch(error => {
          this.logger.error('Error clearing refresh token', error);
          // Still clear local state
          this.secureCookieStorage.removeItem('access_token');
          this.oAuthService.logOut();
          this.profile$.next(null);
        });
    } catch (error) {
      this.logger.error('Error during logout', error);
      this.profile$.next(null);
    }
  }

  isAuthenticated(): boolean {
    return !!this.secureCookieStorage.getItem('access_token');
  }

  async getProfile(): Promise<UserProfile | null> {
    try {
      const token = this.secureCookieStorage.getItem('access_token');
      if (!token) return null;
      
      const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
      const response = await firstValueFrom(this.http.get<UserProfile>('https://www.googleapis.com/oauth2/v3/userinfo', { headers }));
      return response;
    } catch (error) {
      this.logger.error('Error loading user profile', error);
      return null;
    }
  }

  getAccessToken(): string | null {
    return this.secureCookieStorage.getItem('access_token');
  }
}
