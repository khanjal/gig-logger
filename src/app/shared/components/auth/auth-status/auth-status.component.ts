import { Component, OnInit, OnDestroy, signal } from '@angular/core';
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
  isAuthenticated = signal(false);
  hasAccessToken = signal(false);
  localStorageAuth = signal(false);

  // User ID
  userId = signal('');
  
  // Token info
  accessTokenPreview = signal('');
  lastUpdated = signal(new Date());

  constructor(
    private authService: AuthGoogleService,
    private secureCookieStorage: SecureCookieStorageService,
    private spreadsheetService: SpreadsheetService
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
    this.localStorageAuth.set(localStorage.getItem(SESSION_CONSTANTS.IS_AUTHENTICATED) === 'true');
    
    // Check access token
    const accessToken = this.secureCookieStorage.getItem(AUTH_CONSTANTS.ACCESS_TOKEN);
    this.hasAccessToken.set(!!accessToken);
    
    // Create preview of token (first 10 and last 10 characters)
    if (accessToken) {
      this.accessTokenPreview.set(`${accessToken.substring(0, 10)}...${accessToken.substring(accessToken.length - 10)}`);
    } else {
      this.accessTokenPreview.set('None');
    }
    
    // Check overall authentication (sync capability)
    this.isAuthenticated.set(await this.authService.canSync());
    // Get user ID using shared utility
    this.userId.set(getCurrentUserId());
    this.lastUpdated.set(new Date());
  }

  onReconnect() {
    // Start login flow
    this.authService.login();
  }

  getStatusIcon(): string {
    if (this.isAuthenticated() && this.hasAccessToken() && this.localStorageAuth()) {
      return 'check_circle';
    } else if (this.localStorageAuth() || this.hasAccessToken()) {
      return 'warning';
    } else {
      return 'error';
    }
  }
}