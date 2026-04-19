import { Directive, ElementRef, Output, EventEmitter, HostListener, Input, NgZone, OnDestroy } from '@angular/core';

@Directive({
  selector: '[focusScroll]',
  standalone: true
})
export class FocusScrollDirective {
  @Input() enableBottomPadding: boolean = false;
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
  private preFocusNudgeTimerId: number | undefined;
  private isViewportListenersAttached = false;
  private bottomPaddingApplied = false;
  private previousBodyPadding: string | null = null;
  private isScrolling = false;
  private lastPreFocusNudgeAt = 0;

  constructor(private el: ElementRef, private ngZone: NgZone) {}

  @HostListener('pointerdown', ['$event'])
  onPointerDown(event: PointerEvent): void {
    // Only pre-scroll for mobile touch interactions where virtual keyboard behavior applies.
    if (!this.isMobileDevice() || event.pointerType !== 'touch') {
      return;
    }

    this.schedulePreFocusNudge();
  }

  @HostListener('touchstart')
  onTouchStart(): void {
    // iOS Safari can miss pointerType='touch' in some webview/device combos.
    if (!this.isIOSDevice()) {
      return;
    }

    this.schedulePreFocusNudge();
  }

  @HostListener('focus', ['$event'])
  onFocus(event: FocusEvent) {
    void event;
    this.scrollStart.emit();

    this.clearTimers();
    this.detachViewportListeners();

    const isMobile = this.isMobileDevice();
    const useViewportAwareDelay = isMobile && this.delayDropdownOnMobile;
    const usedRecentPreFocusNudge = Date.now() - this.lastPreFocusNudgeAt < 260;
    const initialDelay = isMobile ? (usedRecentPreFocusNudge ? 70 : 180) : 40;
    
    this.isScrolling = true;

    this.initialScrollTimerId = window.setTimeout(() => {
      this.alignElementIntoView('smooth');

      if (useViewportAwareDelay) {
        this.attachViewportListeners();
        this.scheduleFollowupAlignment();
      }

      // If configured, apply an initial bottom padding to create headroom
      if (this.enableBottomPadding && this.isMobileDevice()) {
        // attach listeners so updateBottomPadding runs as viewport changes
        this.attachViewportListeners();
        // give an immediate conservative padding so dropdowns can position
        try {
          if (this.previousBodyPadding == null) {
            this.previousBodyPadding = document.body.style.paddingBottom || '';
          }
          document.body.style.paddingBottom = `${Math.max(280, Math.round((window.innerHeight || 0) * 0.35))}px`;
          document.documentElement.classList.add('rgv-bottom-padding-active');
          this.bottomPaddingApplied = true;
        } catch (e) { /* ignore */ }
        // keep updating once visualViewport changes
        this.updateBottomPadding();
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

  private isAndroidDevice(): boolean {
    return /Android/i.test(navigator.userAgent);
  }

  private isIOSDevice(): boolean {
    return /iPhone|iPad|iPod/i.test(navigator.userAgent);
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
      try {
        this.ngZone.runOutsideAngular(() => window.dispatchEvent(new Event('resize')));
      } catch (e) { }
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
      // Keep bottom padding in sync while the viewport animates
      if (this.enableBottomPadding) {
        this.updateBottomPadding();
      }
      // Let CDK/Material overlays respond by signaling a global resize
      try {
        this.ngZone.runOutsideAngular(() => window.dispatchEvent(new Event('resize')));
      } catch (e) {
        // ignore if dispatch fails
      }
      this.startSettleWindow();
    });
  };

  private updateBottomPadding(): void {
    try {
      const visualViewport = window.visualViewport;
      let padding = 0;

      if (visualViewport) {
        padding = Math.max(0, window.innerHeight - visualViewport.height);
      } else if (this.isMobileDevice()) {
        // Fallback: apply a reasonable default for mobile if visualViewport is unavailable
        padding = 300;
      }

      if (padding > 0) {
        if (this.previousBodyPadding == null) {
          this.previousBodyPadding = document.body.style.paddingBottom || '';
        }
        document.body.style.paddingBottom = `${padding}px`;
        document.documentElement.classList.add('rgv-bottom-padding-active');
        this.bottomPaddingApplied = true;
      }
    } catch (e) {
      // ignore any DOM exceptions
    }
  }

  private removeBottomPadding(): void {
    try {
      if (this.bottomPaddingApplied) {
        document.body.style.paddingBottom = this.previousBodyPadding ?? '';
        document.documentElement.classList.remove('rgv-bottom-padding-active');
        this.bottomPaddingApplied = false;
        this.previousBodyPadding = null;
      }
    } catch (e) {
      // ignore
    }
  }

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
    if (this.preFocusNudgeTimerId != null) {
      clearTimeout(this.preFocusNudgeTimerId);
      this.preFocusNudgeTimerId = undefined;
    }

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

  private schedulePreFocusNudge(): void {
    if (!this.isMobileDevice()) {
      return;
    }

    if (this.preFocusNudgeTimerId != null) {
      clearTimeout(this.preFocusNudgeTimerId);
    }

    this.preFocusNudgeTimerId = window.setTimeout(() => {
      const element = this.el.nativeElement as HTMLElement;
      const rect = element.getBoundingClientRect();
      const viewportHeight = window.visualViewport?.height ?? window.innerHeight;
      const bottomSafeZone = Math.round(viewportHeight * 0.82);

      // If input is near the bottom, nudge page up before keyboard resize starts.
      if (rect.bottom <= bottomSafeZone) {
        return;
      }

      const overflow = rect.bottom - bottomSafeZone;
      const currentPageY = window.pageYOffset || document.documentElement.scrollTop;
      const targetY = currentPageY + overflow + 12;

      this.lastPreFocusNudgeAt = Date.now();
      this.ngZone.runOutsideAngular(() => {
        window.scrollTo({
          top: Math.max(0, targetY),
          behavior: 'auto'
        });
      });
    }, 0);
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
    this.removeBottomPadding();

    this.scrollComplete.emit();
    if (!this.suppressDropdownAfterSelection) {
      this.dropdownReady.emit();
    }
  }
}