import { Injectable } from '@angular/core';
import { LoggerService } from './logger.service';

@Injectable({
  providedIn: 'root'
})
export class DiagnosticService {
  constructor(private logger: LoggerService) {}

  public runStartupDiagnostics(): void {
    this.logger.info('Running startup diagnostics...');
    
    try {
      // Check browser environment
      this.checkBrowserEnvironment();
      
      // Check local storage
      this.checkLocalStorage();
      
      // Check service worker
      this.checkServiceWorker();
      
      // Check network connectivity
      this.checkNetworkConnectivity();
      
      this.logger.info('Startup diagnostics completed successfully');
    } catch (error) {
      this.logger.error('Startup diagnostics failed', error);
    }
  }

  private checkBrowserEnvironment(): void {
    const issues: string[] = [];
    
    if (!window) issues.push('Window object not available');
    if (!document) issues.push('Document object not available');
    if (!navigator) issues.push('Navigator object not available');
    
    if (issues.length > 0) {
      throw new Error(`Browser environment issues: ${issues.join(', ')}`);
    }
    
    this.logger.debug('Browser environment check: OK');
  }

  private checkLocalStorage(): void {
    try {
      const testKey = '__diagnostic_test__';
      localStorage.setItem(testKey, 'test');
      const retrieved = localStorage.getItem(testKey);
      localStorage.removeItem(testKey);
      
      if (retrieved !== 'test') {
        throw new Error('localStorage read/write test failed');
      }
      
      this.logger.debug('LocalStorage check: OK');
    } catch (error) {
      this.logger.warn('LocalStorage not available or functioning', error);
    }
  }

  private checkServiceWorker(): void {
    if ('serviceWorker' in navigator) {
      this.logger.debug('Service Worker support: Available');
      
      navigator.serviceWorker.getRegistrations().then(registrations => {
        this.logger.debug(`Service Worker registrations: ${registrations.length}`);
      }).catch(error => {
        this.logger.warn('Failed to check service worker registrations', error);
      });
    } else {
      this.logger.debug('Service Worker support: Not available');
    }
  }

  private checkNetworkConnectivity(): void {
    if (navigator.onLine !== undefined) {
      this.logger.debug(`Network connectivity: ${navigator.onLine ? 'Online' : 'Offline'}`);
    } else {
      this.logger.debug('Network connectivity: Status unknown');
    }
  }

  public reportLoadingIssue(component: string, error: any): void {
    this.logger.error(`Loading issue in ${component}`, {
      component,
      error: error?.message || 'Unknown error',
      stack: error?.stack,
      userAgent: navigator.userAgent,
      url: window.location.href,
      timestamp: new Date().toISOString()
    });
  }
}
