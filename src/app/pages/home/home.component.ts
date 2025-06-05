import { Component, OnInit, inject } from '@angular/core';
import { environment } from 'src/environments/environment';
import { MatIcon } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { LoggerService } from '@services/logger.service';

@Component({
    selector: 'app-home',
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.scss'],
    standalone: true,
    imports: [CommonModule, MatIcon]
})
export class HomeComponent implements OnInit {
  private logger = inject(LoggerService);
  showInstallButton = false;
  private deferredPrompt: any;

  ngOnInit() {
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