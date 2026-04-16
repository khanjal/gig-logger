import type { DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { takeUntil } from 'rxjs/operators';
import type { Observable } from 'rxjs';

export interface IUnsavedStateStreamBindingOptions {
  destroyRef?: DestroyRef;
  stop$?: Observable<unknown>;
  streams: Observable<unknown>[];
  refreshUnsavedState: () => Promise<void> | void;
  runInitialRefresh?: boolean;
}

/**
 * Subscribes to entity streams and refreshes unsaved state whenever any stream emits.
 * This keeps page-level unsaved indicators consistent with local Dexie updates.
 */
export function bindUnsavedStateFromStreams(options: IUnsavedStateStreamBindingOptions): void {
  const { destroyRef, stop$, streams, refreshUnsavedState, runInitialRefresh = true } = options;

  if (!destroyRef && !stop$) {
    throw new Error('bindUnsavedStateFromStreams requires either destroyRef or stop$');
  }

  const triggerRefresh = () => {
    void Promise.resolve(refreshUnsavedState()).catch(() => {
      // Pages should remain resilient if unsaved-state lookup fails transiently.
    });
  };

  for (const stream of streams) {
    if (destroyRef) {
      stream
        .pipe(takeUntilDestroyed(destroyRef))
        .subscribe(() => {
          triggerRefresh();
        });
      continue;
    }

    stream
      .pipe(takeUntil(stop$!))
      .subscribe(() => {
        triggerRefresh();
      });
  }

  if (runInitialRefresh) {
    triggerRefresh();
  }
}
