import type { Signal, WritableSignal } from '@angular/core';

export type AsyncOperationStatus = 'idle' | 'loading' | 'success' | 'error';

export interface IAsyncOperationState {
  status: WritableSignal<AsyncOperationStatus>;
  errorMessage: WritableSignal<string | null>;
  hasCompleted: WritableSignal<boolean>;
  isLoading: Signal<boolean>;
  isSuccess: Signal<boolean>;
  hasError: Signal<boolean>;
  setLoading: () => void;
  setSuccess: () => void;
  setError: (message?: string) => void;
  reset: () => void;
}
