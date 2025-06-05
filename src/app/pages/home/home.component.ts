import { Component, OnInit, inject } from '@angular/core';
import { environment } from 'src/environments/environment';
import { MatIcon } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { LoggerService } from '@services/logger.service';
import { AuthGoogleService } from '@services/auth-google.service';
import { SpreadsheetService } from '@services/spreadsheet.service';

@Component({
    selector: 'app-home',
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.scss'],
    standalone: true,
    imports: [CommonModule, MatIcon]
})
export class HomeComponent implements OnInit {
  private logger = inject(LoggerService);
  private authService = inject(AuthGoogleService);
  private spreadsheetService = inject(SpreadsheetService);
  
  showInstallButton = false;
  isAuthenticated = false;
  hasDefaultSheet = false;
  showStartLoggingButton = false;
  private deferredPrompt: any;
  async ngOnInit() {
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

  private async checkUserStatus() {
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
      
      // Show "Start Logging" button if user is authenticated and has default sheet
      this.showStartLoggingButton = this.isAuthenticated && this.hasDefaultSheet;
    } catch (error) {
      this.logger.error('Error checking user status', error);
      this.isAuthenticated = false;
      this.hasDefaultSheet = false;
      this.showStartLoggingButton = false;
    }
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