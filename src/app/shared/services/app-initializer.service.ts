import { Injectable } from '@angular/core';
import { LoggerService } from './logger.service';
import { DiagnosticService } from './diagnostic.service';

@Injectable({
  providedIn: 'root'
})
export class AppInitializerService {
  private initializationComplete = false;
  private initializationPromise: Promise<void> | null = null;

  constructor(
    private logger: LoggerService,
    private diagnosticService: DiagnosticService
  ) {}

  async initialize(): Promise<void> {
    if (this.initializationComplete) {
      return Promise.resolve();
    }

    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = this.performInitialization();
    return this.initializationPromise;
  }

  private async performInitialization(): Promise<void> {
    try {
      this.logger.info('Starting app initialization...');

      // Run diagnostics first
      this.diagnosticService.runStartupDiagnostics();

      // Check if critical APIs are available
      await this.checkCriticalDependencies();

      // Initialize core services
      await this.initializeCoreServices();

      this.initializationComplete = true;
      this.logger.info('App initialization complete');
    } catch (error) {
      this.logger.error('App initialization failed', error);
      this.diagnosticService.reportLoadingIssue('AppInitializer', error);
      // Don't throw - allow app to try to continue
      this.initializationComplete = true;
    }
  }

  private async checkCriticalDependencies(): Promise<void> {
    // Check if localStorage is available
    try {
      localStorage.setItem('test', 'test');
      localStorage.removeItem('test');
    } catch (error) {
      throw new Error('localStorage is not available');
    }

    // Check if document is ready
    if (document.readyState === 'loading') {
      await new Promise(resolve => {
        document.addEventListener('DOMContentLoaded', resolve);
      });
    }

    // Give time for external scripts to load
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  private async initializeCoreServices(): Promise<void> {
    // Add any critical service initialization here
    // For now, just a small delay to ensure everything is ready
    await new Promise(resolve => setTimeout(resolve, 50));
  }

  isInitialized(): boolean {
    return this.initializationComplete;
  }
}
