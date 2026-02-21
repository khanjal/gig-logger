import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { SyncStatus, SyncOperation, ISyncState, ISyncMessage } from '@interfaces/sync-status.interface';

/**
 * @deprecated Use ISyncState from @interfaces/sync-status.interface instead
 */
export type SyncState = ISyncState;

/**
 * @deprecated Use ISyncMessage from @interfaces/sync-status.interface instead
 */
export type SyncMessage = ISyncMessage;

// Re-export types for backward compatibility
export { SyncStatus, SyncOperation };

@Injectable({
  providedIn: 'root'
})
export class SyncStatusService implements OnDestroy {
  private readonly DEFAULT_STATE: ISyncState = {
    status: 'idle',
    operation: null,
    message: '',
    progress: 0,
    itemsSynced: 0,
    totalItems: 0,
    timestamp: new Date()
  };

  private syncStateSubject = new BehaviorSubject<SyncState>(this.DEFAULT_STATE);
  private messagesSubject = new BehaviorSubject<SyncMessage[]>([]);
  private lastSuccessfulSyncSubject = new BehaviorSubject<Date | null>(null);
  private countdownTimer: any = null;

  // Public observables
  public readonly syncState$: Observable<SyncState> = this.syncStateSubject.asObservable();
  public readonly messages$: Observable<SyncMessage[]> = this.messagesSubject.asObservable();
  public readonly lastSuccessfulSync$: Observable<Date | null> = this.lastSuccessfulSyncSubject.asObservable();

  constructor() {}

  ngOnDestroy(): void {
    this.stopCountdown();
  }

  /**
   * Start a new sync operation
   */
  startSync(operation: SyncOperation, totalItems: number = 0): void {
    this.syncStateSubject.next({
      status: 'syncing',
      operation,
      message: this.getOperationMessage(operation, 'start'),
      progress: 0,
      itemsSynced: 0,
      totalItems,
      timestamp: new Date()
    });
    this.clearMessages();
  }

  /**
   * Update sync progress
   */
  updateProgress(itemsSynced: number, message?: string): void {
    const currentState = this.syncStateSubject.value;
    const progress = currentState.totalItems > 0 
      ? Math.round((itemsSynced / currentState.totalItems) * 100)
      : 0;

    this.syncStateSubject.next({
      ...currentState,
      itemsSynced,
      progress,
      message: message || currentState.message,
      timestamp: new Date()
    });
  }

  /**
   * Mark sync as successful
   */
  completeSync(message?: string): void {
    const currentState = this.syncStateSubject.value;
    const successMessage = message || this.getOperationMessage(currentState.operation!, 'success');
    
    this.syncStateSubject.next({
      ...currentState,
      status: 'success',
      message: successMessage,
      progress: 100,
      timestamp: new Date()
    });
    
    this.lastSuccessfulSyncSubject.next(new Date());
    
    // Add success message to activity log
    this.addMessage(successMessage, 'info');
    
    // Auto-reset to idle after 3 seconds
    setTimeout(() => {
      if (this.syncStateSubject.value.status === 'success') {
        this.resetToIdle();
      }
    }, 3000);
  }

  /**
   * Mark sync as failed
   */
  failSync(error: string): void {
    const currentState = this.syncStateSubject.value;
    this.syncStateSubject.next({
      ...currentState,
      status: 'error',
      message: this.getOperationMessage(currentState.operation!, 'error'),
      error,
      timestamp: new Date()
    });
    
    this.addMessage(error, 'error');
    
    // Auto-reset to idle after 5 seconds
    setTimeout(() => {
      if (this.syncStateSubject.value.status === 'error') {
        this.resetToIdle();
      }
    }, 5000);
  }

  /**
   * Add a message to the log
   */
  addMessage(text: string, type: 'info' | 'warning' | 'error' = 'info'): void {
    const currentMessages = this.messagesSubject.value;
    const newMessage: SyncMessage = {
      text,
      type,
      timestamp: new Date()
    };
    
    // Keep only last 50 messages
    const updatedMessages = [...currentMessages, newMessage].slice(-50);
    this.messagesSubject.next(updatedMessages);
  }

  /**
   * Clear all messages
   */
  clearMessages(): void {
    this.messagesSubject.next([]);
  }

  /**
   * Reset to idle state
   */
  resetToIdle(): void {
    this.syncStateSubject.next({
      ...this.DEFAULT_STATE,
      timestamp: new Date()
    });
  }

  /**
   * Get current sync state
   */
  getCurrentState(): SyncState {
    return this.syncStateSubject.value;
  }

  /**
   * Check if sync is currently in progress
   */
  isSyncing(): boolean {
    return this.syncStateSubject.value.status === 'syncing';
  }

  /**
   * Get human-readable operation message
   */
  private getOperationMessage(operation: SyncOperation, phase: 'start' | 'success' | 'error'): string {
    const messages = {
      'save': {
        start: 'Saving changes to Google Sheets...',
        success: 'Changes saved successfully',
        error: 'Failed to save changes'
      },
      'load': {
        start: 'Loading data from Google Sheets...',
        success: 'Data loaded successfully',
        error: 'Failed to load data'
      },
      'auto-save': {
        start: 'Auto-saving in background...',
        success: 'Auto-save completed',
        error: 'Auto-save failed'
      }
    };

    return messages[operation]?.[phase] || '';
  }

  /**
   * Get time since last successful sync in human-readable format
   */
  getTimeSinceLastSync(): string {
    const lastSync = this.lastSuccessfulSyncSubject.value;
    if (!lastSync) return 'Never';

    const now = new Date();
    const diffMs = now.getTime() - lastSync.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `${diffDays}d ago`;
    if (diffHours > 0) return `${diffHours}h ago`;
    if (diffMins > 0) return `${diffMins}m ago`;
    return 'Just now';
  }

  /**
   * Start countdown timer for next sync
   */
  startCountdown(intervalMs: number): void {
    this.stopCountdown();
    let seconds = Math.ceil(intervalMs / 1000);
    
    // Update state with countdown
    this.updateCountdown(seconds);
    
    this.countdownTimer = setInterval(() => {
      seconds--;
      if (seconds <= 0) {
        this.updateCountdown(0);
        this.stopCountdown();
      } else {
        this.updateCountdown(seconds);
      }
    }, 1000);
  }

  /**
   * Stop countdown timer
   */
  stopCountdown(): void {
    if (this.countdownTimer) {
      clearInterval(this.countdownTimer);
      this.countdownTimer = null;
    }
  }

  /**
   * Update countdown in sync state
   */
  private updateCountdown(seconds: number): void {
    const currentState = this.syncStateSubject.value;
    this.syncStateSubject.next({
      ...currentState,
      nextSyncIn: seconds
    });
  }
}
