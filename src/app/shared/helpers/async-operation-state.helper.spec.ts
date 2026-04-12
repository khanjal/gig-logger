import { createAsyncOperationState } from './async-operation-state.helper';

describe('createAsyncOperationState', () => {
  it('starts as idle and not completed', () => {
    const state = createAsyncOperationState();

    expect(state.status()).toBe('idle');
    expect(state.errorMessage()).toBeNull();
    expect(state.hasCompleted()).toBeFalse();
    expect(state.isLoading()).toBeFalse();
    expect(state.isSuccess()).toBeFalse();
    expect(state.hasError()).toBeFalse();
  });

  it('transitions to loading and marks completed', () => {
    const state = createAsyncOperationState();

    state.setLoading();

    expect(state.status()).toBe('loading');
    expect(state.isLoading()).toBeTrue();
    expect(state.hasCompleted()).toBeTrue();
    expect(state.errorMessage()).toBeNull();
  });

  it('transitions to success and clears errors', () => {
    const state = createAsyncOperationState();
    state.setError('failed');

    state.setSuccess();

    expect(state.status()).toBe('success');
    expect(state.isSuccess()).toBeTrue();
    expect(state.hasError()).toBeFalse();
    expect(state.errorMessage()).toBeNull();
  });

  it('transitions to error and stores message', () => {
    const state = createAsyncOperationState();

    state.setError('Search failed');

    expect(state.status()).toBe('error');
    expect(state.hasError()).toBeTrue();
    expect(state.errorMessage()).toBe('Search failed');
    expect(state.hasCompleted()).toBeTrue();
  });

  it('reset returns state to idle defaults', () => {
    const state = createAsyncOperationState();
    state.setLoading();

    state.reset();

    expect(state.status()).toBe('idle');
    expect(state.errorMessage()).toBeNull();
    expect(state.hasCompleted()).toBeFalse();
    expect(state.isLoading()).toBeFalse();
  });
});
