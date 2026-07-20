import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { commonTestingImports, commonTestingProviders } from '@test-harness';
import { AppComponent } from './app.component';
import { Subject } from 'rxjs';
import type { Event as RouterEvent, UrlTree } from '@angular/router';
import { Router, NavigationEnd } from '@angular/router';

describe('AppComponent', () => {
  let routerEvents$: Subject<RouterEvent>;
  let routerMock: Partial<Router>;

  beforeEach(async () => {
    routerEvents$ = new Subject<RouterEvent>();
    routerMock = {
      events: routerEvents$.asObservable(),
      createUrlTree: (..._args: unknown[]) => ({} as UrlTree),
      serializeUrl: (_: UrlTree) => '',
      navigateByUrl: (..._args: unknown[]) => Promise.resolve(true)
    };

    await TestBed.configureTestingModule({
      imports: [...commonTestingImports, AppComponent],
      providers: [...commonTestingProviders, { provide: Router, useValue: routerMock }]
    }).compileComponents();
  });

  afterEach(() => {
    try {
      Object.defineProperty(document, 'readyState', { value: 'complete', configurable: true });
    } catch {
      // ignore in constrained environments
    }
  });

  it('should create the app and have initial values', () => {
    try { Object.defineProperty(document, 'readyState', { value: 'loading', configurable: true }); } catch { /* ignore in constrained environments */ }
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
    expect(app.title).toBe('raptor-gig');
    expect(app.isLoading()).toBeTrue();
  });

  it('should set isLoading false if document.readyState is complete', () => {
    Object.defineProperty(document, 'readyState', { value: 'complete', configurable: true });

    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const app = fixture.componentInstance;
    expect(app.isLoading()).toBeFalse();
  });

  it('should hide loading after the initial timeout', fakeAsync(() => {
    try { Object.defineProperty(document, 'readyState', { value: 'loading', configurable: true }); } catch { /* ignore in constrained environments */ }
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const app = fixture.componentInstance;

    expect(app.isLoading()).toBeTrue();
    tick(3000);
    expect(app.isLoading()).toBeFalse();
  }));

  it('should hide loading when window load fires', () => {
    try { Object.defineProperty(document, 'readyState', { value: 'loading', configurable: true }); } catch { /* ignore in constrained environments */ }
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const app = fixture.componentInstance;

    expect(app.isLoading()).toBeTrue();

    window.dispatchEvent(new Event('load'));
    expect(app.isLoading()).toBeFalse();
  });

  it('should hide loading after NavigationEnd event', fakeAsync(() => {
    try { Object.defineProperty(document, 'readyState', { value: 'complete', configurable: true }); } catch { /* ignore in constrained environments */ }
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    app.ngOnInit();

    app.isLoading.set(true);
    routerEvents$.next(new NavigationEnd(1, '/foo', '/foo'));

    tick(100);
    expect(app.isLoading()).toBeFalse();
    app.ngOnDestroy();
  }));

  it('onHeaderError should set hasError true and stop loading', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;

    app.isLoading.set(true);
    app.hasError.set(false);

    app.onHeaderError();

    expect(app.hasError()).toBeTrue();
    expect(app.isLoading()).toBeFalse();
  });

  it('reload should call window.location.reload', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    fixture.detectChanges();

    const reloadSpy = jasmine.createSpy('reload');
    app.setReloadFn(reloadSpy);
    app.reload();
    expect(reloadSpy).toHaveBeenCalled();
  });

  it('ngOnDestroy should unsubscribe from router events', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const app = fixture.componentInstance;

    expect(app['routerSubscription']).toBeDefined();
    const unsubSpy = spyOn(app['routerSubscription']!, 'unsubscribe').and.callThrough();
    app.ngOnDestroy();
    expect(unsubSpy).toHaveBeenCalled();
  });
});
