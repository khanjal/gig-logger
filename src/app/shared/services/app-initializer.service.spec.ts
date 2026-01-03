import { TestBed } from '@angular/core/testing';
import { AppInitializerService } from './app-initializer.service';
import { LoggerService } from './logger.service';
import { DiagnosticService } from './diagnostic.service';

describe('AppInitializerService', () => {
  let service: AppInitializerService;
  let loggerSpy: jasmine.SpyObj<LoggerService>;
  let diagnosticSpy: jasmine.SpyObj<DiagnosticService>;

  beforeEach(() => {
    const logSpy = jasmine.createSpyObj('LoggerService', ['info', 'error']);
    const diagSpy = jasmine.createSpyObj('DiagnosticService', ['runStartupDiagnostics', 'reportLoadingIssue']);

    TestBed.configureTestingModule({
      providers: [
        AppInitializerService,
        { provide: LoggerService, useValue: logSpy },
        { provide: DiagnosticService, useValue: diagSpy },
      ],
    });

    service = TestBed.inject(AppInitializerService);
    loggerSpy = TestBed.inject(LoggerService) as jasmine.SpyObj<LoggerService>;
    diagnosticSpy = TestBed.inject(DiagnosticService) as jasmine.SpyObj<DiagnosticService>;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('initializes and marks complete', async () => {
    await service.initialize();

    expect(service.isInitialized()).toBeTrue();
    expect(loggerSpy.info).toHaveBeenCalledWith('Starting app initialization...');
    expect(diagnosticSpy.runStartupDiagnostics).toHaveBeenCalled();
  });

  it('returns immediately if already initialized', async () => {
    await service.initialize();
    loggerSpy.info.calls.reset();

    await service.initialize();

    expect(loggerSpy.info).not.toHaveBeenCalledWith('Starting app initialization...');
  });

  it('waits for ongoing initialization', async () => {
    const firstCall = service.initialize();
    const secondCall = service.initialize();

    await Promise.all([firstCall, secondCall]);

    expect(service.isInitialized()).toBeTrue();
  });

  it('handles errors gracefully and marks complete', async () => {
    diagnosticSpy.runStartupDiagnostics.and.throwError('Test error');

    await service.initialize();

    expect(service.isInitialized()).toBeTrue();
    expect(loggerSpy.error).toHaveBeenCalledWith('App initialization failed', jasmine.any(Error));
    expect(diagnosticSpy.reportLoadingIssue).toHaveBeenCalled();
  });
});
