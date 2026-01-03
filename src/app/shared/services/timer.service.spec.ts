import { TestBed } from '@angular/core/testing';
import { TimerService } from './timer.service';

describe('TimerService', () => {
  let service: TimerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TimerService);
  });

  describe('Service Initialization', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });
  });

  describe('delay', () => {
    it('should return a Promise', () => {
      const result = service.delay(100);
      expect(result).toBeInstanceOf(Promise);
    });

    it('should resolve after specified milliseconds', async () => {
      const startTime = Date.now();
      await service.delay(50);
      const endTime = Date.now();
      
      expect(endTime - startTime).toBeGreaterThanOrEqual(40); // Some tolerance
    });

    it('should handle zero delay', async () => {
      const startTime = Date.now();
      await service.delay(0);
      const endTime = Date.now();
      
      expect(endTime - startTime).toBeLessThan(50); // Should be nearly instant
    });

    it('should handle very short delays', async () => {
      const startTime = Date.now();
      await service.delay(10);
      const endTime = Date.now();
      
      expect(endTime - startTime).toBeGreaterThanOrEqual(5);
    });

    it('should resolve with undefined', async () => {
      const result = await service.delay(10);
      expect(result).toBeUndefined();
    });

    it('should work with async/await', async () => {
      const execOrder: number[] = [];
      
      execOrder.push(1);
      await service.delay(10);
      execOrder.push(2);
      
      expect(execOrder).toEqual([1, 2]);
    });

    it('should allow chaining', async () => {
      let value = 0;

      await service.delay(10)
        .then(() => {
          value = 1;
          return service.delay(10);
        })
        .then(() => {
          value = 2;
        });

      expect(value).toBe(2);
    });

    it('should handle multiple concurrent delays', async () => {
      const results: number[] = [];
      const start = Date.now();
      
      // Start all delays concurrently
      const promises = [
        service.delay(30).then(() => results.push(1)),
        service.delay(20).then(() => results.push(2)),
        service.delay(10).then(() => results.push(3))
      ];

      await Promise.all(promises);
      const elapsed = Date.now() - start;
      
      // All should complete, shortest first
      expect(results).toContain(1);
      expect(results).toContain(2);
      expect(results).toContain(3);
      // Should take ~30ms, not 60ms (concurrent, not sequential)
      expect(elapsed).toBeLessThan(100);
    });
  });

  describe('Integration Scenarios', () => {
    it('should be useful for timeout patterns', async () => {
      let timedOut = false;

      await service.delay(10).then(() => {
        timedOut = true;
      });

      expect(timedOut).toBe(true);
    });

    it('should be useful for sequential operations', async () => {
      const results: string[] = [];
      
      results.push('start');
      await service.delay(10);
      results.push('middle');
      await service.delay(10);
      results.push('end');
      
      expect(results).toEqual(['start', 'middle', 'end']);
    });

    it('should handle promise rejection gracefully', async () => {
      // Delay promise itself never rejects, but we can chain
      try {
        await service.delay(10).then(() => {
          throw new Error('Test error');
        });
        fail('Should have thrown');
      } catch (error: any) {
        expect(error.message).toBe('Test error');
      }
    });
  });
});
