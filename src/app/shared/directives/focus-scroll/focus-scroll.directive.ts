import { Directive, ElementRef, Output, EventEmitter, HostListener, Input, NgZone, OnDestroy } from '@angular/core';

@Directive({
  selector: '[focusScroll]',
  standalone: true
})
export class FocusScrollDirective {
  @Input() delayDropdownOnMobile: boolean = true;
  @Input() suppressDropdownAfterSelection: boolean = false;
  
  @Output() scrollComplete = new EventEmitter<void>();
  @Output() scrollStart = new EventEmitter<void>();
  @Output() dropdownReady = new EventEmitter<void>();

  private scrollTimeoutId: number | undefined;
  private initialScrollTimerId: number | undefined;
  private settleTimerId: number | undefined;
  private rafId: number | undefined;
  private maxScrollWindowTimerId: number | undefined;
  private isViewportListenersAttached = false;
  private isScrolling = false;

  constructor(private el: ElementRef, private ngZone: NgZone) {}

  @HostListener('focus', ['$event'])
  onFocus(event: FocusEvent) {
    void event;
    this.scrollStart.emit();

    this.clearTimers();
    this.detachViewportListeners();

    const isMobile = this.isMobileDevice();
    const useViewportAwareDelay = isMobile && this.delayDropdownOnMobile;
    const initialDelay = isMobile ? 180 : 40;
    
    this.isScrolling = true;

    this.initialScrollTimerId = window.setTimeout(() => {
      this.alignElementIntoView('smooth');

      if (useViewportAwareDelay) {
        this.attachViewportListeners();
        this.scheduleFollowupAlignment();
      }

      this.maxScrollWindowTimerId = window.setTimeout(() => {
        this.finishScrolling();
      }, useViewportAwareDelay ? 1400 : 260);
    }, initialDelay);
  }

  @HostListener('blur')
  onBlur() {
    this.finishScrolling();
  }

  ngOnDestroy(): void {
    this.finishScrolling();
  }

  private isMobileDevice(): boolean {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  public isCurrentlyScrolling(): boolean {
    return this.isScrolling;
  }

  private alignElementIntoView(behavior: ScrollBehavior): void {
    const element = this.el.nativeElement as HTMLElement;
    const rect = element.getBoundingClientRect();
    const visualViewport = window.visualViewport;

    const viewportTop = visualViewport?.offsetTop ?? 0;
    const viewportHeight = visualViewport?.height ?? window.innerHeight;
    const topPadding = this.isMobileDevice() ? 16 : 24;

    // Keep focused inputs around the top quarter of the visible viewport.
    const preferredTopInViewport = viewportTop + Math.max(topPadding, Math.round(viewportHeight * 0.24));

    const currentPageY = window.pageYOffset || document.documentElement.scrollTop;
    const targetY = rect.top + currentPageY - preferredTopInViewport;

    this.ngZone.runOutsideAngular(() => {
      window.scrollTo({
        top: Math.max(0, targetY),
        behavior
      });
    });
  }

  private scheduleFollowupAlignment(): void {
    this.scrollTimeoutId = window.setTimeout(() => {
      this.alignElementIntoView('auto');
      this.startSettleWindow();
    }, 120);
  }

  private onViewportChange = (): void => {
    if (!this.isScrolling) {
      return;
    }

    if (this.rafId != null) {
      cancelAnimationFrame(this.rafId);
    }

    this.rafId = requestAnimationFrame(() => {
      this.alignElementIntoView('auto');
      this.startSettleWindow();
    });
  };

  private startSettleWindow(): void {
    if (this.settleTimerId != null) {
      clearTimeout(this.settleTimerId);
    }

    this.settleTimerId = window.setTimeout(() => {
      this.finishScrolling();
    }, 260);
  }

  private attachViewportListeners(): void {
    if (this.isViewportListenersAttached || !window.visualViewport) {
      return;
    }

    this.ngZone.runOutsideAngular(() => {
      window.visualViewport?.addEventListener('resize', this.onViewportChange, { passive: true });
      window.visualViewport?.addEventListener('scroll', this.onViewportChange, { passive: true });
    });

    this.isViewportListenersAttached = true;
  }

  private detachViewportListeners(): void {
    if (!this.isViewportListenersAttached || !window.visualViewport) {
      return;
    }

    window.visualViewport.removeEventListener('resize', this.onViewportChange);
    window.visualViewport.removeEventListener('scroll', this.onViewportChange);
    this.isViewportListenersAttached = false;
  }

  private clearTimers(): void {
    if (this.initialScrollTimerId != null) {
      clearTimeout(this.initialScrollTimerId);
      this.initialScrollTimerId = undefined;
    }

    if (this.scrollTimeoutId != null) {
      clearTimeout(this.scrollTimeoutId);
      this.scrollTimeoutId = undefined;
    }

    if (this.settleTimerId != null) {
      clearTimeout(this.settleTimerId);
      this.settleTimerId = undefined;
    }

    if (this.maxScrollWindowTimerId != null) {
      clearTimeout(this.maxScrollWindowTimerId);
      this.maxScrollWindowTimerId = undefined;
    }

    if (this.rafId != null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = undefined;
    }
  }

  private finishScrolling(): void {
    if (!this.isScrolling) {
      this.clearTimers();
      this.detachViewportListeners();
      return;
    }

    this.isScrolling = false;
    this.clearTimers();
    this.detachViewportListeners();

    this.scrollComplete.emit();
    if (!this.suppressDropdownAfterSelection) {
      this.dropdownReady.emit();
    }
  }
}