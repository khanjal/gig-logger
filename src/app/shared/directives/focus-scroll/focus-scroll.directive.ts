import { Directive, ElementRef, Output, EventEmitter, HostListener, Input, NgZone, OnDestroy } from '@angular/core';
import { ViewportService } from '@services/viewport.service';

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

  private initialScrollTimerId: number | undefined;
  private settleTimerId: number | undefined;
  private rafId: number | undefined;
  private maxScrollWindowTimerId: number | undefined;
  private isViewportListenersAttached = false;
  private bottomPaddingApplied = false;
  private previousBodyPadding: string | null = null;
  // Simplified: remove temporary-padding heuristics to avoid jumps
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

    this.initialScrollTimerId = window.setTimeout(() => {
      if (useViewportAwareDelay) {
        this.attachViewportListeners();
      }

      // Apply bottom padding before the first scroll attempt so bottom-of-page
      // fields still have room to move upward when the keyboard opens.
      if (this.enableBottomPadding && this.isMobileDevice()) {
        try {
          if (this.previousBodyPadding == null) {
            this.previousBodyPadding = document.body.style.paddingBottom || '';
          }
          document.body.style.paddingBottom = `${Math.max(280, Math.round((window.innerHeight || 0) * 0.35))}px`;
          document.documentElement.classList.add('rgv-bottom-padding-active');
          this.bottomPaddingApplied = true;
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
    const topPadding = this.isMobileDevice() ? 16 : 24;
    // Prefer a position closer to the top of the visible area to avoid
    // jumping focused inputs to the middle of the screen.
    const preferredTopInViewport = viewportTop + Math.max(topPadding, Math.round(viewportHeight * 0.12));

    const currentPageY = window.pageYOffset || document.documentElement.scrollTop;
    const targetY = rect.top + currentPageY - preferredTopInViewport;

    // Determine any visible overlay (autocomplete/dropdown) attached to this
    // input so we can ensure the overlay/list is visible above the keyboard.
    const panelHeight = this.getAttachedOverlayHeight(element);

    // Compute keyboard inset (space taken by virtual keyboard) when visualViewport is available
    const keyboardInset = Math.max(0, (window.innerHeight || 0) - (visualViewport?.height ?? window.innerHeight) - (visualViewport?.offsetTop ?? 0));

    // Ensure element + overlay will be visible above keyboard after scrolling.
    const bottomSpacing = this.isMobileDevice() ? 12 : 8; // extra breathing room
    const allowedVisibleBottom = viewportHeight - keyboardInset - panelHeight - bottomSpacing;

    const elementBottomInPage = rect.bottom + currentPageY;
    const minTargetToExposeBottom = elementBottomInPage - (viewportTop + allowedVisibleBottom);

    let finalTarget = targetY;
    if (minTargetToExposeBottom > finalTarget) {
      finalTarget = minTargetToExposeBottom;
    }

    // Clamp target so we don't scroll past the end of the document
    const maxScroll = Math.max(0, document.documentElement.scrollHeight - viewportHeight);
    const clampedTarget = Math.min(Math.max(0, finalTarget), maxScroll);

    this.ngZone.runOutsideAngular(() => {
      window.scrollTo({
        top: clampedTarget,
        behavior
      });
    });
  }

  private getAttachedOverlayHeight(host: HTMLElement): number {
    try {
      // Common selectors for overlays / autocomplete lists
      const selectors = ['.mat-autocomplete-panel', '[role="listbox"]', '.cdk-overlay-pane'];
      const hostRect = host.getBoundingClientRect();

      for (const sel of selectors) {
        const nodes = Array.from(document.querySelectorAll<HTMLElement>(sel));
        for (const n of nodes) {
          if (!n.offsetParent) continue; // not visible
          const r = n.getBoundingClientRect();
          // prefer overlays that appear directly below the host or overlap horizontally
          const isBelow = r.top >= hostRect.bottom - 4;
          const horizOverlap = !(r.right < hostRect.left || r.left > hostRect.right + 200);
          if (isBelow && horizOverlap) {
            return Math.round(r.height || 0);
          }
        }
      }
    } catch (e) {
      // ignore
    }
    return 0;
  }

  
  private onViewportChange = (): void => {
    if (!this.isScrolling) {
      return;
    }
    if (this.rafId != null) {
      cancelAnimationFrame(this.rafId);
    }

    this.rafId = requestAnimationFrame(() => {
      // Always align on viewport changes when focused. Use 'auto' to avoid
      // smooth interruptions while the user is interacting.
      if (this.isMobileDevice()) {
        this.alignElementIntoView('auto');
      }

      if (this.enableBottomPadding) {
        this.updateBottomPadding();
      }

      // If keyboard hidden, remove padding immediately.
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
    if (this.isViewportListenersAttached) {
      return;
    }

    this.viewport.start();

    // Subscribe and treat any viewport snapshot change as a cue to re-evaluate.
    this.viewport.viewportChange$.subscribe(() => {
      if (!this.isScrolling) return;
      this.onViewportChange();
    });

    this.isViewportListenersAttached = true;
  }

  private detachViewportListeners(): void {
    if (!this.isViewportListenersAttached) {
      return;
    }

    try {
      this.viewport.stop();
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

    if (this.rafId != null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = undefined;
    }
  }

  private finishScrolling(): void {
    const hostElement = this.el.nativeElement as HTMLElement;
    const isStillFocused = document.activeElement === hostElement;
    const keepPaddingWhileFocused = this.enableBottomPadding && this.isMobileDevice() && isStillFocused;

    // no temporary padding flags to reset in simplified mode

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