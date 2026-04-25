import { TestBed } from '@angular/core/testing';
import { ViewportService } from './viewport.service';

describe('ViewportService', () => {
  let service: ViewportService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ViewportService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('getSnapshot returns expected shape', () => {
    const snap = service.getSnapshot();
    expect(snap).toBeDefined();
    expect(typeof snap.height).toBe('number');
    expect(typeof snap.offsetTop).toBe('number');
    expect(typeof snap.keyboardHeight).toBe('number');
    expect(typeof snap.windowInnerHeight).toBe('number');
  });

  it('emits on resize when started', (done) => {
    let count = 0;
    service.start();
    let sub: any;
    let finished = false;
    sub = service.viewportChange$.subscribe(() => {
      count++;
      if (count === 1) {
        // initial emission, trigger resize
        window.dispatchEvent(new Event('resize'));
      }
      if (count >= 2) {
        if (finished) return;
        finished = true;
        // unsubscribe/stop on next tick to avoid race where the
        // subscription callback runs synchronously before `sub` is
        // assigned by the caller.
        setTimeout(() => {
          try { sub.unsubscribe(); } catch (e) { /* ignore */ }
          try { service.stop(); } catch (e) { /* ignore */ }
          done();
        }, 0);
      }
    });
  });
});
