import { Directive, ElementRef, Output, EventEmitter, HostListener, Input, NgZone, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { ViewportService, ViewportSnapshot } from '@services/viewport.service';

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
  private reducePaddingTemporarily = false;
  private reducePaddingTimerId: number | undefined;
  private viewportSub: Subscription | undefined;
  private lastViewportSnapshot: ViewportSnapshot | undefined;
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
    const preferredTopInViewport = viewportTop + Math.max(topPadding, Math.round(viewportHeight * 0.24));

    const currentPageY = window.pageYOffset || document.documentElement.scrollTop;
    const elementTopAbs = rect.top + currentPageY;
    const elementBottomAbs = rect.bottom + currentPageY;

    // Base target attempts to position the element at the preferred top location
    let targetY = elementTopAbs - preferredTopInViewport;

    // Compute keyboard inset (space taken by virtual keyboard) when visualViewport is available
    const keyboardInset = Math.max(0, (window.innerHeight || 0) - (visualViewport?.height ?? window.innerHeight) - (visualViewport?.offsetTop ?? 0));

    // Ensure element bottom will be visible above keyboard after scrolling.
    const bottomSpacing = this.isMobileDevice() ? 12 : 8; // extra breathing room
    const allowedVisibleBottom = viewportHeight - keyboardInset - bottomSpacing;
    const minTargetToExposeBottom = elementBottomAbs - (viewportTop + allowedVisibleBottom);

    if (minTargetToExposeBottom > targetY) {
      // If preferred top would still leave the element bottom under the keyboard,
      // adjust to the minimum target that exposes the bottom.
      targetY = minTargetToExposeBottom;
    }

    // Clamp targetY so we don't scroll past the end of the document
    const maxScroll = Math.max(0, document.documentElement.scrollHeight - viewportHeight);
    const clampedTarget = Math.min(Math.max(0, targetY), maxScroll);

    this.ngZone.runOutsideAngular(() => {
      window.scrollTo({
        top: clampedTarget,
        behavior
      });
    });
  }

  
  private onViewportChange = (): void => {
    if (!this.isScrolling) {
      return;
    }

    if (this.rafId != null) {
      cancelAnimationFrame(this.rafId);
    }

    this.rafId = requestAnimationFrame(() => {
      if (this.isMobileDevice()) {
        this.alignElementIntoView('auto');
      }
      if (this.enableBottomPadding) {
        // Reduce padding briefly to avoid blocking user scrolling when keyboard
        // height changes rapidly (e.g., virtual keyboard 'down' arrow). This
        // makes the page less jumpy and leaves more visible area for scrolling.
        this.reducePaddingTemporarily = true;
        this.updateBottomPadding();
      }

      // If the keyboard has been dismissed (visual viewport nearly equals innerHeight),
      // remove the temporary bottom padding even if the field remains focused. This
      // handles virtual keyboard 'down' action which hides the keyboard but leaves
      // the input focused and previously-applied padding intact.
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
          const factor = this.reducePaddingTemporarily ? 0.5 : 1;
          padding = Math.round(raw * factor);
        } else if (window.visualViewport) {
          const raw = Math.max(0, (window.innerHeight || 0) - window.visualViewport.height - (window.visualViewport.offsetTop || 0));
          const factor = this.reducePaddingTemporarily ? 0.5 : 1;
          padding = Math.round(raw * factor);
        } else if (this.isMobileDevice()) {
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

            private initialScrollTimerId: number | undefined;
            private settleTimerId: number | undefined;
            private rafId: number | undefined;
            private maxScrollWindowTimerId: number | undefined;
            private isViewportListenersAttached = false;
            private bottomPaddingApplied = false;
            private previousBodyPadding: string | null = null;
            private reducePaddingTemporarily = false;
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
              const preferredTopInViewport = viewportTop + Math.max(topPadding, Math.round(viewportHeight * 0.24));

              const currentPageY = window.pageYOffset || document.documentElement.scrollTop;
              const targetY = rect.top + currentPageY - preferredTopInViewport;

              // Clamp targetY so we don't scroll past the end of the document
              const maxScroll = Math.max(0, document.documentElement.scrollHeight - viewportHeight);
              const clampedTarget = Math.min(Math.max(0, targetY), maxScroll);

              this.ngZone.runOutsideAngular(() => {
                window.scrollTo({
                  top: clampedTarget,
                  behavior
                });
              });
            }


            private onViewportChange = (): void => {
              if (!this.isScrolling) {
                return;
              }

              if (this.rafId != null) {
                cancelAnimationFrame(this.rafId);
              }

              this.rafId = requestAnimationFrame(() => {
                if (this.isMobileDevice()) {
                  this.alignElementIntoView('auto');
                }
                if (this.enableBottomPadding) {
                  // Reduce padding briefly to avoid blocking user scrolling when keyboard
                  // height changes rapidly (e.g., virtual keyboard 'down' arrow). This   
                  // makes the page less jumpy and leaves more visible area for scrolling.
                  this.reducePaddingTemporarily = true;
                  this.updateBottomPadding();
                }

                // If the keyboard has been dismissed (visual viewport nearly equals innerHeight),
                // remove the temporary bottom padding even if the field remains focused. This
                // handles virtual keyboard 'down' action which hides the keyboard but leaves
                // the input focused and previously-applied padding intact.
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
                const visualViewport = window.visualViewport;
                let padding = 0;

                if (visualViewport) {
                  const raw = Math.max(0, (window.innerHeight || 0) - visualViewport.height - (visualViewport.offsetTop || 0));
                  const factor = this.reducePaddingTemporarily ? 0.5 : 1;
                  padding = Math.round(raw * factor);
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
              if (this.isViewportListenersAttached) {
                return;
              }

              this.ngZone.runOutsideAngular(() => {
                if (window.visualViewport) {
                  window.visualViewport.addEventListener('resize', this.onViewportChange, { passive: true });
                  window.visualViewport.addEventListener('scroll', this.onViewportChange, { passive: true });
                }
                // Fallback for browsers without visualViewport support
                window.addEventListener('resize', this.onViewportChange, { passive: true });
              });

              this.isViewportListenersAttached = true;
            }

            private detachViewportListeners(): void {
              if (!this.isViewportListenersAttached) {
                return;
              }

              try {
                if (window.visualViewport) {
                  window.visualViewport.removeEventListener('resize', this.onViewportChange);
                  window.visualViewport.removeEventListener('scroll', this.onViewportChange);
                }
                window.removeEventListener('resize', this.onViewportChange);
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

              // Reset temporary padding reduction when finishing
              this.reducePaddingTemporarily = false;

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