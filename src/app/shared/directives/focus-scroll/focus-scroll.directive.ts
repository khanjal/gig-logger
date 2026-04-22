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

      this.alignElementIntoView('smooth');

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
      const snap = this.viewport?.getSnapshot?.();
      if (snap) return Math.max(0, snap.keyboardHeight || 0);
    } catch (e) { /* ignore */ }

    const vv = window.visualViewport;
    if (!vv) return 0;
    return Math.max(0, (window.innerHeight || 0) - vv.height - (vv.offsetTop || 0));
  }

  private alignElementIntoView(behavior: ScrollBehavior): void {
    const element = this.el.nativeElement as HTMLElement;
    const rect = element.getBoundingClientRect();
    const vv = window.visualViewport;
    const viewportTop = vv?.offsetTop ?? 0;
    const viewportHeight = vv?.height ?? window.innerHeight;
    const preferredTopInViewport = viewportTop + Math.round(this.topBuffer || 0);

    const currentPageY = window.pageYOffset || document.documentElement.scrollTop;
    const targetY = rect.top + currentPageY - preferredTopInViewport;

    const maxScroll = Math.max(0, document.documentElement.scrollHeight - viewportHeight);

    // Only add padding when the element genuinely can't reach the top without it
    if (targetY > maxScroll && this.enableBottomPadding && this.isMobileDevice()) {
      const extraNeeded = Math.ceil(targetY - maxScroll) + 32;
      const overlayHeight = this.getAttachedOverlayHeight();
      this.applyBottomPadding(extraNeeded + overlayHeight);

      // Recompute after padding changes document height
      const newMaxScroll = Math.max(0, document.documentElement.scrollHeight - (vv?.height ?? window.innerHeight));
      const clampedTarget = Math.min(Math.max(0, targetY), newMaxScroll);
      this.ngZone.runOutsideAngular(() => window.scrollTo({ top: clampedTarget, behavior }));
      return;
    }

    const clampedTarget = Math.min(Math.max(0, targetY), maxScroll);
    this.ngZone.runOutsideAngular(() => window.scrollTo({ top: clampedTarget, behavior }));
  }

  private getAttachedOverlayHeight(): number {
    try {
      let maxH = 0;
      for (const sel of ['.mat-autocomplete-panel', '.cdk-overlay-pane', '[role="listbox"]']) {
        for (const n of Array.from(document.querySelectorAll<HTMLElement>(sel))) {
          if (!n.offsetParent) continue;
          const h = Math.round(n.getBoundingClientRect().height);
          if (h > maxH) maxH = h;
        }
      }
      return maxH;
    } catch (e) {
      return 0;
    }
  }

  private applyBottomPadding(px: number): void {
    if (px <= this.paddingApplied) return;
    try {
      if (this.previousBodyPadding == null) {
        this.previousBodyPadding = document.body.style.paddingBottom || '';
        this.baselineBodyPadding = Math.round(parseFloat(getComputedStyle(document.body).paddingBottom) || 0);
      }
      this.paddingApplied = px;
      document.body.style.paddingBottom = `${this.baselineBodyPadding + px}px`;
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
      this.alignElementIntoView('smooth');

      // Remove padding if keyboard has been dismissed
      const keyboardHeight = this.getKeyboardHeight();
      if (keyboardHeight < 60) {
        this.removeBottomPadding();
      }
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
    const keepPadding = this.enableBottomPadding && this.isMobileDevice() && isStillFocused && this.getKeyboardHeight() >= 60;

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
