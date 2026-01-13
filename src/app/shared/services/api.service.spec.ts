import { of, throwError } from 'rxjs';
import { ApiService } from './api.service';
import * as userUtil from '@utils/user-id.util';

describe('ApiService (focused tests)', () => {
  let httpSpy: any;
  let secureCookieSpy: any;
  let loggerSpy: any;
  let service: ApiService;

  beforeEach(() => {
    httpSpy = jasmine.createSpyObj('HttpClient', ['get', 'post', 'put']);
    secureCookieSpy = jasmine.createSpyObj('SecureCookieStorageService', ['getItem']);
    loggerSpy = jasmine.createSpyObj('LoggerService', ['error', 'debug', 'info', 'warn']);

    localStorage.setItem('userId', 'user-123');

    service = new ApiService(httpSpy, secureCookieSpy, loggerSpy);
  });

  afterEach(() => {
    localStorage.removeItem('userId');
  });

  it('clearRefreshToken returns response when http succeeds', async () => {
    const resp = { ok: true };
    httpSpy.post.and.returnValue(of(resp));

    const result = await service.clearRefreshToken();

    expect(result).toBe(resp);
    expect(loggerSpy.debug).toHaveBeenCalled();
  });

  it('listFiles sends Authorization and UserId headers when available', async () => {
    // provide access token from storage
    secureCookieSpy.getItem.and.callFake((key: string) => {
      if (key === 'ACCESS_TOKEN') return 'tok-abc';
      return null;
    });

    let capturedOptions: any = null;
    httpSpy.get.and.callFake((url: string, options: any) => {
      capturedOptions = options;
      return of([{ name: 'file1' }]);
    });

    const files = await service.listFiles();

    expect(files.length).toBe(1);
    // HttpHeaders exposes .get
    expect(capturedOptions.headers.get('Authorization')).toBe('Bearer tok-abc');
    expect(capturedOptions.headers.get('UserId')).toBe('user-123');
  });

  it('getSheetData follows S3 flow when response indicates isStoredInS3', async () => {
    // First call returns a payload indicating S3 link
    httpSpy.get.and.callFake((url: string, options?: any) => {
      if (url && url.indexOf('/sheets/all') !== -1) {
        return of({ isStoredInS3: true, s3Link: 'http://s3/link' });
      }
      if (url === 'http://s3/link') {
        return of({ sheetData: 42 });
      }
      return of(null);
    });

    const result = await service.getSheetData('sheet-id');
    expect(result as any).toEqual(jasmine.objectContaining({ sheetData: 42 }));
    // service tags S3 responses with _source = 's3'
    expect((result as any)._source).toBe('s3');
    expect(loggerSpy.debug).toHaveBeenCalled();
  });

  it('saveSheetData returns error message array when http.put fails', async () => {
    const sheet = { properties: { id: 's1', name: 'MySheet' } } as any;
    httpSpy.put.and.returnValue(throwError({ message: 'network fail' }));

    const res = await service.saveSheetData(sheet);
    expect(Array.isArray(res)).toBeTrue();
    expect(res[0].message).toContain('network fail');
  });
});
