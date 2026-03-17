import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { getCurrentUserId } from '@utils/user-id.util';

// Angular Material
import { MatChip } from '@angular/material/chips';
import { BaseCardComponent } from '@components/base';

// App Services
import { AuthGoogleService } from '@services/auth-google.service';
import { SecureCookieStorageService } from '@services/secure-cookie-storage.service';
import { AUTH_CONSTANTS } from '@constants/auth.constants';
import { SpreadsheetService } from '@services/spreadsheet.service';
import { SESSION_CONSTANTS } from '@constants/session.constants';

@Component({
  selector: 'app-auth-status',
  standalone: true,
  imports: [
    CommonModule,
    BaseCardComponent,
    MatChip
  ],
  templateUrl: './auth-status.component.html',
  styleUrl: './auth-status.component.scss'
})

export class AuthStatusComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  // Authentication status
  isAuthenticated = false;
  hasAccessToken = false;
  localStorageAuth = false;

  // User ID
  userId = '';
  
  // Token info
  accessTokenPreview = '';
  lastUpdated = new Date();
  // Reconnect notice when logged out but sheets exist
  showReconnectNotice = false;
  
  // use centralized session constants for keys

  constructor(
    private authService: AuthGoogleService,
    private secureCookieStorage: SecureCookieStorageService
    ,private spreadsheetService: SpreadsheetService
  ) {}

  async ngOnInit() {
    // Initial status check
    await this.updateStatus();
    
    // Subscribe to authentication changes
    this.authService.profile$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.updateStatus();
      });
    
    // Update status every 5 seconds
    setInterval(() => {
      this.updateStatus();
    }, 5000);
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  async updateStatus() {
    // Check localStorage
    this.localStorageAuth = localStorage.getItem(SESSION_CONSTANTS.IS_AUTHENTICATED) === 'true';
    
    // Check access token
    const accessToken = this.secureCookieStorage.getItem(AUTH_CONSTANTS.ACCESS_TOKEN);
    this.hasAccessToken = !!accessToken;
    
    // Create preview of token (first 10 and last 10 characters)
    if (accessToken) {
      this.accessTokenPreview = `${accessToken.substring(0, 10)}...${accessToken.substring(accessToken.length - 10)}`;
    } else {
      this.accessTokenPreview = 'None';
    }
    
    // Check overall authentication
    this.isAuthenticated = await this.authService.isAuthenticated();
    // Get user ID using shared utility
    this.userId = getCurrentUserId();
    this.lastUpdated = new Date();

    // Decide whether to show a reconnect notice: when not authenticated,
    // there is at least one spreadsheet, and the user did not intentionally log out/delete data.
    try {
      const sheets = await this.spreadsheetService.getSpreadsheets();
      const hasSheets = !!(sheets && sheets.length > 0);
      const intentional = localStorage.getItem(SESSION_CONSTANTS.INTENTIONAL_LOGOUT) === 'true';

      this.showReconnectNotice = !this.isAuthenticated && hasSheets && !intentional;
    } catch (e) {
      this.showReconnectNotice = false;
    }
  }

  onReconnect() {
    // Clear any intentional flag and start login flow
    try { localStorage.removeItem(SESSION_CONSTANTS.INTENTIONAL_LOGOUT); } catch (e) {}
    this.authService.login();
  }

  getStatusIcon(): string {
    if (this.isAuthenticated && this.hasAccessToken && this.localStorageAuth) {
      return 'check_circle';
    } else if (this.localStorageAuth || this.hasAccessToken) {
      return 'warning';
    } else {
      return 'error';
    }
  }
}