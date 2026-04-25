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
  @Input() topBuffer = 100;

  @Output() scrollComplete = new EventEmitter<void>();
  @Output() scrollStart = new EventEmitter<void>();
  @Output() dropdownReady = new EventEmitter<void>();

  private initialScrollTimerId: number | undefined;
  private maxScrollWindowTimerId: number | undefined;
  private rafId: number | undefined;
  private isViewportListenersAttached = false;
  private viewportSub: Subscription | undefined;
  private isScrolling = false;

  // Padding state
  private previousBodyPadding: string | null = null;
  private baselineBodyPadding = 0;
  private paddingApplied = 0;

  constructor(private el: ElementRef, private ngZone: NgZone, private viewport: ViewportService) {}

  @HostListener('focus')
  onFocus() {
    if (!this.isMobileDevice()) return;

    this.scrollStart.emit();
    this.clearTimers();
    this.detachViewportListeners();

    const useViewportAwareDelay = this.delayDropdownOnMobile;
    const initialDelay = 180;

    this.isScrolling = true;

    this.initialScrollTimerId = window.setTimeout(() => {
      if (useViewportAwareDelay) {
        this.attachViewportListeners();

        if (this.enableBottomPadding) {
          const speculativePad = Math.max(300, Math.round((window.innerHeight || 0) * 0.4));
          this.applyBottomPadding(speculativePad);
        } else if (this.getKeyboardHeight() >= 60) {
          this.alignElementIntoView('smooth');
        }
      } else {
        this.alignElementIntoView('smooth');
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

  public isCurrentlyScrolling(): boolean {
    return this.isScrolling;
  }

  private isMobileDevice(): boolean {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  private getKeyboardHeight(): number {
    try {
      const snapshot = this.viewport?.getSnapshot?.();
      if (snapshot) return Math.max(0, snapshot.keyboardHeight || 0);
    } catch (e) { /* ignore */ }

    const visualViewport = window.visualViewport;
    if (!visualViewport) return 0;
    return Math.max(0, (window.innerHeight || 0) - visualViewport.height - (visualViewport.offsetTop || 0));
  }

  private alignElementIntoView(behavior: ScrollBehavior): void {
    const element = this.el.nativeElement as HTMLElement;
    const visualViewport = window.visualViewport;
    const viewportTop = visualViewport?.offsetTop ?? 0;
    const viewportHeight = visualViewport?.height ?? window.innerHeight;
    const preferredTopInViewport = viewportTop + Math.round(this.topBuffer || 0);

    const currentPageY = window.pageYOffset || document.documentElement.scrollTop;
    const targetY = element.getBoundingClientRect().top + currentPageY - preferredTopInViewport;

    // If keyboard is open, ensure we have enough padding for targetY to be reachable.
    if (this.enableBottomPadding) {
      const keyboardHeight = this.getKeyboardHeight();
      if (keyboardHeight >= 60) {
        const currentMaxScroll = Math.max(0, document.documentElement.scrollHeight - viewportHeight);
        if (targetY > currentMaxScroll) {
          const extraNeeded = Math.ceil(targetY - currentMaxScroll) + 32 + this.getAttachedOverlayHeight();
          this.applyBottomPadding(extraNeeded);
        }
      }
    }

    // scrollHeight updates synchronously after paddingBottom change.
    const maxScroll = Math.max(0, document.documentElement.scrollHeight - viewportHeight);
    const clampedTarget = Math.min(Math.max(0, targetY), maxScroll);
    this.ngZone.runOutsideAngular(() => window.scrollTo({ top: clampedTarget, behavior }));
  }

  private getAttachedOverlayHeight(): number {
    try {
      let maxHeight = 0;
      for (const selector of ['.mat-autocomplete-panel', '.cdk-overlay-pane', '[role="listbox"]']) {
        for (const node of Array.from(document.querySelectorAll<HTMLElement>(selector))) {
          if (!node.offsetParent) continue;
          const height = Math.round(node.getBoundingClientRect().height);
          if (height > maxHeight) maxHeight = height;
        }
      }
      return maxHeight;
    } catch (e) {
      return 0;
    }
  }

  private applyBottomPadding(extraPadding: number): void {
    if (extraPadding <= this.paddingApplied) return;
    try {
      if (this.previousBodyPadding == null) {
        this.previousBodyPadding = document.body.style.paddingBottom || '';
        this.baselineBodyPadding = Math.round(parseFloat(getComputedStyle(document.body).paddingBottom) || 0);
      }
      this.paddingApplied = extraPadding;
      document.body.style.paddingBottom = `${this.baselineBodyPadding + extraPadding}px`;
      document.documentElement.classList.add('rgv-bottom-padding-active');
    } catch (e) { /* ignore */ }
  }

  private removeBottomPadding(): void {
    if (this.previousBodyPadding == null) return;
    try {
      document.body.style.paddingBottom = this.previousBodyPadding;
      document.documentElement.classList.remove('rgv-bottom-padding-active');
    } catch (e) { /* ignore */ }
    this.previousBodyPadding = null;
    this.baselineBodyPadding = 0;
    this.paddingApplied = 0;
  }

  private onViewportChange = (): void => {
    if (!this.isScrolling) return;

    if (this.rafId != null) cancelAnimationFrame(this.rafId);

    this.rafId = requestAnimationFrame(() => {
      const keyboardHeight = this.getKeyboardHeight();

      if (keyboardHeight < 60) {
        // Keyboard dismissed — clean up and stop
        this.removeBottomPadding();
        this.finishScrolling();
        return;
      }

      // Keyboard is open (or still opening) — re-align now that viewport has settled
      this.alignElementIntoView('smooth');
    });
  };

  private attachViewportListeners(): void {
    if (this.isViewportListenersAttached) return;
    this.viewport.start();
    this.viewportSub = this.viewport.viewportChange$.subscribe(() => this.onViewportChange());
    this.isViewportListenersAttached = true;
  }

  private detachViewportListeners(): void {
    if (!this.isViewportListenersAttached) return;
    try {
      this.viewportSub?.unsubscribe();
      this.viewportSub = undefined;
      this.viewport.stop();
    } catch (e) { /* ignore */ }
    this.isViewportListenersAttached = false;
  }

  private clearTimers(): void {
    if (this.initialScrollTimerId != null) { clearTimeout(this.initialScrollTimerId); this.initialScrollTimerId = undefined; }
    if (this.maxScrollWindowTimerId != null) { clearTimeout(this.maxScrollWindowTimerId); this.maxScrollWindowTimerId = undefined; }
    if (this.rafId != null) { cancelAnimationFrame(this.rafId); this.rafId = undefined; }
  }

  private finishScrolling(): void {
    const isStillFocused = document.activeElement === this.el.nativeElement;
    const keepPadding = this.enableBottomPadding && isStillFocused && this.getKeyboardHeight() >= 60;

    if (!this.isScrolling) {
      this.clearTimers();
      this.detachViewportListeners();
      if (!keepPadding) this.removeBottomPadding();
      return;
    }

    this.isScrolling = false;
    this.clearTimers();
    this.detachViewportListeners();
    if (!keepPadding) this.removeBottomPadding();
    this.scrollComplete.emit();
    if (!this.suppressDropdownAfterSelection) this.dropdownReady.emit();
  }
}
