import { Directive, ElementRef, Output, EventEmitter, HostListener, Input, NgZone, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { ViewportService } from '@services/viewport.service';

@Directive({
  selector: '[focusScroll]',
  standalone: true
})
export class FocusScrollDirective implements OnDestroy {
  @Input() enableBottomPadding: boolean = false;
  @Input() delayDropdownOnMobile: boolean = true;
  @Input() suppressDropdownAfterSelection: boolean = false;
  // Single consolidated top buffer (px). Set to a reasonable default (header + extra).
  @Input() topBuffer = 100; // px total top buffer used to align focused fields
  
  @Output() scrollComplete = new EventEmitter<void>();
  @Output() scrollStart = new EventEmitter<void>();
  @Output() dropdownReady = new EventEmitter<void>();

  private initialScrollTimerId: number | undefined;
  private settleTimerId: number | undefined;
  private rafId: number | undefined;
  private maxScrollWindowTimerId: number | undefined;
  private isViewportListenersAttached = false;
  private userScrollCooldownTimerId: number | undefined;
  private suppressAutoAlignUntil = 0;
  private manualScrollOverride = false;
  private bottomPaddingApplied = false;
  private previousBodyPadding: string | null = null;
  private baselineBodyPadding = 0; // numeric px value read from computed style
  private extraPaddingApplied = 0; // numeric px added to allow extra scroll space
  private viewportSub: Subscription | undefined;
  private isScrolling = false;

  constructor(private el: ElementRef, private ngZone: NgZone, private viewport: ViewportService) {}

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
    this.manualScrollOverride = false;

    this.initialScrollTimerId = window.setTimeout(() => {
      if (useViewportAwareDelay) {
        this.attachViewportListeners();
      }

      // Apply bottom padding before the first scroll attempt so bottom-of-page
      // fields still have room to move upward when the keyboard opens.
      if (this.enableBottomPadding && this.isMobileDevice()) {
        try {
          const initialPad = Math.max(280, Math.round((window.innerHeight || 0) * 0.35));
          this.ensureExtraBottomPadding(initialPad);
        } catch (e) { /* ignore */ }
        this.updateBottomPadding();
      }

      this.alignElementIntoView('smooth');

      if (this.enableBottomPadding && this.isMobileDevice()) {
        try {
          this.ngZone.runOutsideAngular(() => window.dispatchEvent(new Event('resize')));
        } catch (e) { /* ignore */ }
        this.startSettleWindow();
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
    // Compute header buffer: use consolidated `topBuffer` value (px)
    const headerBuffer = Math.round(this.topBuffer || 0);
    const preferredTopInViewport = viewportTop + headerBuffer;

    const currentPageY = window.pageYOffset || document.documentElement.scrollTop;
    const targetY = rect.top + currentPageY - preferredTopInViewport;

    // Clamp target so we don't scroll past the end of the document
    const maxScroll = Math.max(0, document.documentElement.scrollHeight - viewportHeight);
    let clampedTarget = Math.min(Math.max(0, targetY), maxScroll);

    // If the ideal target is beyond the current max scroll (element is at page bottom)
    // try to add temporary extra bottom padding so the element can be scrolled up to the preferred position.
    if (targetY > maxScroll) {
      const extraNeeded = Math.ceil(targetY - maxScroll) + 24; // small safety margin
      const overlayHeight = this.getAttachedOverlayHeight();
      const extraToApply = Math.max(0, extraNeeded + (overlayHeight || 0));
      this.ensureExtraBottomPadding(extraToApply);

      // recompute maxScroll after padding change
      const newViewportHeight = visualViewport?.height ?? window.innerHeight;
      const newMaxScroll = Math.max(0, document.documentElement.scrollHeight - newViewportHeight);
      clampedTarget = Math.min(Math.max(0, targetY), newMaxScroll);
    }

    this.ngZone.runOutsideAngular(() => {
      window.scrollTo({
        top: clampedTarget,
        behavior
      });
    });
  }

  private getAttachedOverlayHeight(): number {
    try {
      const selectors = ['.mat-autocomplete-panel', '.cdk-overlay-pane', '[role="listbox"]'];
      let maxH = 0;
      for (const sel of selectors) {
        const nodes = Array.from(document.querySelectorAll(sel)) as HTMLElement[];
        for (const n of nodes) {
          if (!n.offsetParent) continue; // not visible
          const r = n.getBoundingClientRect();
          if (r.height > maxH) maxH = Math.round(r.height);
        }
      }
      return maxH;
    } catch (e) {
      return 0;
    }
  }

  private ensureExtraBottomPadding(px: number): void {
    try {
      if (this.previousBodyPadding == null) {
        this.previousBodyPadding = document.body.style.paddingBottom || '';
        this.baselineBodyPadding = Math.round(parseFloat(getComputedStyle(document.body).paddingBottom) || 0);
      }

      if (px <= this.extraPaddingApplied) {
        return;
      }

      this.extraPaddingApplied = px;
      const total = Math.max(0, this.baselineBodyPadding + this.extraPaddingApplied);
      document.body.style.paddingBottom = `${total}px`;
      document.documentElement.classList.add('rgv-bottom-padding-active');
      this.bottomPaddingApplied = true;
    } catch (e) {
      // ignore DOM exceptions
    }
  }

  
  private onViewportChange = (): void => {
    if (!this.isScrolling) {
      return;
    }
    if (this.rafId != null) {
      cancelAnimationFrame(this.rafId);
    }

    this.rafId = requestAnimationFrame(() => {
      const shouldSuppressAutoAlign = this.manualScrollOverride || Date.now() < this.suppressAutoAlignUntil;

      if (this.isMobileDevice() && !shouldSuppressAutoAlign) {
        this.alignElementIntoView('smooth');
      }

      if (this.enableBottomPadding) {
        this.updateBottomPadding();
      }

      try {
        const visualViewport = window.visualViewport;
        if (visualViewport) {
          const keyboardHeight = Math.max(0, (window.innerHeight || 0) - visualViewport.height - (visualViewport.offsetTop || 0));
          if (keyboardHeight < 60) {
            this.removeBottomPadding();
          }
        }
      } catch (e) {
        // ignore
      }

      try {
        this.ngZone.runOutsideAngular(() => window.dispatchEvent(new Event('resize')));
      } catch (e) {
        // ignore if dispatch fails
      }
      this.startSettleWindow();
    });
  };

  private onUserScrollGesture = (): void => {
    if (!this.isScrolling) {
      return;
    }

    // Prevent viewport-driven realignment from fighting manual scrolling.
    this.suppressAutoAlignUntil = Date.now() + 260;
    this.manualScrollOverride = true;

    if (this.userScrollCooldownTimerId != null) {
      clearTimeout(this.userScrollCooldownTimerId);
    }

    this.userScrollCooldownTimerId = window.setTimeout(() => {
      this.userScrollCooldownTimerId = undefined;
    }, 280);

    // When the user manually scrolls while extra bottom padding exists,
    // reduce the extra padding so they don't scroll through a large blank area.
    try {
      this.trimExtraPaddingForUserScroll();
    } catch (e) {
      // ignore
    }
    try {
      this.enforceMaxScrollDuringUserScroll();
    } catch (e) {
      // ignore
    }
  };

  private getViewportComputedPadding(): number {
    try {
      const snap = this.viewport?.getSnapshot?.();
      if (snap) {
        return Math.max(0, snap.windowInnerHeight - snap.height - snap.offsetTop);
      }
    } catch (e) {
      // fall through
    }

    if (window.visualViewport) {
      try {
        return Math.max(0, (window.innerHeight || 0) - window.visualViewport.height - (window.visualViewport.offsetTop || 0));
      } catch (e) {
        return 0;
      }
    }

    return 0;
  }

  private trimExtraPaddingForUserScroll(): void {
    // Only act when we've applied extra padding
    if (!this.bottomPaddingApplied || this.extraPaddingApplied <= 0) return;

    const viewportPad = Math.round(this.getViewportComputedPadding() || 0);
    // Desired extra to keep: at least viewportPad minus baselineBodyPadding
    const desiredExtra = Math.max(0, viewportPad - (this.baselineBodyPadding || 0));

    if (desiredExtra < this.extraPaddingApplied) {
      try {
        this.extraPaddingApplied = desiredExtra;
        const total = Math.max(0, (this.baselineBodyPadding || 0) + this.extraPaddingApplied);
        document.body.style.paddingBottom = `${total}px`;
        if (total === 0) {
          document.documentElement.classList.remove('rgv-bottom-padding-active');
          this.bottomPaddingApplied = false;
        } else {
          document.documentElement.classList.add('rgv-bottom-padding-active');
          this.bottomPaddingApplied = true;
        }
      } catch (e) {
        // ignore DOM exceptions
      }
    }
  }

  private enforceMaxScrollDuringUserScroll(): void {
    // After trimming padding, make sure the current scroll position isn't past
    // the new maximum scrollable position (so user can't scroll through blank space).
    const visualViewport = window.visualViewport;
    const viewportH = visualViewport?.height ?? window.innerHeight;
    const maxScroll = Math.max(0, document.documentElement.scrollHeight - viewportH);

    const currentY = window.pageYOffset || document.documentElement.scrollTop;
    if (currentY > maxScroll) {
      try {
        this.ngZone.runOutsideAngular(() => window.scrollTo({ top: maxScroll, behavior: 'auto' }));
      } catch (e) {
        // ignore
      }
    }
  }

  private updateBottomPadding(): void {
    try {
      let padding = 0;
      try {
        const snap = this.viewport?.getSnapshot?.();
        if (snap) {
          const raw = Math.max(0, snap.windowInnerHeight - snap.height - snap.offsetTop);
          padding = Math.round(raw);
        } else if (window.visualViewport) {
          const raw = Math.max(0, (window.innerHeight || 0) - window.visualViewport.height - (window.visualViewport.offsetTop || 0));
          padding = Math.round(raw);
        } else if (this.isMobileDevice()) {
          // Fallback: apply a reasonable default for mobile if visualViewport is unavailable
          padding = 300;
        }
      } catch (e) {
        // fall through to forced fallback
        if (this.isMobileDevice()) {
          padding = 300;
        }
      }

      if (padding > 0) {
        if (this.previousBodyPadding == null) {
          this.previousBodyPadding = document.body.style.paddingBottom || '';
          this.baselineBodyPadding = Math.round(parseFloat(getComputedStyle(document.body).paddingBottom) || 0);
        }

        // combine viewport-driven padding with any extra padding already applied
        const combined = Math.max(padding, this.extraPaddingApplied || 0);
        const total = Math.max(0, this.baselineBodyPadding + combined);
        document.body.style.paddingBottom = `${total}px`;
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
        // restore original padding
        document.body.style.paddingBottom = this.previousBodyPadding ?? '';
        document.documentElement.classList.remove('rgv-bottom-padding-active');
        this.bottomPaddingApplied = false;
        this.previousBodyPadding = null;
        this.baselineBodyPadding = 0;
        this.extraPaddingApplied = 0;
      }
    } catch (e) {
      // ignore
    }
  }

  private getKeyboardHeight(): number {
    try {
      const snap = this.viewport?.getSnapshot?.();
      if (snap) {
        return Math.max(0, snap.keyboardHeight || 0);
      }
    } catch (e) {
      // ignore
    }

    const visualViewport = window.visualViewport;
    if (!visualViewport) {
      return 0;
    }

    return Math.max(0, (window.innerHeight || 0) - visualViewport.height - (visualViewport.offsetTop || 0));
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
    if (this.isViewportListenersAttached) {
      return;
    }

    this.viewport.start();

    this.viewportSub = this.viewport.viewportChange$.subscribe(() => {
      this.onViewportChange();
    });

    this.ngZone.runOutsideAngular(() => {
      // Mobile-only: manual scrolling with virtual keyboard is touch-driven.
      window.addEventListener('touchstart', this.onUserScrollGesture, { passive: true });
      window.addEventListener('touchmove', this.onUserScrollGesture, { passive: true });
    });

    this.isViewportListenersAttached = true;
  }

  private detachViewportListeners(): void {
    if (!this.isViewportListenersAttached) {
      return;
    }

    try {
      this.viewportSub?.unsubscribe();
      this.viewportSub = undefined;
      this.viewport.stop();
      window.removeEventListener('touchstart', this.onUserScrollGesture);
      window.removeEventListener('touchmove', this.onUserScrollGesture);
    } catch (e) {
      // ignore
    }
    this.isViewportListenersAttached = false;
  }

  private clearTimers(): void {
    if (this.initialScrollTimerId != null) {
      clearTimeout(this.initialScrollTimerId);
      this.initialScrollTimerId = undefined;
    }

    

    if (this.settleTimerId != null) {
      clearTimeout(this.settleTimerId);
      this.settleTimerId = undefined;
    }

    if (this.maxScrollWindowTimerId != null) {
      clearTimeout(this.maxScrollWindowTimerId);
      this.maxScrollWindowTimerId = undefined;
    }

    if (this.userScrollCooldownTimerId != null) {
      clearTimeout(this.userScrollCooldownTimerId);
      this.userScrollCooldownTimerId = undefined;
    }

    if (this.rafId != null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = undefined;
    }
  }

  private finishScrolling(): void {
    const hostElement = this.el.nativeElement as HTMLElement;
    const isStillFocused = document.activeElement === hostElement;
    const keepPaddingWhileFocused =
      this.enableBottomPadding &&
      this.isMobileDevice() &&
      isStillFocused &&
      this.getKeyboardHeight() >= 60;

    if (!this.isScrolling) {
      this.clearTimers();
      this.detachViewportListeners();
      if (!keepPaddingWhileFocused) {
        this.removeBottomPadding();
      }
      return;
    }

    this.isScrolling = false;
    this.clearTimers();
    this.detachViewportListeners();
    if (!keepPaddingWhileFocused) {
      this.removeBottomPadding();
    }
    this.scrollComplete.emit();
    if (!this.suppressDropdownAfterSelection) {
      this.dropdownReady.emit();
    }
  }
}