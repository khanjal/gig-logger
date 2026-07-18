/**
 * Sync status state types for the sync status service.
 */
export type SyncStatus = 'idle' | 'syncing' | 'success' | 'error';
export type SyncOperation = 'save' | 'load' | 'auto-save';

/**
 * Sync state interface for tracking current sync operations.
 */
export interface ISyncState {
  status: SyncStatus;
  operation: SyncOperation | null;
  message: string;
  progress: number; // 0-100
  itemsSynced: number;
  totalItems: number;
  timestamp: Date;
  error?: string;
  nextSyncIn?: number; // seconds until next sync
}

/**
 * Sync message interface for status updates.
 */
export interface ISyncMessage {
  text: string;
  type: 'info' | 'warning' | 'error';
  timestamp: Date;
}
