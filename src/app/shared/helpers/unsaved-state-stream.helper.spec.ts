import { Component, DestroyRef, inject } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';
import { bindUnsavedStateFromStreams } from './unsaved-state-stream.helper';

@Component({
  standalone: true,
  template: ''
})
class HostComponent {
  destroyRef: DestroyRef = inject(DestroyRef);
}

describe('bindUnsavedStateFromStreams', () => {
  let fixture: ComponentFixture<HostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(HostComponent);
  });

  it('refreshes on initial bind and each stream emission', () => {
    const streamA = new Subject<void>();
    const streamB = new Subject<void>();
    const refreshSpy = jasmine.createSpy('refreshSpy');

    bindUnsavedStateFromStreams({
      destroyRef: fixture.componentInstance.destroyRef,
      streams: [streamA, streamB],
      refreshUnsavedState: refreshSpy
    });

    expect(refreshSpy).toHaveBeenCalledTimes(1);

    streamA.next();
    streamB.next();

    expect(refreshSpy).toHaveBeenCalledTimes(3);
  });

  it('stops reacting to stream emissions after destroy', () => {
    const stream = new Subject<void>();
    const refreshSpy = jasmine.createSpy('refreshSpy');

    bindUnsavedStateFromStreams({
      destroyRef: fixture.componentInstance.destroyRef,
      streams: [stream],
      refreshUnsavedState: refreshSpy,
      runInitialRefresh: false
    });

    stream.next();
    expect(refreshSpy).toHaveBeenCalledTimes(1);

    fixture.destroy();
    stream.next();

    expect(refreshSpy).toHaveBeenCalledTimes(1);
  });

  it('supports stop$ teardown mode', () => {
    const stream = new Subject<void>();
    const stop$ = new Subject<void>();
    const refreshSpy = jasmine.createSpy('refreshSpy');

    bindUnsavedStateFromStreams({
      stop$,
      streams: [stream],
      refreshUnsavedState: refreshSpy,
      runInitialRefresh: false
    });

    stream.next();
    expect(refreshSpy).toHaveBeenCalledTimes(1);

    stop$.next();
    stop$.complete();
    stream.next();

    expect(refreshSpy).toHaveBeenCalledTimes(1);
  });
});
