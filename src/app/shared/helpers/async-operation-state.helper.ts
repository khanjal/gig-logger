import { computed, signal } from '@angular/core';
import type { IAsyncOperationState } from '@interfaces/sync/async-operation-state.interface';

/**
 * Creates a reusable async operation state model for loading/success/error transitions.
 * @returns A state object with derived signals and transition helpers.
 */
export function createAsyncOperationState(): IAsyncOperationState {
  const status = signal<'idle' | 'loading' | 'success' | 'error'>('idle');
  const errorMessage = signal<string | null>(null);
  const hasStarted = signal(false);

  const isLoading = computed(() => status() === 'loading');
  const isSuccess = computed(() => status() === 'success');
  const hasError = computed(() => status() === 'error');

  const setLoading = (): void => {
    status.set('loading');
    errorMessage.set(null);
    hasStarted.set(true);
  };

  const setSuccess = (): void => {
    status.set('success');
    errorMessage.set(null);
    hasStarted.set(true);
  };

  const setError = (message = 'An unexpected error occurred'): void => {
    status.set('error');
    errorMessage.set(message);
    hasStarted.set(true);
  };

  const reset = (): void => {
    status.set('idle');
    errorMessage.set(null);
    hasStarted.set(false);
  };

  return {
    status,
    errorMessage,
    hasStarted,
    isLoading,
    isSuccess,
    hasError,
    setLoading,
    setSuccess,
    setError,
    reset,
  };
}
