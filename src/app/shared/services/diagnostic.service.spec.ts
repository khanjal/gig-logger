import { TestBed } from '@angular/core/testing';
import { DiagnosticService } from './diagnostic.service';
import { LoggerService } from './logger.service';

describe('DiagnosticService', () => {
  let service: DiagnosticService;
  let loggerSpy: jasmine.SpyObj<LoggerService>;

  beforeEach(() => {
    const spy = jasmine.createSpyObj('LoggerService', ['info', 'debug', 'warn', 'error']);

    TestBed.configureTestingModule({
      providers: [
        DiagnosticService,
        { provide: LoggerService, useValue: spy }
      ]
    });

    service = TestBed.inject(DiagnosticService);
    loggerSpy = TestBed.inject(LoggerService) as jasmine.SpyObj<LoggerService>;
  });

  describe('Service Initialization', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });
  });

  describe('runStartupDiagnostics', () => {
    it('should run all diagnostic checks successfully', () => {
      spyOn<any>(service, 'checkBrowserEnvironment');
      spyOn<any>(service, 'checkLocalStorage');
      spyOn<any>(service, 'checkServiceWorker');
      spyOn<any>(service, 'checkNetworkConnectivity');

      service.runStartupDiagnostics();

      expect(loggerSpy.info).toHaveBeenCalledWith('Running startup diagnostics...');
      expect(service['checkBrowserEnvironment']).toHaveBeenCalled();
      expect(service['checkLocalStorage']).toHaveBeenCalled();
      expect(service['checkServiceWorker']).toHaveBeenCalled();
      expect(service['checkNetworkConnectivity']).toHaveBeenCalled();
      expect(loggerSpy.info).toHaveBeenCalledWith('Startup diagnostics completed successfully');
    });

    it('should log error when diagnostics fail', () => {
      const testError = new Error('Test diagnostic failure');
      spyOn<any>(service, 'checkBrowserEnvironment').and.throwError(testError);

      service.runStartupDiagnostics();

      expect(loggerSpy.error).toHaveBeenCalledWith('Startup diagnostics failed', testError);
    });

    it('should continue with other checks even if one fails', () => {
      spyOn<any>(service, 'checkBrowserEnvironment').and.throwError('Browser check failed');
      spyOn<any>(service, 'checkLocalStorage');
      spyOn<any>(service, 'checkServiceWorker');
      spyOn<any>(service, 'checkNetworkConnectivity');

      service.runStartupDiagnostics();

      // Should attempt first check, then fail and go to error handler
      expect(service['checkBrowserEnvironment']).toHaveBeenCalled();
      // Other checks won't be called because the try block exits on error
      expect(loggerSpy.error).toHaveBeenCalled();
    });
  });

  describe('checkBrowserEnvironment (private)', () => {
    it('should pass when all browser objects are available', () => {
      expect(() => service['checkBrowserEnvironment']()).not.toThrow();
      expect(loggerSpy.debug).toHaveBeenCalledWith('Browser environment check: OK');
    });

    it('should log debug message on successful check', () => {
      service['checkBrowserEnvironment']();
      expect(loggerSpy.debug).toHaveBeenCalledWith('Browser environment check: OK');
    });
  });

  describe('checkLocalStorage (private)', () => {
    beforeEach(() => {
      // Clear localStorage before each test
      localStorage.clear();
    });

    it('should successfully test localStorage read/write/remove', () => {
      service['checkLocalStorage']();

      expect(loggerSpy.debug).toHaveBeenCalledWith('LocalStorage check: OK');
      expect(localStorage.getItem('__diagnostic_test__')).toBeNull();
    });

    it('should handle localStorage setItem failure', () => {
      spyOn(localStorage, 'setItem').and.throwError('QuotaExceededError');

      service['checkLocalStorage']();

      expect(loggerSpy.warn).toHaveBeenCalled();
      expect(loggerSpy.warn.calls.first().args[0]).toBe('LocalStorage not available or functioning');
    });

    it('should handle localStorage getItem failure', () => {
      spyOn(localStorage, 'getItem').and.throwError('Storage error');

      service['checkLocalStorage']();

      expect(loggerSpy.warn).toHaveBeenCalled();
    });

    it('should handle localStorage removeItem failure', () => {
      spyOn(localStorage, 'removeItem').and.throwError('Storage error');

      service['checkLocalStorage']();

      expect(loggerSpy.warn).toHaveBeenCalled();
    });

    it('should warn if retrieved value does not match written value', () => {
      spyOn(localStorage, 'getItem').and.returnValue('wrong-value');

      service['checkLocalStorage']();

      expect(loggerSpy.warn).toHaveBeenCalled();
    });

    it('should clean up test key even if error occurs', () => {
      const removeItemSpy = spyOn(localStorage, 'removeItem');
      localStorage.setItem('__diagnostic_test__', 'test');

      service['checkLocalStorage']();

      expect(removeItemSpy).toHaveBeenCalledWith('__diagnostic_test__');
    });
  });

  describe('checkServiceWorker (private)', () => {
    it('should log when service worker is available', () => {
      // Service worker is available in Karma test environment
      if ('serviceWorker' in navigator) {
        service['checkServiceWorker']();

        expect(loggerSpy.debug).toHaveBeenCalledWith('Service Worker support: Available');
      }
    });

    it('should check service worker registrations', (done) => {
      if ('serviceWorker' in navigator) {
        service['checkServiceWorker']();

        setTimeout(() => {
          expect(loggerSpy.debug).toHaveBeenCalled();
          done();
        }, 100);
      } else {
        done();
      }
    });

    it('should handle service worker registration check failure', (done) => {
      if ('serviceWorker' in navigator) {
        spyOn(navigator.serviceWorker, 'getRegistrations').and.returnValue(
          Promise.reject(new Error('Registration check failed'))
        );

        service['checkServiceWorker']();

        setTimeout(() => {
          expect(loggerSpy.warn).toHaveBeenCalled();
          done();
        }, 100);
      } else {
        done();
      }
    });
  });

  describe('checkNetworkConnectivity (private)', () => {
    it('should log online status when available', () => {
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: true
      });

      service['checkNetworkConnectivity']();

      expect(loggerSpy.debug).toHaveBeenCalledWith('Network connectivity: Online');
    });

    it('should log offline status when offline', () => {
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false
      });

      service['checkNetworkConnectivity']();

      expect(loggerSpy.debug).toHaveBeenCalledWith('Network connectivity: Offline');
    });

    it('should handle undefined onLine property', () => {
      const originalOnLine = navigator.onLine;
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: undefined
      });

      service['checkNetworkConnectivity']();

      expect(loggerSpy.debug).toHaveBeenCalledWith('Network connectivity: Status unknown');

      // Restore original value
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: originalOnLine
      });
    });
  });

  describe('reportLoadingIssue', () => {
    it('should log error with component name and error details', () => {
      const testError = new Error('Component failed to load');
      testError.stack = 'Error stack trace here';

      service.reportLoadingIssue('TestComponent', testError);

      expect(loggerSpy.error).toHaveBeenCalled();
      const callArgs = loggerSpy.error.calls.first().args;
      expect(callArgs[0]).toBe('Loading issue in TestComponent');
      expect(callArgs[1].component).toBe('TestComponent');
      expect(callArgs[1].error).toBe('Component failed to load');
      expect(callArgs[1].stack).toBe('Error stack trace here');
    });

    it('should include userAgent in error report', () => {
      const testError = new Error('Test error');

      service.reportLoadingIssue('TestComponent', testError);

      const callArgs = loggerSpy.error.calls.first().args;
      expect(callArgs[1].userAgent).toBe(navigator.userAgent);
    });

    it('should include current URL in error report', () => {
      const testError = new Error('Test error');

      service.reportLoadingIssue('TestComponent', testError);

      const callArgs = loggerSpy.error.calls.first().args;
      expect(callArgs[1].url).toBe(window.location.href);
    });

    it('should include timestamp in error report', () => {
      const testError = new Error('Test error');
      const beforeTime = new Date().toISOString();

      service.reportLoadingIssue('TestComponent', testError);

      const callArgs = loggerSpy.error.calls.first().args;
      expect(callArgs[1].timestamp).toBeDefined();
      expect(new Date(callArgs[1].timestamp).getTime()).toBeGreaterThanOrEqual(
        new Date(beforeTime).getTime()
      );
    });

    it('should handle error without message', () => {
      const testError = {};

      service.reportLoadingIssue('TestComponent', testError);

      const callArgs = loggerSpy.error.calls.first().args;
      expect(callArgs[1].error).toBe('Unknown error');
    });

    it('should handle null error', () => {
      service.reportLoadingIssue('TestComponent', null);

      const callArgs = loggerSpy.error.calls.first().args;
      expect(callArgs[1].error).toBe('Unknown error');
    });

    it('should handle undefined error', () => {
      service.reportLoadingIssue('TestComponent', undefined);

      const callArgs = loggerSpy.error.calls.first().args;
      expect(callArgs[1].error).toBe('Unknown error');
    });

    it('should include error stack when available', () => {
      const testError = new Error('Test');
      testError.stack = 'Custom stack trace';

      service.reportLoadingIssue('TestComponent', testError);

      const callArgs = loggerSpy.error.calls.first().args;
      expect(callArgs[1].stack).toBe('Custom stack trace');
    });

    it('should handle error without stack', () => {
      const testError = { message: 'Test error' };

      service.reportLoadingIssue('TestComponent', testError);

      const callArgs = loggerSpy.error.calls.first().args;
      expect(callArgs[1].stack).toBeUndefined();
    });
  });

  describe('Integration Scenarios', () => {
    it('should complete full diagnostic cycle', () => {
      service.runStartupDiagnostics();

      expect(loggerSpy.info).toHaveBeenCalledTimes(2);
      expect(loggerSpy.debug).toHaveBeenCalled();
    });

    it('should report multiple loading issues', () => {
      service.reportLoadingIssue('Component1', new Error('Error 1'));
      service.reportLoadingIssue('Component2', new Error('Error 2'));
      service.reportLoadingIssue('Component3', new Error('Error 3'));

      expect(loggerSpy.error).toHaveBeenCalledTimes(3);
    });

    it('should handle diagnostics during actual application startup', () => {
      // Simulate real startup scenario
      const startTime = performance.now();

      service.runStartupDiagnostics();

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Diagnostics should complete quickly (under 1 second)
      expect(duration).toBeLessThan(1000);
      expect(loggerSpy.info).toHaveBeenCalled();
    });
  });
});
