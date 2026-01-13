import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { commonTestingImports, commonTestingProviders } from '@test-harness';
import { AppComponent } from './app.component';
import { Subject } from 'rxjs';
import { Router, NavigationEnd } from '@angular/router';

describe('AppComponent', () => {
  let routerEvents$: Subject<any>;
  let routerMock: Partial<Router>;

  beforeEach(async () => {
    routerEvents$ = new Subject<any>();
    routerMock = {
      events: routerEvents$.asObservable(),
      createUrlTree: (..._args: any[]) => ({} as any),
      serializeUrl: (_: any) => '',
      navigateByUrl: (..._args: any[]) => Promise.resolve(true)
    };

    await TestBed.configureTestingModule({
      imports: [...commonTestingImports, AppComponent],
      providers: [...commonTestingProviders, { provide: Router, useValue: routerMock }]
    }).compileComponents();
  });

  afterEach(() => {
    try {
      Object.defineProperty(document, 'readyState', { value: 'complete', configurable: true });
    } catch (e) {
      // ignore in constrained environments
    }
  });

  it('should create the app and have initial values', () => {
    try { Object.defineProperty(document, 'readyState', { value: 'loading', configurable: true }); } catch {}
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
    expect(app.title).toBe('raptor-gig');
    expect(app.isLoading).toBeTrue();
  });

  it('should set isLoading false if document.readyState is complete', () => {
    Object.defineProperty(document, 'readyState', { value: 'complete', configurable: true });

    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const app = fixture.componentInstance;
    expect(app.isLoading).toBeFalse();
  });

  it('should hide loading after the initial timeout', fakeAsync(() => {
    try { Object.defineProperty(document, 'readyState', { value: 'loading', configurable: true }); } catch {}
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const app = fixture.componentInstance;

    expect(app.isLoading).toBeTrue();
    tick(3000);
    expect(app.isLoading).toBeFalse();
  }));

  it('should hide loading when window load fires', fakeAsync(() => {
    try { Object.defineProperty(document, 'readyState', { value: 'loading', configurable: true }); } catch {}
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const app = fixture.componentInstance;

    expect(app.isLoading).toBeTrue();

    // dispatch load event and allow any listener to run
    window.dispatchEvent(new Event('load'));
    tick();
    expect(app.isLoading).toBeFalse();
  }));

  it('should hide loading after NavigationEnd event', fakeAsync(() => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const app = fixture.componentInstance;

    app.isLoading = true;
    routerEvents$.next(new NavigationEnd(1, '/foo', '/foo'));

    tick(100);
    expect(app.isLoading).toBeFalse();
  }));

  it('onHeaderError should set hasError true and stop loading', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;

    app.isLoading = true;
    app.hasError = false;

    app.onHeaderError();

    expect(app.hasError).toBeTrue();
    expect(app.isLoading).toBeFalse();
  });

  it('reload should call window.location.reload', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    fixture.detectChanges();

    const reloadSpy = jasmine.createSpy('reload');
    (app as any).setReloadFn(reloadSpy);
    app.reload();
    expect(reloadSpy).toHaveBeenCalled();
  });

  it('ngOnDestroy should unsubscribe from router events', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const app: any = fixture.componentInstance;

    expect(app.routerSubscription).toBeDefined();
    const unsubSpy = spyOn(app.routerSubscription, 'unsubscribe').and.callThrough();
    app.ngOnDestroy();
    expect(unsubSpy).toHaveBeenCalled();
  });
});
