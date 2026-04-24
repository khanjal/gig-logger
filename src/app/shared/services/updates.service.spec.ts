import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { filter, take } from 'rxjs/operators';

import { UpdatesService } from '@services/updates.service';

describe('UpdatesService', () => {
  let service: UpdatesService;
  let httpMock: HttpTestingController;

  const sampleUpdates = [
    {
      date: '2022-08-19-21',
      dateLabel: '2022-08-19',
      isRollup: false,
      updates: [{ title: 'Initial commit', description: 'Project created' }]
    },
    {
      date: '2023-01-01-01',
      dateLabel: '2023-01-01',
      isRollup: true,
      updates: [{ title: 'Release', description: 'First release' }]
    }
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    service = TestBed.inject(UpdatesService);
    httpMock = TestBed.inject(HttpTestingController);

    const req = httpMock.expectOne('assets/updates.json');
    req.flush(sampleUpdates);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should return updates as observable', (done) => {
    service.getUpdates().pipe(filter((u: any[]) => u.length > 0), take(1)).subscribe(updates => {
      expect(updates).toBeTruthy();
      expect(Array.isArray(updates)).toBe(true);
      expect(updates.length).toBeGreaterThan(0);
      done();
    });
  });

  it('should have update entries with required properties', (done) => {
    service.getUpdates().pipe(filter((u: any[]) => u.length > 0), take(1)).subscribe(updates => {
      updates.forEach(entry => {
        expect(entry.date).toBeTruthy();
        expect(entry.dateLabel).toBeTruthy();
        expect(Array.isArray(entry.updates)).toBe(true);
        expect(entry.updates.length).toBeGreaterThan(0);
      });
      done();
    });
  });

  it('should have rollup entries marked correctly', (done) => {
    service.getUpdates().pipe(filter((u: any[]) => u.length > 0), take(1)).subscribe(updates => {
      const rollupEntries = updates.filter((u: any) => u.isRollup);
      expect(rollupEntries.length).toBeGreaterThan(0);
      rollupEntries.forEach((entry: any) => {
        expect(entry.isRollup).toBeTrue();
        expect(entry.dateLabel).toContain('-');
      });
      done();
    });
  });

  it('should include the initial commit', (done) => {
    service.getUpdates().pipe(filter((u: any[]) => u.length > 0), take(1)).subscribe(updates => {
      const hasInitialCommit = updates.some((u: any) => u.date === '2022-08-19-21');
      expect(hasInitialCommit).toBeTrue();
      done();
    });
  });

  afterEach(() => {
    httpMock.verify();
  });
});
