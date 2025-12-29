import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AuthGuardService, canActivateAuth } from './auth-guard.service';
import { AuthGoogleService } from '../services/auth-google.service';

describe('AuthGuardService', () => {
  let service: AuthGuardService;
  let authService: jasmine.SpyObj<AuthGoogleService>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(() => {
    const authServiceSpy = jasmine.createSpyObj('AuthGoogleService', ['isAuthenticated']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [
        AuthGuardService,
        { provide: AuthGoogleService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    });

    service = TestBed.inject(AuthGuardService);
    authService = TestBed.inject(AuthGoogleService) as jasmine.SpyObj<AuthGoogleService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('canActivate', () => {
    it('should return true when user is authenticated', async () => {
      authService.isAuthenticated.and.returnValue(Promise.resolve(true));

      const result = await service.canActivate();

      expect(result).toBe(true);
      expect(authService.isAuthenticated).toHaveBeenCalled();
      expect(router.navigate).not.toHaveBeenCalled();
    });

    it('should return false when user is not authenticated', async () => {
      authService.isAuthenticated.and.returnValue(Promise.resolve(false));

      const result = await service.canActivate();

      expect(result).toBe(false);
      expect(authService.isAuthenticated).toHaveBeenCalled();
      expect(router.navigate).toHaveBeenCalledWith(['setup']);
    });

    it('should navigate to setup page when not authenticated', async () => {
      authService.isAuthenticated.and.returnValue(Promise.resolve(false));

      await service.canActivate();

      expect(router.navigate).toHaveBeenCalledTimes(1);
      expect(router.navigate).toHaveBeenCalledWith(['setup']);
    });

    it('should handle authentication check errors', async () => {
      authService.isAuthenticated.and.returnValue(Promise.reject(new Error('Auth error')));

      try {
        await service.canActivate();
        fail('Expected error to be thrown');
      } catch (error) {
        expect(error).toBeTruthy();
        expect((error as Error).message).toBe('Auth error');
      }
    });

    it('should call isAuthenticated exactly once', async () => {
      authService.isAuthenticated.and.returnValue(Promise.resolve(true));

      await service.canActivate();

      expect(authService.isAuthenticated).toHaveBeenCalledTimes(1);
    });
  });
  // Note: canActivateAuth functional guard tests are difficult to test in isolation
  // due to Angular's injection context requirements. The service tests above
  // cover the core logic that the functional guard uses.
});
