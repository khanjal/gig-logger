import { TestBed } from '@angular/core/testing';
import { LoggerService } from './logger.service';

describe('LoggerService', () => {
  let service: LoggerService;
  let consoleSpy: jasmine.Spy;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LoggerService);
  });

  afterEach(() => {
    if (consoleSpy) {
      consoleSpy.calls.reset();
    }
  });

  describe('Service Initialization', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });

    it('should have onLog observable', () => {
      expect(service.onLog).toBeDefined();
    });
  });

  describe('info', () => {
    beforeEach(() => {
      consoleSpy = spyOn(console, 'info');
    });

    it('should log info message to console with [INFO] prefix', () => {
      service.info('Test message');
      expect(console.info).toHaveBeenCalledWith('[INFO]: Test message');
    });

    it('should emit log event with info level', (done) => {
      service.onLog.subscribe((log) => {
        expect(log.level).toBe('info');
        expect(log.message).toBe('Test message');
        done();
      });
      service.info('Test message');
    });

    it('should handle optional parameters', () => {
      const obj = { key: 'value' };
      service.info('Message with params', obj, 123);
      expect(console.info).toHaveBeenCalledWith('[INFO]: Message with params', obj, 123);
    });

    it('should handle multiple calls', () => {
      service.info('First message');
      service.info('Second message');
      expect(console.info).toHaveBeenCalledTimes(2);
    });

    it('should handle empty messages', () => {
      service.info('');
      expect(console.info).toHaveBeenCalledWith('[INFO]: ');
    });
  });

  describe('warn', () => {
    beforeEach(() => {
      consoleSpy = spyOn(console, 'warn');
    });

    it('should log warn message to console with [WARN] prefix', () => {
      service.warn('Warning message');
      expect(console.warn).toHaveBeenCalledWith('[WARN]: Warning message');
    });

    it('should emit log event with warn level', (done) => {
      service.onLog.subscribe((log) => {
        expect(log.level).toBe('warn');
        expect(log.message).toBe('Warning message');
        done();
      });
      service.warn('Warning message');
    });

    it('should handle optional parameters', () => {
      const error = new Error('test');
      service.warn('Warning with error', error);
      expect(console.warn).toHaveBeenCalledWith('[WARN]: Warning with error', error);
    });

    it('should handle multiple calls', () => {
      service.warn('First warning');
      service.warn('Second warning');
      expect(console.warn).toHaveBeenCalledTimes(2);
    });
  });

  describe('error', () => {
    beforeEach(() => {
      consoleSpy = spyOn(console, 'error');
    });

    it('should log error message to console with [ERROR] prefix', () => {
      service.error('Error message');
      expect(console.error).toHaveBeenCalledWith('[ERROR]: Error message');
    });

    it('should emit log event with error level', (done) => {
      service.onLog.subscribe((log) => {
        expect(log.level).toBe('error');
        expect(log.message).toBe('Error message');
        done();
      });
      service.error('Error message');
    });

    it('should handle optional parameters', () => {
      const error = new Error('Critical error');
      const stackTrace = { line: 42, file: 'test.ts' };
      service.error('Error with details', error, stackTrace);
      expect(console.error).toHaveBeenCalledWith('[ERROR]: Error with details', error, stackTrace);
    });

    it('should handle Error objects', () => {
      const error = new Error('Test error');
      service.error('Exception occurred', error);
      expect(console.error).toHaveBeenCalledWith('[ERROR]: Exception occurred', error);
    });

    it('should handle multiple error calls', () => {
      service.error('First error');
      service.error('Second error');
      expect(console.error).toHaveBeenCalledTimes(2);
    });
  });

  describe('debug', () => {
    beforeEach(() => {
      consoleSpy = spyOn(console, 'debug');
    });

    it('should log debug message to console with [DEBUG] prefix', () => {
      service.debug('Debug message');
      expect(console.debug).toHaveBeenCalledWith('[DEBUG]: Debug message');
    });

    it('should not emit to onLog observable', (done) => {
      let emitted = false;
      const subscription = service.onLog.subscribe(() => {
        emitted = true;
      });
      
      service.debug('Debug message');
      
      setTimeout(() => {
        expect(emitted).toBe(false);
        subscription.unsubscribe();
        done();
      }, 50);
    });

    it('should handle optional parameters', () => {
      const obj = { debug: true, data: [1, 2, 3] };
      service.debug('Debug with data', obj);
      expect(console.debug).toHaveBeenCalledWith('[DEBUG]: Debug with data', obj);
    });

    it('should handle complex objects', () => {
      const complexObj = {
        nested: { deep: { value: 'test' } },
        array: [1, 2, 3],
        func: () => {}
      };
      service.debug('Complex debug', complexObj);
      expect(console.debug).toHaveBeenCalledWith('[DEBUG]: Complex debug', complexObj);
    });
  });

  describe('Log Observable', () => {
    beforeEach(() => {
      spyOn(console, 'info');
      spyOn(console, 'warn');
      spyOn(console, 'error');
    });

    it('should emit multiple log events in sequence', (done) => {
      const logs: any[] = [];
      
      service.onLog.subscribe((log) => {
        logs.push(log);
        
        if (logs.length === 3) {
          expect(logs[0]).toEqual({ level: 'info', message: 'First' });
          expect(logs[1]).toEqual({ level: 'warn', message: 'Second' });
          expect(logs[2]).toEqual({ level: 'error', message: 'Third' });
          done();
        }
      });

      service.info('First');
      service.warn('Second');
      service.error('Third');
    });

    it('should allow multiple subscribers', (done) => {
      let subscriber1Called = false;
      let subscriber2Called = false;

      service.onLog.subscribe(() => {
        subscriber1Called = true;
      });

      service.onLog.subscribe(() => {
        subscriber2Called = true;
        
        if (subscriber1Called && subscriber2Called) {
          done();
        }
      });

      service.info('Test message');
    });

    it('should not emit for debug logs', (done) => {
      let emitted = false;
      
      const subscription = service.onLog.subscribe(() => {
        emitted = true;
      });

      spyOn(console, 'debug');
      service.debug('Debug message');

      setTimeout(() => {
        expect(emitted).toBe(false);
        subscription.unsubscribe();
        done();
      }, 50);
    });
  });

  describe('Message Formatting', () => {
    beforeEach(() => {
      spyOn(console, 'info');
      spyOn(console, 'warn');
      spyOn(console, 'error');
    });

    it('should handle special characters in messages', () => {
      service.info('Message with special chars: @#$%^&*()');
      expect(console.info).toHaveBeenCalledWith('[INFO]: Message with special chars: @#$%^&*()');
    });

    it('should handle newlines in messages', () => {
      service.warn('Line 1\nLine 2\nLine 3');
      expect(console.warn).toHaveBeenCalledWith('[WARN]: Line 1\nLine 2\nLine 3');
    });

    it('should handle unicode characters', () => {
      service.error('Unicode: 你好世界 🚀');
      expect(console.error).toHaveBeenCalledWith('[ERROR]: Unicode: 你好世界 🚀');
    });

    it('should handle very long messages', () => {
      const longMessage = 'A'.repeat(1000);
      service.info(longMessage);
      expect(console.info).toHaveBeenCalledWith(`[INFO]: ${longMessage}`);
    });
  });
});
