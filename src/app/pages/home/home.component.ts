import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatIcon } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { LoggerService } from '@services/logger.service';
import { AuthGoogleService } from '@services/auth-google.service';
import { SpreadsheetService } from '@services/spreadsheet.service';
import { AppUpdateService } from '@services/app-update.service';
import { IAppUpdateStatus } from '@interfaces/app-update-status.interface';
import { fromEvent } from 'rxjs';
import { BaseRectButtonComponent } from '@components/base';

@Component({
    selector: 'app-home',
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.scss'],
    standalone: true,
    imports: [CommonModule, MatIcon, BaseRectButtonComponent]
})
export class HomeComponent implements OnInit {
  private logger = inject(LoggerService);
  private authService = inject(AuthGoogleService);
  private spreadsheetService = inject(SpreadsheetService);
  private appUpdateService = inject(AppUpdateService);
  private destroyRef = inject(DestroyRef);
  
  showInstallButton = signal(false);
  isAuthenticated = signal(false);
  hasDefaultSheet = signal(false);
  showStartLoggingButton = signal(false);
  isUpdateAvailable = signal(false);
  showUpdateNotification = signal(false);
  private deferredPrompt: any;

  async ngOnInit() {
    // Subscribe to app update status
    this.appUpdateService.updateStatus$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((status: IAppUpdateStatus) => {
        this.isUpdateAvailable.set(status.isUpdateAvailable);
        this.showUpdateNotification.set(status.isUpdateAvailable);
        this.evaluateStartLoggingButton();
      });
    
    // Check authentication and spreadsheet status
    await this.checkUserStatus();
    
    // Listen for the install prompt
    fromEvent(window as any, 'beforeinstallprompt')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((event) => {
      const e = event as any;
      e.preventDefault();
      this.deferredPrompt = e;
      this.showInstallButton.set(true);
    });

    // Hide button if already installed
    fromEvent(window, 'appinstalled')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
      this.showInstallButton.set(false);
    });
  }

  private evaluateStartLoggingButton(): void {
    // Show "Start Logging" button if user is authenticated, has default sheet, and no update is pending
    this.showStartLoggingButton.set(this.isAuthenticated() && this.hasDefaultSheet() && !this.showUpdateNotification());
  }

  private async checkUserStatus() {
    try {
      this.isAuthenticated.set(await this.authService.canSync());
      
      if (this.isAuthenticated()) {
        // Check if user has a default spreadsheet
        try {
          const defaultSheet = await this.spreadsheetService.getDefaultSheet();
          this.hasDefaultSheet.set(!!defaultSheet);
        } catch (error) {
          this.hasDefaultSheet.set(false);
        }
      }
      
      // Evaluate showing the start logging button
      this.evaluateStartLoggingButton();
    } catch (error) {
      this.logger.error('Error checking user status', error);
      this.isAuthenticated.set(false);
      this.hasDefaultSheet.set(false);
      this.showStartLoggingButton.set(false);
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
    this.showUpdateNotification.set(false);
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
      this.showInstallButton.set(false);
    }
  }
}