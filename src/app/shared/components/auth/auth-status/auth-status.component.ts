import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';

// Angular Material
import { MatCard, MatCardContent, MatCardHeader, MatCardTitle } from '@angular/material/card';
import { MatIcon } from '@angular/material/icon';
import { MatChip } from '@angular/material/chips';

// App Services
import { AuthGoogleService } from '@services/auth-google.service';
import { SecureCookieStorageService } from '@services/secure-cookie-storage.service';
import { AUTH_CONSTANTS } from '@constants/auth.constants';

@Component({
  selector: 'app-auth-status',
  standalone: true,
  imports: [
    CommonModule,
    MatCard,
    MatCardContent,
    MatCardHeader,
    MatCardTitle,
    MatIcon,
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
  
  // Token info
  accessTokenPreview = '';
  lastUpdated = new Date();
  
  private readonly IS_AUTHENTICATED_KEY = 'is_authenticated';

  constructor(
    private authService: AuthGoogleService,
    private secureCookieStorage: SecureCookieStorageService
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
    this.localStorageAuth = localStorage.getItem(this.IS_AUTHENTICATED_KEY) === 'true';
    
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
      this.lastUpdated = new Date();
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