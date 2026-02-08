import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { LoggerService } from '@services/logger.service';
import { AuthGoogleService } from '@services/auth-google.service';
import { SpreadsheetService } from '@services/spreadsheet.service';
import { AppUpdateService, AppUpdateStatus } from '@services/app-update.service';
import { Subscription } from 'rxjs';
import { BaseRectButtonComponent } from '@components/base';

@Component({
    selector: 'app-home',
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.scss'],
    standalone: true,
    imports: [CommonModule, MatIcon, BaseRectButtonComponent]
})
export class HomeComponent implements OnInit, OnDestroy {
  private logger = inject(LoggerService);
  private authService = inject(AuthGoogleService);
  private spreadsheetService = inject(SpreadsheetService);
  private appUpdateService = inject(AppUpdateService);
  
  showInstallButton = false;
  isAuthenticated = false;
  hasDefaultSheet = false;
  showStartLoggingButton = false;
  isUpdateAvailable = false;
  showUpdateNotification = false;
  private deferredPrompt: any;
  private updateStatusSubscription: Subscription | undefined;  async ngOnInit() {
    // Subscribe to app update status
    this.updateStatusSubscription = this.appUpdateService.updateStatus$.subscribe(
      (status: AppUpdateStatus) => {
        this.isUpdateAvailable = status.isUpdateAvailable;
        this.showUpdateNotification = status.isUpdateAvailable;
        
        // Re-evaluate showing the start logging button when update status changes
        this.evaluateStartLoggingButton();
      }
    );
    
    // Check authentication and spreadsheet status
    await this.checkUserStatus();
    
    // Listen for the install prompt
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredPrompt = e;
      this.showInstallButton = true;
    });

    // Hide button if already installed
    window.addEventListener('appinstalled', () => {
      this.showInstallButton = false;
    });
  }

  ngOnDestroy(): void {
    // Unsubscribe to prevent memory leaks
    if (this.updateStatusSubscription) {
      this.updateStatusSubscription.unsubscribe();
    }
  }

  private evaluateStartLoggingButton(): void {
    // Show "Start Logging" button if user is authenticated, has default sheet, and no update is pending
    this.showStartLoggingButton = this.isAuthenticated && this.hasDefaultSheet && !this.showUpdateNotification;
  }  private async checkUserStatus() {
    try {
      this.isAuthenticated = await this.authService.isAuthenticated();
      
      if (this.isAuthenticated) {
        // Check if user has a default spreadsheet
        try {
          const defaultSheet = await this.spreadsheetService.getDefaultSheet();
          this.hasDefaultSheet = !!defaultSheet;
        } catch (error) {
          this.hasDefaultSheet = false;
        }
      }
      
      // Evaluate showing the start logging button
      this.evaluateStartLoggingButton();
    } catch (error) {
      this.logger.error('Error checking user status', error);
      this.isAuthenticated = false;
      this.hasDefaultSheet = false;
      this.showStartLoggingButton = false;
    }
  }

  async updateApp(): Promise<void> {
    try {
      await this.appUpdateService.activateUpdate();
    } catch (error) {
      this.logger.error('Error updating app', error);
    }
  }

  dismissUpdate(): void {
    this.showUpdateNotification = false;
    // Re-evaluate showing the start logging button
    this.evaluateStartLoggingButton();
  }

  async installApp() {
    if (this.deferredPrompt) {
      this.deferredPrompt.prompt();
      const { outcome } = await this.deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          this.logger.info('App installed successfully');
        }
      
      this.deferredPrompt = null;
      this.showInstallButton = false;
    }
  }
}