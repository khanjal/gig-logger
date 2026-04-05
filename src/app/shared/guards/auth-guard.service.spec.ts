import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AuthGuardService } from './auth-guard.service';
import { AuthGoogleService } from '../services/auth-google.service';
import { SpreadsheetService } from '@services/spreadsheet.service';

describe('AuthGuardService', () => {
  let service: AuthGuardService;
  let authService: jasmine.SpyObj<AuthGoogleService>;
  let router: jasmine.SpyObj<Router>;
  let spreadsheetService: jasmine.SpyObj<SpreadsheetService>;

  beforeEach(() => {
    const authServiceSpy = jasmine.createSpyObj('AuthGoogleService', ['canSync']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    const spreadsheetSpy = jasmine.createSpyObj('SpreadsheetService', ['getSpreadsheets']);
    spreadsheetSpy.getSpreadsheets.and.returnValue(Promise.resolve([]));

    TestBed.configureTestingModule({
      providers: [
        AuthGuardService,
        { provide: AuthGoogleService, useValue: authServiceSpy },
        { provide: SpreadsheetService, useValue: spreadsheetSpy },
        { provide: Router, useValue: routerSpy }
      ]
    });

    service = TestBed.inject(AuthGuardService);
    authService = TestBed.inject(AuthGoogleService) as jasmine.SpyObj<AuthGoogleService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    spreadsheetService = TestBed.inject(SpreadsheetService) as jasmine.SpyObj<SpreadsheetService>;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('canActivate', () => {
    it('should return true when user is authenticated', async () => {
      authService.canSync.and.returnValue(Promise.resolve(true));

      const result = await service.canActivate();

      expect(result).toBe(true);
      expect(authService.canSync).toHaveBeenCalled();
      expect(router.navigate).not.toHaveBeenCalled();
    });

    it('should return false when user is not authenticated', async () => {
      authService.canSync.and.returnValue(Promise.resolve(false));

      const result = await service.canActivate();

      expect(result).toBe(false);
      expect(authService.canSync).toHaveBeenCalled();
      expect(router.navigate).toHaveBeenCalledWith(['setup']);
    });

    it('should navigate to setup page when not authenticated', async () => {
      authService.canSync.and.returnValue(Promise.resolve(false));

      await service.canActivate();

      expect(router.navigate).toHaveBeenCalledTimes(1);
      expect(router.navigate).toHaveBeenCalledWith(['setup']);
    });

    it('should handle authentication check errors', async () => {
      authService.canSync.and.returnValue(Promise.reject(new Error('Auth error')));

      try {
        await service.canActivate();
        fail('Expected error to be thrown');
      } catch (error) {
        expect(error).toBeTruthy();
        expect((error as Error).message).toBe('Auth error');
      }
    });

    it('should call isAuthenticated exactly once', async () => {
      authService.canSync.and.returnValue(Promise.resolve(true));

      await service.canActivate();

      expect(authService.canSync).toHaveBeenCalledTimes(1);
    });

    describe('local-only fallback', () => {
      beforeEach(() => {
        authService.canSync.and.returnValue(Promise.resolve(false));
      });

      it('should return true when unauthenticated but local spreadsheets exist', async () => {
        const fakeSheet = { id: 1, name: 'My Sheet' } as any;
        spreadsheetService.getSpreadsheets.and.returnValue(Promise.resolve([fakeSheet]));

        const result = await service.canActivate();

        expect(result).toBe(true);
        expect(router.navigate).not.toHaveBeenCalled();
      });

      it('should redirect to setup when unauthenticated and no local spreadsheets', async () => {
        spreadsheetService.getSpreadsheets.and.returnValue(Promise.resolve([]));

        const result = await service.canActivate();

        expect(result).toBe(false);
        expect(router.navigate).toHaveBeenCalledWith(['setup']);
      });

      it('should redirect to setup when getSpreadsheets throws', async () => {
        spreadsheetService.getSpreadsheets.and.returnValue(Promise.reject(new Error('DB error')));

        const result = await service.canActivate();

        expect(result).toBe(false);
        expect(router.navigate).toHaveBeenCalledWith(['setup']);
      });
    });
  });
  // Note: canActivateAuth functional guard tests are difficult to test in isolation
  // due to Angular's injection context requirements. The service tests above
  // cover the core logic that the functional guard uses.
});
