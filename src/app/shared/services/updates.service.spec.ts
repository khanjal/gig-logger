import { TestBed } from '@angular/core/testing';

import { UpdatesService } from './updates.service';

describe('UpdatesService', () => {
  let service: UpdatesService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(UpdatesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should return updates as observable', (done) => {
    service.getUpdates().subscribe(updates => {
      expect(updates).toBeTruthy();
      expect(Array.isArray(updates)).toBe(true);
      expect(updates.length).toBeGreaterThan(0);
      done();
    });
  });

  it('should have update entries with required properties', (done) => {
    service.getUpdates().subscribe(updates => {
      updates.forEach(entry => {
        expect(entry.date).toBeTruthy();
        expect(entry.dateLabel).toBeTruthy();
        expect(Array.isArray(entry.updates)).toBe(true);
        expect(entry.updates.length).toBeGreaterThan(0);
      });
      done();
    });
  });

  it('should have weekly entries marked correctly', (done) => {
    service.getUpdates().subscribe(updates => {
      const weeklyEntries = updates.filter(u => u.isWeekly);
      expect(weeklyEntries.length).toBeGreaterThan(0);
      weeklyEntries.forEach(entry => {
        expect(entry.isWeekly).toBe(true);
        expect(entry.dateLabel).toContain('-');
      });
      done();
    });
  });

  it('should include the initial commit', (done) => {
    service.getUpdates().subscribe(updates => {
      const hasInitialCommit = updates.some(u => u.date === '2022-08-19-21');
      expect(hasInitialCommit).toBe(true);
      done();
    });
  });
});
