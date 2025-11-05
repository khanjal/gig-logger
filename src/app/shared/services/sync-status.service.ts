import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export type SyncStatus = 'idle' | 'syncing' | 'success' | 'error';
export type SyncOperation = 'save' | 'load' | 'auto-save';

export interface SyncState {
  status: SyncStatus;
  operation: SyncOperation | null;
  message: string;
  progress: number; // 0-100
  itemsSynced: number;
  totalItems: number;
  timestamp: Date;
  error?: string;
}

export interface SyncMessage {
  text: string;
  type: 'info' | 'warning' | 'error';
  timestamp: Date;
}

@Injectable({
  providedIn: 'root'
})
export class SyncStatusService {
  private readonly DEFAULT_STATE: SyncState = {
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

  // Public observables
  public readonly syncState$: Observable<SyncState> = this.syncStateSubject.asObservable();
  public readonly messages$: Observable<SyncMessage[]> = this.messagesSubject.asObservable();
  public readonly lastSuccessfulSync$: Observable<Date | null> = this.lastSuccessfulSyncSubject.asObservable();

  constructor() {}

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
    this.syncStateSubject.next({
      ...currentState,
      status: 'success',
      message: message || this.getOperationMessage(currentState.operation!, 'success'),
      progress: 100,
      timestamp: new Date()
    });
    
    this.lastSuccessfulSyncSubject.next(new Date());
    
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
}
