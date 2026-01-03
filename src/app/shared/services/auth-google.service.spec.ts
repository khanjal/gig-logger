import { TestBed } from '@angular/core/testing';
import { AuthGoogleService } from './auth-google.service';
import { OAuthService } from 'angular-oauth2-oidc';
import { LoggerService } from './logger.service';
import { SecureCookieStorageService } from './secure-cookie-storage.service';
import { GigWorkflowService } from './gig-workflow.service';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AUTH_CONSTANTS } from '@constants/auth.constants';

describe('AuthGoogleService', () => {
  let service: AuthGoogleService;
  let httpMock: HttpTestingController;
  let oauthSpy: jasmine.SpyObj<OAuthService>;
  let loggerSpy: jasmine.SpyObj<LoggerService>;
  let storageSpy: jasmine.SpyObj<SecureCookieStorageService>;
  let workflowSpy: jasmine.SpyObj<GigWorkflowService>;

  beforeEach(() => {
    oauthSpy = jasmine.createSpyObj('OAuthService', ['setStorage', 'configure', 'loadDiscoveryDocument', 'initCodeFlow', 'logOut']);
    loggerSpy = jasmine.createSpyObj('LoggerService', ['info', 'error', 'warn', 'debug']);
    storageSpy = jasmine.createSpyObj('SecureCookieStorageService', ['getItem', 'setItem', 'removeItem']);
    workflowSpy = jasmine.createSpyObj('GigWorkflowService', ['setRefreshToken', 'clearRefreshToken', 'refreshAuthToken']);

    oauthSpy.loadDiscoveryDocument.and.returnValue(Promise.resolve({} as any));
    oauthSpy.configure.and.stub();

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        { provide: OAuthService, useValue: oauthSpy },
        { provide: LoggerService, useValue: loggerSpy },
        { provide: SecureCookieStorageService, useValue: storageSpy },
        { provide: GigWorkflowService, useValue: workflowSpy },
        AuthGoogleService
      ]
    });

    service = TestBed.inject(AuthGoogleService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
    expect(oauthSpy.setStorage).toHaveBeenCalledWith(storageSpy);
  });

  describe('login', () => {
    it('initiates code flow and logs', () => {
      service.login();
      expect(loggerSpy.info).toHaveBeenCalledWith('Initiating login flow');
      expect(oauthSpy.initCodeFlow).toHaveBeenCalled();
    });
  });

  describe('refreshToken', () => {
    it('stores token, loads profile, and sets auth state', async () => {
      const token = 'token123';
      workflowSpy.refreshAuthToken.and.returnValue(Promise.resolve({ accessToken: token } as any));
      storageSpy.getItem.and.returnValue(token);

      const promise = service.refreshToken();
      // Let async tasks schedule before matching the request
      await Promise.resolve();

      const req = httpMock.expectOne('https://www.googleapis.com/oauth2/v3/userinfo');
      expect(req.request.method).toBe('GET');
      req.flush({ sub: 'user-1', name: 'Test User' });

      await promise;

      expect(storageSpy.setItem).toHaveBeenCalledWith(AUTH_CONSTANTS.ACCESS_TOKEN, token);
      expect(service.profile$.getValue()?.sub).toBe('user-1');
      expect(localStorage.getItem('is_authenticated')).toBe('true');
      expect(loggerSpy.info).toHaveBeenCalledWith('Access token refreshed and validated successfully');
      expect(localStorage.getItem('authenticatedUserId')).toBe('user-1');
    });

    it('logs out on 401/403 refresh failures', async () => {
      workflowSpy.refreshAuthToken.and.returnValue(Promise.reject({ status: 401 }));
      spyOn(service, 'logout').and.returnValue(Promise.resolve());

      await expectAsync(service.refreshToken()).toBeRejected();
      expect(loggerSpy.error).toHaveBeenCalled();
      expect(service.logout).toHaveBeenCalled();
    });
  });

  describe('getProfile', () => {
    it('returns null when no token present', async () => {
      storageSpy.getItem.and.returnValue(null);
      const result = await service.getProfile();
      expect(result).toBeNull();
    });

    it('loads user profile when token present', async () => {
      storageSpy.getItem.and.returnValue('token');
      const promise = service.getProfile();
      const req = httpMock.expectOne('https://www.googleapis.com/oauth2/v3/userinfo');
      req.flush({ sub: 'abc' });
      const result = await promise;
      expect(result?.sub).toBe('abc');
    });
  });

  describe('isAuthenticatedSync', () => {
    it('reflects presence of access token', () => {
      storageSpy.getItem.and.returnValue('token');
      expect(service.isAuthenticatedSync()).toBeTrue();
      storageSpy.getItem.and.returnValue(null);
      expect(service.isAuthenticatedSync()).toBeFalse();
    });
  });

  describe('logout', () => {
    it('clears remote token and local state', async () => {
      workflowSpy.clearRefreshToken.and.returnValue(Promise.resolve());

      await service.logout();

      expect(workflowSpy.clearRefreshToken).toHaveBeenCalled();
      expect(storageSpy.removeItem).toHaveBeenCalledWith(AUTH_CONSTANTS.ACCESS_TOKEN);
      expect(oauthSpy.logOut).toHaveBeenCalled();
      expect(service.profile$.getValue()).toBeNull();
      expect(localStorage.getItem('is_authenticated')).toBe('false');
    });
  });
});
