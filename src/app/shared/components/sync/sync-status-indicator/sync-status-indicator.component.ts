import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { Subject, takeUntil } from 'rxjs';
import { SyncStatusService, SyncState, SyncMessage } from '@services/sync-status.service';
import { PollingService } from '@services/polling.service';

@Component({
  selector: 'app-sync-status-indicator',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatMenuModule,
    MatBadgeModule
  ],
  templateUrl: './sync-status-indicator.component.html',
  styleUrls: ['./sync-status-indicator.component.scss']
})
export class SyncStatusIndicatorComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private intervalId?: number;
  
  syncState: SyncState | null = null;
  messages: SyncMessage[] = [];
  timeSinceLastSync = 'Never';
  showDetailedView = false;

  constructor(
    private syncStatusService: SyncStatusService,
    private pollingService: PollingService
  ) {}

  ngOnInit(): void {
    // Subscribe to sync state changes
    this.syncStatusService.syncState$
      .pipe(takeUntil(this.destroy$))
      .subscribe(state => {
        this.syncState = state;
        this.updateTimeSinceLastSync();
      });

    // Subscribe to messages
    this.syncStatusService.messages$
      .pipe(takeUntil(this.destroy$))
      .subscribe(messages => {
        this.messages = messages;
      });

    // Update time display every 30 seconds
    this.intervalId = window.setInterval(() => {
      this.updateTimeSinceLastSync();
    }, 30000);
  }

  ngOnDestroy(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    this.destroy$.next();
    this.destroy$.complete();
  }

  private updateTimeSinceLastSync(): void {
    this.timeSinceLastSync = this.syncStatusService.getTimeSinceLastSync();
  }

  getStatusIcon(): string {
    if (!this.syncState) return 'cloud_off';
    
    // Check if auto-sync is disabled
    if (!this.pollingService.isPollingEnabled() && this.syncState.status === 'idle') {
      return 'sync_disabled';
    }
    
    switch (this.syncState.status) {
      case 'syncing':
        return 'sync';
      case 'success':
        return 'cloud_done';
      case 'error':
        return 'cloud_off';
      case 'idle':
      default:
        return 'cloud_queue';
    }
  }

  getStatusClass(): string {
    if (!this.syncState) return 'status-idle';
    
    // Check if auto-sync is disabled
    if (!this.pollingService.isPollingEnabled() && this.syncState.status === 'idle') {
      return 'status-disabled';
    }
    
    return `status-${this.syncState.status}`;
  }

  getTooltipText(): string {
    if (!this.syncState) return 'Sync status unknown';

    // Check if auto-sync is disabled
    if (!this.pollingService.isPollingEnabled() && this.syncState.status === 'idle') {
      return 'Auto-sync disabled';
    }

    switch (this.syncState.status) {
      case 'syncing':
        return `${this.syncState.message} (${this.syncState.progress}%)`;
      case 'success':
        return `${this.syncState.message} - ${this.timeSinceLastSync}`;
      case 'error':
        return this.syncState.error || 'Sync failed';
      case 'idle':
      default:
        return `Last sync: ${this.timeSinceLastSync}`;
    }
  }
  
  getStatusText(): string {
    if (!this.syncState) return 'Unknown';
    
    // Check if auto-sync is disabled
    if (!this.pollingService.isPollingEnabled() && this.syncState.status === 'idle') {
      return 'Disabled';
    }
    
    return this.syncState.message || 'Ready';
  }

  getOperationText(): string {
    if (!this.syncState || !this.syncState.operation) return '';
    
    const operationLabels = {
      'save': 'Saving',
      'load': 'Loading',
      'auto-save': 'Auto-saving'
    };
    
    return operationLabels[this.syncState.operation] || '';
  }

  toggleDetailedView(): void {
    this.showDetailedView = !this.showDetailedView;
  }

  clearMessages(): void {
    this.syncStatusService.clearMessages();
  }

  getMessageIcon(type: string): string {
    switch (type) {
      case 'error':
        return 'error';
      case 'warning':
        return 'warning';
      case 'info':
      default:
        return 'info';
    }
  }

  formatTimestamp(date: Date): string {
    return new Date(date).toLocaleTimeString();
  }
}
