import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth.service';
import { JwtHelperService } from '@auth0/angular-jwt';
import { LoggerService } from './logger.service';
import { SESSION_CONSTANTS } from '@constants/session.constants';

describe('AuthService', () => {
  let service: AuthService;
  let jwtHelperSpy: jasmine.SpyObj<JwtHelperService>;
  let loggerSpy: jasmine.SpyObj<LoggerService>;

  beforeEach(() => {
    const jwtSpy = jasmine.createSpyObj('JwtHelperService', ['isTokenExpired']);
    const logSpy = jasmine.createSpyObj('LoggerService', ['debug', 'error', 'info', 'warn']);

    TestBed.configureTestingModule({
      providers: [
        AuthService,
        { provide: JwtHelperService, useValue: jwtSpy },
        { provide: LoggerService, useValue: logSpy }
      ]
    });
    
    service = TestBed.inject(AuthService);
    jwtHelperSpy = TestBed.inject(JwtHelperService) as jasmine.SpyObj<JwtHelperService>;
    loggerSpy = TestBed.inject(LoggerService) as jasmine.SpyObj<LoggerService>;
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('isAuthenticated', () => {
    it('returns false when no token in sessionStorage', () => {
      sessionStorage.removeItem(SESSION_CONSTANTS.AUTH_TOKEN);

      const result = service.isAuthenticated();

      expect(result).toBeFalse();
    });

    it('returns true when token exists and is not expired', () => {
      sessionStorage.setItem(SESSION_CONSTANTS.AUTH_TOKEN, 'valid-token');
      jwtHelperSpy.isTokenExpired.and.returnValue(false as any);

      const result = service.isAuthenticated();

      expect(result).toBeTrue();
      expect(jwtHelperSpy.isTokenExpired).toHaveBeenCalled();
      expect(loggerSpy.debug).toHaveBeenCalledWith('Token expiration status', { isTokenExpired: false });
    });

    it('returns false when token is expired', () => {
      sessionStorage.setItem(SESSION_CONSTANTS.AUTH_TOKEN, 'expired-token');
      jwtHelperSpy.isTokenExpired.and.returnValue(true as any);

      const result = service.isAuthenticated();

      expect(result).toBeFalse();
      expect(jwtHelperSpy.isTokenExpired).toHaveBeenCalled();
      expect(loggerSpy.debug).toHaveBeenCalledWith('Token expiration status', { isTokenExpired: true });
    });

    it('logs token expiration status', () => {
      sessionStorage.setItem(SESSION_CONSTANTS.AUTH_TOKEN, 'test-token');
        jwtHelperSpy.isTokenExpired.and.returnValue(false as any);

      service.isAuthenticated();

      expect(loggerSpy.debug).toHaveBeenCalled();
    });
  });
});
