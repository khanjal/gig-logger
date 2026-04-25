import { Injectable, NgZone } from '@angular/core';
import { BehaviorSubject, Observable, Subscription, merge, fromEvent } from 'rxjs';
import { map, startWith, debounceTime, shareReplay } from 'rxjs/operators';

export interface ViewportSnapshot {
  height: number;
  offsetTop: number;
  keyboardHeight: number;
  windowInnerHeight: number;
}

@Injectable({ providedIn: 'root' })
export class ViewportService {
  private started = false;
  private snapshot$ = new BehaviorSubject<ViewportSnapshot>(this.computeSnapshot());
  private eventsSub: Subscription | null = null;

  // Debounced stream for settled viewport changes
  public viewportChange$: Observable<ViewportSnapshot> = this.snapshot$.asObservable().pipe(shareReplay(1));
  public viewportSettled$: Observable<ViewportSnapshot> = this.snapshot$.asObservable().pipe(debounceTime(120), shareReplay(1));

  constructor(private ngZone: NgZone) {}

  start(): void {
    if (this.started) {
      return;
    }
    this.started = true;

    this.ngZone.runOutsideAngular(() => {
      const vv = window.visualViewport;
      const sources = [] as Observable<Event>[];
      if (vv) {
        sources.push(fromEvent(vv, 'resize'));
        sources.push(fromEvent(vv, 'scroll'));
      }
      sources.push(fromEvent(window, 'resize'));
      sources.push(fromEvent(window, 'orientationchange'));

      this.eventsSub = merge(...sources).pipe(
        startWith({} as Event),
        map(() => this.computeSnapshot())
      ).subscribe(s => this.snapshot$.next(s));
    });
  }

  stop(): void {
    if (!this.started) {
      return;
    }
    this.started = false;
    this.eventsSub?.unsubscribe();
    this.eventsSub = null;
  }

  getSnapshot(): ViewportSnapshot {
    return this.snapshot$.getValue();
  }

  private computeSnapshot(): ViewportSnapshot {
    const visualViewport = window.visualViewport;
    const windowInnerHeight = window.innerHeight || 0;
    if (visualViewport) {
      const height = visualViewport.height || windowInnerHeight;
      const offsetTop = visualViewport.offsetTop || 0;
      const keyboardHeight = Math.max(0, windowInnerHeight - height - offsetTop);
      return { height, offsetTop, keyboardHeight, windowInnerHeight };
    }

    // Fallback when visualViewport isn't available
    return { height: windowInnerHeight, offsetTop: 0, keyboardHeight: 0, windowInnerHeight };
  }
}
