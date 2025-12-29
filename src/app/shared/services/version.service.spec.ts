import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { VersionService } from './version.service';

describe('VersionService', () => {
  let service: VersionService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [VersionService]
    });
    service = TestBed.inject(VersionService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('Service Initialization', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });
  });

  describe('getVersion', () => {
    it('should fetch version from version.json', async () => {
      const mockVersion = { version: '2024-12-28', build: '1' };
      
      const versionPromise = service.getVersion();
      
      const req = httpMock.expectOne('/assets/version.json');
      expect(req.request.method).toBe('GET');
      req.flush(mockVersion);

      const result = await versionPromise;
      expect(result).toEqual(mockVersion);
    });

    it('should return unknown version on HTTP error', async () => {
      const versionPromise = service.getVersion();
      
      const req = httpMock.expectOne('/assets/version.json');
      req.error(new ProgressEvent('error'));

      const result = await versionPromise;
      expect(result).toEqual({ version: 'unknown', build: 'unknown' });
    });

    it('should return unknown version on 404', async () => {
      const versionPromise = service.getVersion();
      
      const req = httpMock.expectOne('/assets/version.json');
      req.flush('Not found', { status: 404, statusText: 'Not Found' });

      const result = await versionPromise;
      expect(result).toEqual({ version: 'unknown', build: 'unknown' });
    });

    it('should handle multiple concurrent calls', async () => {
      const mockVersion = { version: '2024-12-28', build: '42' };
      
      const promise1 = service.getVersion();
      const promise2 = service.getVersion();
      
      const requests = httpMock.match('/assets/version.json');
      expect(requests.length).toBe(2);
      
      requests.forEach(req => req.flush(mockVersion));

      const [result1, result2] = await Promise.all([promise1, promise2]);
      expect(result1).toEqual(mockVersion);
      expect(result2).toEqual(mockVersion);
    });

    it('should handle server timeout', async () => {
      const versionPromise = service.getVersion();
      
      const req = httpMock.expectOne('/assets/version.json');
      req.error(new ProgressEvent('timeout'));

      const result = await versionPromise;
      expect(result).toEqual({ version: 'unknown', build: 'unknown' });
    });
  });

  describe('getFormattedVersion', () => {
    it('should format version with date and build', async () => {
      const mockVersion = { version: '2024-12-28', build: '1' };
      
      const formattedPromise = service.getFormattedVersion();
      
      const req = httpMock.expectOne('/assets/version.json');
      req.flush(mockVersion);

      const result = await formattedPromise;
      expect(result).toBe('2024.12.28.1');
    });

    it('should replace dashes with dots in date', async () => {
      const mockVersion = { version: '2024-01-15', build: '123' };
      
      const formattedPromise = service.getFormattedVersion();
      
      const req = httpMock.expectOne('/assets/version.json');
      req.flush(mockVersion);

      const result = await formattedPromise;
      expect(result).toBe('2024.01.15.123');
    });

    it('should return "unknown" when version is unknown', async () => {
      const mockVersion = { version: 'unknown', build: 'unknown' };
      
      const formattedPromise = service.getFormattedVersion();
      
      const req = httpMock.expectOne('/assets/version.json');
      req.flush(mockVersion);

      const result = await formattedPromise;
      expect(result).toBe('unknown');
    });

    it('should return "unknown" when version fetch fails', async () => {
      const formattedPromise = service.getFormattedVersion();
      
      const req = httpMock.expectOne('/assets/version.json');
      req.error(new ProgressEvent('error'));

      const result = await formattedPromise;
      expect(result).toBe('unknown');
    });

    it('should return "unknown" when build is unknown but version is valid', async () => {
      const mockVersion = { version: '2024-12-28', build: 'unknown' };
      
      const formattedPromise = service.getFormattedVersion();
      
      const req = httpMock.expectOne('/assets/version.json');
      req.flush(mockVersion);

      const result = await formattedPromise;
      expect(result).toBe('unknown');
    });

    it('should return "unknown" when version is unknown but build is valid', async () => {
      const mockVersion = { version: 'unknown', build: '42' };
      
      const formattedPromise = service.getFormattedVersion();
      
      const req = httpMock.expectOne('/assets/version.json');
      req.flush(mockVersion);

      const result = await formattedPromise;
      expect(result).toBe('unknown');
    });

    it('should handle build numbers with leading zeros', async () => {
      const mockVersion = { version: '2024-12-28', build: '007' };
      
      const formattedPromise = service.getFormattedVersion();
      
      const req = httpMock.expectOne('/assets/version.json');
      req.flush(mockVersion);

      const result = await formattedPromise;
      expect(result).toBe('2024.12.28.007');
    });

    it('should handle very long build numbers', async () => {
      const mockVersion = { version: '2024-12-28', build: '123456789' };
      
      const formattedPromise = service.getFormattedVersion();
      
      const req = httpMock.expectOne('/assets/version.json');
      req.flush(mockVersion);

      const result = await formattedPromise;
      expect(result).toBe('2024.12.28.123456789');
    });
  });

  describe('Edge Cases', () => {
    it('should handle response with missing fields', async () => {
      const mockVersion = { version: '2024-12-28' }; // Missing build
      
      const versionPromise = service.getVersion();
      
      const req = httpMock.expectOne('/assets/version.json');
      req.flush(mockVersion);

      const result = await versionPromise;
      // TypeScript expects both fields, but let's verify the behavior
      expect(result.version).toBe('2024-12-28');
    });

    it('should handle empty response', async () => {
      const versionPromise = service.getVersion();
      
      const req = httpMock.expectOne('/assets/version.json');
      req.flush({});

      const result = await versionPromise;
      expect(result).toBeDefined();
    });

    it('should handle network disconnection', async () => {
      const versionPromise = service.getVersion();
      
      const req = httpMock.expectOne('/assets/version.json');
      req.error(new ProgressEvent('error'), { 
        status: 0, 
        statusText: 'Unknown Error' 
      });

      const result = await versionPromise;
      expect(result).toEqual({ version: 'unknown', build: 'unknown' });
    });
  });
});
