import { Injectable } from '@angular/core';
import { OAuthService } from 'angular-oauth2-oidc';
import { BehaviorSubject } from 'rxjs';
import { authConfig } from './auth.config';
import { LoggerService } from './logger.service';
import { SecureCookieStorageService } from './secure-cookie-storage.service';
import { UserProfile } from '../interfaces/user-profile.interface';
import { GigLoggerService } from './gig-logger.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
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

    // Subscribe to auth events for debugging
    this.oAuthService.events.subscribe(event => {
      this.logger.debug('Auth event:', event);
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
      // Send the authorization code to our backend
      const response = await this.gigLoggerService.setRefreshToken(code);

      this.logger.info('Successfully exchanged code for tokens');
      
      // Store the access token
      this.secureCookieStorage.setItem('access_token', response.accessToken);

      // Clean up the URL
      window.history.replaceState(null, '', window.location.pathname);
    } catch (error) {
      this.logger.error('Error exchanging code for tokens', error);
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
      
      this.secureCookieStorage.setItem('access_token', result.accessToken);
      this.logger.info('Access token refreshed through backend successfully');
      
      // Validate token
      // const profile = await this.getProfile();
      // if (!profile) {
      //   throw new Error('Invalid token received from refresh');
      // }
    } catch (error) {
      this.logger.error('Error refreshing token', error);
      // this.logout();
      throw error;
    }
  }

  logout(): void {
    this.logger.info('Starting logout process');
    
    // Clear backend tokens first
    this.gigLoggerService.clearRefreshToken()
      .then(observable => {
        observable.subscribe({
          next: () => {
            // Then clear local state
            this.secureCookieStorage.removeItem('access_token');
            this.oAuthService.logOut();
            this.profile$.next(null);
            this.logger.info('User logged out successfully');
          },
          error: (error) => {
            this.logger.error('Error in refresh token clear subscription', error);
            // Still clear local state on error
            this.secureCookieStorage.removeItem('access_token');
            this.oAuthService.logOut();
            this.profile$.next(null);
          }
        });
      })
      .catch(error => {
        this.logger.error('Error initiating refresh token clear', error);
        // Still clear local state
        this.secureCookieStorage.removeItem('access_token');
        this.oAuthService.logOut();
        this.profile$.next(null);
      });
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
