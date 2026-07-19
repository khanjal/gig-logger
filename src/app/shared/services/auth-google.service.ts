import { Injectable, inject } from '@angular/core';
import { OAuthService } from 'angular-oauth2-oidc';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import { authConfig } from './auth.config';
import { LoggerService } from './logger.service';
import { SecureCookieStorageService } from './secure-cookie-storage.service';
import type { UserProfile } from '@interfaces/auth/user-profile.interface';
import { GigWorkflowService } from './gig-workflow.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AUTH_CONSTANTS } from '@constants/auth.constants';
import { SESSION_CONSTANTS } from '@constants/session.constants';

@Injectable({
  providedIn: 'root',
})
export class AuthGoogleService {
  private oAuthService = inject(OAuthService);
  private logger = inject(LoggerService);
  private secureCookieStorage = inject(SecureCookieStorageService);
  private gigWorkflowService = inject(GigWorkflowService);
  private http = inject(HttpClient);

  public profile$ = new BehaviorSubject<UserProfile | null>(null);
  private isInitialized = false;
  private readonly IS_AUTHENTICATED_KEY = SESSION_CONSTANTS.IS_AUTHENTICATED;

  constructor() {    
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
        try {
          await this.handleAuthorizationCode(params.get('code')!);
        } catch (codeError) {
          this.logger.error('Failed to handle authorization code, continuing without authentication', codeError);
          // Clear URL parameters and continue
          window.history.replaceState(null, '', window.location.pathname);
        }
      }

      this.isInitialized = true;
    } catch (error) {
      this.logger.error('Error during OAuth configuration, continuing without auth', error);
      this.isInitialized = true; // Mark as initialized to prevent retry loops
      // Don't throw - allow app to continue without auth
    }
  }

   private setAuthenticationState(isAuthenticated: boolean): void {
    localStorage.setItem(this.IS_AUTHENTICATED_KEY, isAuthenticated.toString());
  }

  private async handleAuthorizationCode(code: string): Promise<void> {
    try {
      const response = await this.gigWorkflowService.setRefreshToken(code);
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
      
      // Store user ID for rate limiting and API usage
      this.storeUserId(profile);
      
      // Set authentication state in localStorage
      this.setAuthenticationState(true);

      window.history.replaceState(null, '', window.location.pathname);
      window.location.reload();
    } catch (error) {
      this.logger.error('Error exchanging code for tokens', error);
      await this.logout();
      throw error;
    }
  }

  public login(): void {
    this.logger.info('Initiating login flow');
    this.oAuthService.initCodeFlow();
  }

  private extractStatusCode(error: unknown): number | undefined {
    const err = error as { status?: number; response?: { status?: number } } | null | undefined;
    return err?.status || err?.response?.status;
  }

  private clearAuthState(): void {
    this.secureCookieStorage.removeItem(AUTH_CONSTANTS.ACCESS_TOKEN);
    this.oAuthService.logOut();
    this.profile$.next(null);
    localStorage.removeItem(SESSION_CONSTANTS.AUTHENTICATED_USER_ID);
    this.setAuthenticationState(false);
    this.logger.info('Local state cleared');
  }

  public async refreshToken(): Promise<void> {
    try {
      const result = await this.gigWorkflowService.refreshAuthToken();
      if (!result?.accessToken) throw new Error('No access token received from refresh');
      this.secureCookieStorage.setItem(AUTH_CONSTANTS.ACCESS_TOKEN, result.accessToken);
      const profile = await this.getProfile();
      if (!profile) throw new Error('Invalid token received from refresh');
      this.profile$.next(profile);
      this.storeUserId(profile);
      this.setAuthenticationState(true);
      this.logger.info('Access token refreshed and validated successfully');
    } catch (error: unknown) {
      const status = this.extractStatusCode(error);
      if (status === 401 || status === 403) {
        this.logger.error('Refresh token invalid or expired, logging out', error);
        await this.logout();
      } else {
        this.logger.warn('Refresh token failed due to network/server error, not logging out', error);
      }
      throw error;
    }
  }

  public async logout(): Promise<void> {
    this.logger.info('Starting logout process');
    try {
      await this.gigWorkflowService.clearRefreshToken();
    } catch (error) {
      this.logger.error('Error clearing refresh token', error);
    } finally {
      this.clearAuthState();
    }
  }

  public async isAuthenticated(): Promise<boolean> {
    try {
      // Add timeout to prevent hanging
      return await Promise.race([
        this.checkAuthenticationStatus(),
        new Promise<boolean>((_, reject) => 
          setTimeout(() => reject(new Error('Authentication check timeout')), 5000)
        )
      ]);
    } catch (error) {
      this.logger.error('Authentication check failed, assuming not authenticated', error);
      this.setAuthenticationState(false);
      return false;
    }
  }

  private async checkAuthenticationStatus(): Promise<boolean> {
    const hasToken = !!this.secureCookieStorage.getItem(AUTH_CONSTANTS.ACCESS_TOKEN);
    
    // If we have an access token, we're authenticated
    if (hasToken) {
        this.setAuthenticationState(true);
        return true;
    }

    // No access token - check localStorage
    const localStorageAuth = localStorage.getItem(this.IS_AUTHENTICATED_KEY) === 'true';
    
    if (!localStorageAuth) {
        this.setAuthenticationState(false);
        return false;
    }
    
    try {
      await this.refreshToken();
      // Check if refresh was successful
      const refreshedToken = !!this.secureCookieStorage.getItem(AUTH_CONSTANTS.ACCESS_TOKEN);
      if (refreshedToken) return true;
      this.setAuthenticationState(false);
      return false;
    } catch (error: unknown) {
      const status = this.extractStatusCode(error);
      if (status === 401 || status === 403) {
        this.logger.info('Token refresh failed due to invalid/expired token, clearing authentication state');
        this.setAuthenticationState(false);
      } else {
        this.logger.warn('Token refresh failed due to network/server error, keeping authentication state', error);
      }
      return false;
    }
  }

  // Keep the synchronous version for cases where you can't use async
  public isAuthenticatedSync(): boolean {
    return !!this.secureCookieStorage.getItem(AUTH_CONSTANTS.ACCESS_TOKEN);
  }

  // Method to get authentication state from localStorage only
  public getAuthenticationFromStorage(): boolean {
    return localStorage.getItem(this.IS_AUTHENTICATED_KEY) === 'true';
  }

  public async getProfile(): Promise<UserProfile | null> {
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

  /**
   * Public helper to determine if remote sync is available.
   * Returns true when the user is currently authenticated (token present/refresh OK).
   */
  public async canSync(): Promise<boolean> {
    try {
      return await this.isAuthenticated();
    } catch (e) {
      this.logger.warn('canSync check failed, assuming not sync-capable', e);
      return false;
    }
  }

  public getAccessToken(): string | null {
    return this.secureCookieStorage.getItem(AUTH_CONSTANTS.ACCESS_TOKEN);
  }

  private storeUserId(profile: UserProfile | null): void {
    if (profile?.sub) {
      localStorage.setItem(SESSION_CONSTANTS.AUTHENTICATED_USER_ID, profile.sub);
    }
  }
}
