import { Component, DebugElement } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { BehaviorSubject } from 'rxjs';
import { FocusScrollDirective } from './focus-scroll.directive';
import { ViewportService } from '@services/viewport.service';

class MockViewportService {
  private subj = new BehaviorSubject({ height: 500, offsetTop: 0, keyboardHeight: 200, windowInnerHeight: 800 });
  public viewportChange$ = this.subj.asObservable();
  public start = jasmine.createSpy('start');
  public stop = jasmine.createSpy('stop');
  public getSnapshot() { return this.subj.getValue(); }
  public emit(v: any) { this.subj.next(v); }
}

@Component({
  standalone: true,
  imports: [FocusScrollDirective],
  template: `<input focusScroll [enableBottomPadding]="enableBottomPadding" [delayDropdownOnMobile]="delay" [suppressDropdownAfterSelection]="suppress">`
})
class HostComponent {
  enableBottomPadding = false;
  delay = true;
  suppress = false;
}

describe('FocusScrollDirective (integration)', () => {
  let fixture: ComponentFixture<HostComponent>;
  let inputDe: DebugElement;
  let mockViewport: MockViewportService;
  const originalUserAgent = navigator.userAgent;

  beforeEach(() => {
    mockViewport = new MockViewportService();

    TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: [{ provide: ViewportService, useValue: mockViewport }]
    }).compileComponents();

    fixture = TestBed.createComponent(HostComponent);
    // Do not run initial change detection here; individual tests will
    // call `fixture.detectChanges()` after they set up host inputs to
    // avoid ExpressionChangedAfterItHasBeenCheckedError when tests flip
    // bound boolean inputs mid-flight.
  });

  afterEach(() => {
    Object.defineProperty(navigator, 'userAgent', { value: originalUserAgent, configurable: true });
    document.body.style.paddingBottom = '';
    document.documentElement.classList.remove('rgv-bottom-padding-active');
  });

  it('does nothing on non-mobile focus', fakeAsync(() => {
    Object.defineProperty(navigator, 'userAgent', { value: 'Mozilla/5.0 (Windows NT)', configurable: true });
    fixture.detectChanges();
    inputDe = fixture.debugElement.query(By.css('input'));
    const dir = inputDe.injector.get(FocusScrollDirective) as FocusScrollDirective;

    spyOn(dir.scrollStart, 'emit');
    inputDe.nativeElement.dispatchEvent(new Event('focus'));
    tick(500);
    expect(dir.scrollStart.emit).not.toHaveBeenCalled();
    expect(dir.isCurrentlyScrolling()).toBeFalse();
  }));

  it('applies and removes bottom padding on mobile focus+blur', fakeAsync(() => {
    Object.defineProperty(navigator, 'userAgent', { value: 'iPhone', configurable: true });

    fixture.componentInstance.enableBottomPadding = true;
    fixture.detectChanges();
    inputDe = fixture.debugElement.query(By.css('input'));
    const dir = inputDe.injector.get(FocusScrollDirective) as FocusScrollDirective;

    spyOn(window, 'scrollTo');

    // simulate keyboard opening snapshot
    mockViewport.emit({ height: 300, offsetTop: 0, keyboardHeight: 100, windowInnerHeight: 800 });

    fixture.ngZone!.run(() => inputDe.nativeElement.dispatchEvent(new Event('focus')));
    tick(200);
    fixture.detectChanges();
    tick(5); // allow async viewport/raf tasks to settle
    fixture.detectChanges();

    expect(document.documentElement.classList.contains('rgv-bottom-padding-active')).toBeTrue();
    expect(parseInt(document.body.style.paddingBottom || '0', 10)).toBeGreaterThan(0);

    // blur should finish scrolling and remove padding
    fixture.ngZone!.run(() => inputDe.nativeElement.dispatchEvent(new Event('blur')));
    tick(50);
    fixture.detectChanges();
    tick(5);
    fixture.detectChanges();

    expect(dir.isCurrentlyScrolling()).toBeFalse();
    expect(document.documentElement.classList.contains('rgv-bottom-padding-active')).toBeFalse();
    expect(window.scrollTo).toHaveBeenCalled();
  }));

  it('removes bottom padding when viewport reports keyboard hidden', fakeAsync(() => {
    // start with focus and applied padding
    Object.defineProperty(navigator, 'userAgent', { value: 'iPhone', configurable: true });
    fixture.componentInstance.enableBottomPadding = true;
    fixture.detectChanges();
    inputDe = fixture.debugElement.query(By.css('input'));

    fixture.ngZone!.run(() => inputDe.nativeElement.dispatchEvent(new Event('focus')));
    tick(200);
    fixture.detectChanges();
    tick(5);
    fixture.detectChanges();

    // simulate padding having been applied
    document.body.style.paddingBottom = '300px';
    document.documentElement.classList.add('rgv-bottom-padding-active');

    // viewport reports keyboard hidden
    mockViewport.emit({ height: 800, offsetTop: 0, keyboardHeight: 0, windowInnerHeight: 800 });
    tick(120);
    fixture.detectChanges();
    tick(1);
    fixture.detectChanges();

    expect(document.documentElement.classList.contains('rgv-bottom-padding-active')).toBeFalse();
  }));

  it('emits scrollComplete and dropdownReady after scroll window', fakeAsync(() => {
    Object.defineProperty(navigator, 'userAgent', { value: 'iPhone', configurable: true });
    fixture.detectChanges();
    inputDe = fixture.debugElement.query(By.css('input'));
    const dir = inputDe.injector.get(FocusScrollDirective) as FocusScrollDirective;
    let complete = false;
    let ready = false;
    dir.scrollComplete.subscribe(() => complete = true);
    dir.dropdownReady.subscribe(() => ready = true);

    inputDe.nativeElement.dispatchEvent(new Event('focus'));
    tick(1700);
    fixture.detectChanges();

    expect(complete).toBeTrue();
    expect(ready).toBeTrue();
  }));
});
