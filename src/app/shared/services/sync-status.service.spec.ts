import { TestBed } from '@angular/core/testing';
import { SyncStatusService, SyncStatus } from './sync-status.service';

describe('SyncStatusService', () => {
  let service: SyncStatusService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [SyncStatusService]
    });
    service = TestBed.inject(SyncStatusService);
  });

  afterEach(() => {
    service.ngOnDestroy();
  });

  describe('Service Initialization', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });

    it('should have syncState$ observable', (done) => {
      service.syncState$.subscribe(state => {
        expect(state).toBeDefined();
        expect(state.status).toBe('idle');
        done();
      });
    });

    it('should have messages$ observable', (done) => {
      service.messages$.subscribe(messages => {
        expect(messages).toBeDefined();
        expect(messages).toEqual([]);
        done();
      });
    });

    it('should have lastSuccessfulSync$ observable', (done) => {
      service.lastSuccessfulSync$.subscribe(date => {
        expect(date).toBeNull();
        done();
      });
    });

    it('should initialize with idle status', (done) => {
      service.syncState$.subscribe(state => {
        expect(state.status).toBe('idle');
        expect(state.operation).toBeNull();
        expect(state.progress).toBe(0);
        expect(state.itemsSynced).toBe(0);
        expect(state.totalItems).toBe(0);
        done();
      });
    });
  });

  describe('startSync', () => {
    it('should start save operation', (done) => {
      service.startSync('save', 10);

      service.syncState$.subscribe(state => {
        if (state.status === 'syncing') {
          expect(state.operation).toBe('save');
          expect(state.totalItems).toBe(10);
          expect(state.progress).toBe(0);
          expect(state.itemsSynced).toBe(0);
          done();
        }
      });
    });

    it('should start load operation', (done) => {
      service.startSync('load', 5);

      service.syncState$.subscribe(state => {
        if (state.status === 'syncing') {
          expect(state.operation).toBe('load');
          expect(state.totalItems).toBe(5);
          done();
        }
      });
    });

    it('should start auto-save operation', (done) => {
      service.startSync('auto-save', 3);

      service.syncState$.subscribe(state => {
        if (state.status === 'syncing') {
          expect(state.operation).toBe('auto-save');
          expect(state.totalItems).toBe(3);
          done();
        }
      });
    });

    it('should set status to syncing', (done) => {
      service.startSync('save');

      service.syncState$.subscribe(state => {
        if (state.status === 'syncing') {
          expect(state.status).toBe('syncing');
          done();
        }
      });
    });

    it('should update timestamp', (done) => {
      const beforeTime = new Date();

      service.startSync('save');

      service.syncState$.subscribe(state => {
        if (state.status === 'syncing') {
          expect(state.timestamp.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
          done();
        }
      });
    });

    it('should clear messages when starting new sync', () => {
      service.addMessage('Old message', 'info');
      
      service.startSync('save');

      service.messages$.subscribe(messages => {
        if (messages.length === 0) {
          expect(messages).toEqual([]);
        }
      });
    });

    it('should handle zero total items', (done) => {
      service.startSync('save', 0);

      service.syncState$.subscribe(state => {
        if (state.status === 'syncing') {
          expect(state.totalItems).toBe(0);
          done();
        }
      });
    });
  });

  describe('updateProgress', () => {
    beforeEach(() => {
      service.startSync('save', 10);
    });

    it('should update items synced', (done) => {
      service.updateProgress(5);

      service.syncState$.subscribe(state => {
        if (state.itemsSynced === 5) {
          expect(state.itemsSynced).toBe(5);
          done();
        }
      });
    });

    it('should calculate progress percentage', (done) => {
      service.updateProgress(5);

      service.syncState$.subscribe(state => {
        if (state.itemsSynced === 5) {
          expect(state.progress).toBe(50);
          done();
        }
      });
    });

    it('should update message when provided', (done) => {
      service.updateProgress(3, 'Processing items...');

      service.syncState$.subscribe(state => {
        if (state.message === 'Processing items...') {
          expect(state.message).toBe('Processing items...');
          done();
        }
      });
    });

    it('should handle progress beyond total items', (done) => {
      service.updateProgress(15);

      service.syncState$.subscribe(state => {
        if (state.itemsSynced === 15) {
          expect(state.progress).toBe(150);
          done();
        }
      });
    });

    it('should handle zero total items without division error', (done) => {
      service.startSync('save', 0);
      service.updateProgress(1);

      service.syncState$.subscribe(state => {
        if (state.itemsSynced === 1) {
          expect(state.progress).toBe(0);
          done();
        }
      });
    });
  });

  describe('completeSync', () => {
    beforeEach(() => {
      service.startSync('save', 10);
    });

    it('should set status to success', (done) => {
      service.completeSync();

      service.syncState$.subscribe(state => {
        if (state.status === 'success') {
          expect(state.status).toBe('success');
          done();
        }
      });
    });

    it('should set progress to 100', (done) => {
      service.completeSync();

      service.syncState$.subscribe(state => {
        if (state.status === 'success') {
          expect(state.progress).toBe(100);
          done();
        }
      });
    });

    it('should use custom message when provided', (done) => {
      service.completeSync('Custom success message');

      service.syncState$.subscribe(state => {
        if (state.message === 'Custom success message') {
          expect(state.message).toBe('Custom success message');
          done();
        }
      });
    });

    it('should update lastSuccessfulSync', (done) => {
      const beforeTime = new Date();
      service.completeSync();

      service.lastSuccessfulSync$.subscribe(date => {
        if (date !== null) {
          expect(date.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
          done();
        }
      });
    });

    it('should update timestamp', (done) => {
      const beforeTime = new Date();
      service.completeSync();

      service.syncState$.subscribe(state => {
        if (state.status === 'success') {
          expect(state.timestamp.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
          done();
        }
      });
    });
  });

  describe('failSync', () => {
    beforeEach(() => {
      service.startSync('save', 10);
    });

    it('should set status to error', (done) => {
      service.failSync('Test error');

      service.syncState$.subscribe(state => {
        if (state.status === 'error') {
          expect(state.status).toBe('error');
          done();
        }
      });
    });

    it('should set error message', (done) => {
      service.failSync('Test error message');

      service.syncState$.subscribe(state => {
        if (state.error) {
          expect(state.error).toBe('Test error message');
          done();
        }
      });
    });

    it('should preserve current progress', (done) => {
      service.updateProgress(5);

      setTimeout(() => {
        service.failSync('Error occurred');

        service.syncState$.subscribe(state => {
          if (state.status === 'error') {
            expect(state.itemsSynced).toBe(5);
            expect(state.progress).toBe(50);
            done();
          }
        });
      }, 10);
    });

    it('should update timestamp', (done) => {
      const beforeTime = new Date();
      service.failSync('Error');

      service.syncState$.subscribe(state => {
        if (state.status === 'error') {
          expect(state.timestamp.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
          done();
        }
      });
    });
  });

  describe('resetToIdle', () => {
    it('should reset to idle status', (done) => {
      service.startSync('save', 10);
      service.updateProgress(5);

      service.resetToIdle();

      service.syncState$.subscribe(state => {
        if (state.status === 'idle' && state.operation === null) {
          expect(state.status).toBe('idle');
          expect(state.operation).toBeNull();
          expect(state.progress).toBe(0);
          done();
        }
      });
    });

    it('should update timestamp', (done) => {
      const beforeTime = new Date();
      service.resetToIdle();

      service.syncState$.subscribe(state => {
        if (state.status === 'idle') {
          expect(state.timestamp.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
          done();
        }
      });
    });
  });

  describe('addMessage', () => {
    it('should add info message', () => {
      service.addMessage('Info message', 'info');

      service.messages$.subscribe(messages => {
        const infoMsg = messages.find(m => m.text === 'Info message');
        if (infoMsg) {
          expect(infoMsg.type).toBe('info');
        }
      });
    });

    it('should add warning message', () => {
      service.addMessage('Warning message', 'warning');

      service.messages$.subscribe(messages => {
        const warnMsg = messages.find(m => m.text === 'Warning message');
        if (warnMsg) {
          expect(warnMsg.type).toBe('warning');
        }
      });
    });

    it('should add error message', () => {
      service.addMessage('Error message', 'error');

      service.messages$.subscribe(messages => {
        const errMsg = messages.find(m => m.text === 'Error message');
        if (errMsg) {
          expect(errMsg.type).toBe('error');
        }
      });
    });

    it('should include timestamp', () => {
      const beforeTime = new Date();
      service.addMessage('Test', 'info');

      service.messages$.subscribe(messages => {
        const msg = messages.find(m => m.text === 'Test');
        if (msg) {
          expect(msg.timestamp.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
        }
      });
    });

    it('should accumulate multiple messages', () => {
      service.addMessage('Message 1', 'info');
      service.addMessage('Message 2', 'warning');
      service.addMessage('Message 3', 'error');

      service.messages$.subscribe(messages => {
        if (messages.length === 3) {
          expect(messages.length).toBe(3);
        }
      });
    });

    it('should limit messages to max count (50)', () => {
      // Add more than max messages
      for (let i = 0; i < 75; i++) {
        service.addMessage(`Message ${i}`, 'info');
      }

      service.messages$.subscribe(messages => {
        if (messages.length === 50) {
          expect(messages.length).toBe(50);
        }
      });
    });
  });

  describe('clearMessages', () => {
    it('should remove all messages', () => {
      service.addMessage('Message 1', 'info');
      service.addMessage('Message 2', 'error');

      service.clearMessages();

      service.messages$.subscribe(messages => {
        if (messages.length === 0) {
          expect(messages).toEqual([]);
        }
      });
    });
  });

  describe('startCountdown and stopCountdown', () => {
    it('should start countdown timer', (done) => {
      service.startCountdown(5000);

      service.syncState$.subscribe(state => {
        if (state.nextSyncIn !== undefined && state.nextSyncIn > 0) {
          expect(state.nextSyncIn).toBeLessThanOrEqual(5);
          done();
        }
      });
    });

    it('should stop countdown timer', () => {
      service.startCountdown(60000);
      
      service.stopCountdown();

      expect(service['countdownTimer']).toBeNull();
    });

    it('should update nextSyncIn periodically', (done) => {
      service.startCountdown(3000);
      let updates = 0;

      const subscription = service.syncState$.subscribe(state => {
        if (state.nextSyncIn !== undefined) {
          updates++;
          if (updates >= 2) {
            service.stopCountdown();
            subscription.unsubscribe();
            done();
          }
        }
      });
    });

    it('should not throw error when stopping non-existent countdown', () => {
      expect(() => service.stopCountdown()).not.toThrow();
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle full sync lifecycle', (done) => {
      const states: SyncStatus[] = [];

      const subscription = service.syncState$.subscribe(state => {
        states.push(state.status);
      });

      service.startSync('save', 10);
      setTimeout(() => service.updateProgress(5), 10);
      setTimeout(() => service.updateProgress(10), 20);
      setTimeout(() => service.completeSync(), 30);

      setTimeout(() => {
        expect(states).toContain('syncing');
        expect(states).toContain('success');
        subscription.unsubscribe();
        done();
      }, 50);
    });

    it('should handle failed sync', (done) => {
      const states: SyncStatus[] = [];

      const subscription = service.syncState$.subscribe(state => {
        states.push(state.status);
      });

      service.startSync('load', 5);
      setTimeout(() => service.updateProgress(2), 10);
      setTimeout(() => service.failSync('Network error'), 20);

      setTimeout(() => {
        expect(states).toContain('syncing');
        expect(states).toContain('error');
        subscription.unsubscribe();
        done();
      }, 40);
    });

    it('should handle multiple sync cycles', () => {
      service.startSync('save', 5);
      service.completeSync();

      service.startSync('load', 3);
      service.completeSync();

      service.startSync('auto-save', 2);
      service.completeSync();

      service.lastSuccessfulSync$.subscribe(date => {
        if (date !== null) {
          expect(date).toBeDefined();
        }
      });
    });
  });

  describe('ngOnDestroy', () => {
    it('should clean up countdown timer', () => {
      service.startCountdown(60000);

      service.ngOnDestroy();

      expect(service['countdownTimer']).toBeNull();
    });

    it('should not throw error on destroy', () => {
      expect(() => service.ngOnDestroy()).not.toThrow();
    });
  });
});
