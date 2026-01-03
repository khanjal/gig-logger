import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ApiService } from './api.service';
import { SecureCookieStorageService } from './secure-cookie-storage.service';
import { LoggerService } from './logger.service';
import { environment } from 'src/environments/environment';

class MockSecureCookieStorageService {
  private store = new Map<string, string>();
  getItem(key: string): string | null {
    return this.store.get(key) ?? null;
  }
  setItem(key: string, value: string): void {
    this.store.set(key, value);
  }
  removeItem(key: string): void {
    this.store.delete(key);
  }
}

class MockLoggerService {
  debug = jasmine.createSpy('debug');
  info = jasmine.createSpy('info');
  warn = jasmine.createSpy('warn');
  error = jasmine.createSpy('error');
}

describe('ApiService', () => {
  let service: ApiService;
  let httpMock: HttpTestingController;
  let cookie: MockSecureCookieStorageService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        ApiService,
        { provide: SecureCookieStorageService, useClass: MockSecureCookieStorageService },
        { provide: LoggerService, useClass: MockLoggerService },
      ],
    });

    service = TestBed.inject(ApiService);
    httpMock = TestBed.inject(HttpTestingController);
    cookie = TestBed.inject(SecureCookieStorageService) as any;
    localStorage.setItem('userId', 'user-123');
    cookie.setItem('ACCESS_TOKEN', 'token-abc');
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('includes auth and sheet headers when fetching sheet data', async () => {
    const promise = service.getSheetData('sheet-1');

    const req = httpMock.expectOne(`${environment.gigLoggerApi}/sheets/all`);
    expect(req.request.headers.get('Authorization')).toBe('Bearer token-abc');
    expect(req.request.headers.get('Sheet-Id')).toBe('sheet-1');
    expect(req.request.headers.get('UserId')).toBe('user-123');

    req.flush({ sheetEntity: { id: 'sheet-1', data: [] } });
    const result = await promise as any;
    expect(result.id).toBe('sheet-1');
    expect(result.data).toEqual([]);
  });

  xit('fetches data from S3 link when response is stored externally', async () => {
    const promise = service.getSheetData('sheet-1');

    const reqApi = httpMock.expectOne(`${environment.gigLoggerApi}/sheets/all`);
    reqApi.flush({ isStoredInS3: true, s3Link: 'https://s3.test/data.json' });

    // Find the S3 request, which may be queued after API flush
    const pending = httpMock.match(() => true);
    const reqS3 = pending.find(r => (r.request?.url || '').includes('s3.test'));
    expect(reqS3).toBeDefined();
    reqS3!.flush({ sheetEntity: { id: 'sheet-1', data: ['from-s3'] } });

    const result = await promise as any;
    expect(result.id).toBe('sheet-1');
    expect(result.data).toEqual(['from-s3']);
  });

  it('returns empty array on listFiles error', async () => {
    const promise = service.listFiles();
    const req = httpMock.expectOne(`${environment.gigLoggerApi}/files/list`);
    req.flush('err', { status: 500, statusText: 'Server Error' });
    const result = await promise;
    expect(result).toEqual([]);
  });
});