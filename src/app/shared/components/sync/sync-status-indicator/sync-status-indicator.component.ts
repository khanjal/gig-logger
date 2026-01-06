import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ConnectedPosition, OverlayModule } from '@angular/cdk/overlay';
import { Subject, takeUntil } from 'rxjs';
import { SyncStatusService, SyncState, SyncMessage } from '@services/sync-status.service';
import { PollingService } from '@services/polling.service';
import { UnsavedDataService } from '@services/unsaved-data.service';
import { DataSyncModalComponent } from '@components/data/data-sync-modal/data-sync-modal.component';

@Component({
  selector: 'app-sync-status-indicator',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatBadgeModule,
    OverlayModule
  ],
  templateUrl: './sync-status-indicator.component.html',
  styleUrls: ['./sync-status-indicator.component.scss']
})
export class SyncStatusIndicatorComponent implements OnInit, OnDestroy {
  @Input() mode: 'button' | 'panel' = 'button';
  private destroy$ = new Subject<void>();
  private intervalId?: number;
  
  syncState: SyncState | null = null;
  messages: SyncMessage[] = [];
  timeSinceLastSync = 'Never';
  showDetailedView = false;
  hasUnsavedChanges = false;
  menuOpen = false;
  overlayPositions: ConnectedPosition[] = [
    { originX: 'end', originY: 'bottom', overlayX: 'end', overlayY: 'top', offsetX: 0, offsetY: 6 },
    { originX: 'end', originY: 'top', overlayX: 'end', overlayY: 'bottom', offsetX: 0, offsetY: -6 }
  ];

  constructor(
    private syncStatusService: SyncStatusService,
    private pollingService: PollingService,
    private unsavedDataService: UnsavedDataService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    // Subscribe to sync state changes
    this.syncStatusService.syncState$
      .pipe(takeUntil(this.destroy$))
      .subscribe(state => {
        this.syncState = state;
        this.updateTimeSinceLastSync();
        // Check for unsaved changes when sync state changes
        this.checkUnsavedChanges();
      });

    // Subscribe to messages
    this.syncStatusService.messages$
      .pipe(takeUntil(this.destroy$))
      .subscribe(messages => {
        this.messages = messages;
      });

    // Update time display and check for unsaved changes every 5 seconds for better responsiveness
    this.intervalId = window.setInterval(() => {
      this.updateTimeSinceLastSync();
      this.checkUnsavedChanges();
    }, 5000);
    
    // Initial check for unsaved changes
    this.checkUnsavedChanges();
  }

  toggleMenu(event: MouseEvent): void {
    event.stopPropagation();
    this.menuOpen = !this.menuOpen;
  }

  closeMenu(): void {
    this.menuOpen = false;
  }

  private async checkUnsavedChanges(): Promise<void> {
    this.hasUnsavedChanges = await this.unsavedDataService.hasUnsavedData();
  }

  async forceSync(): Promise<void> {    // Safety check: prevent update if there are unsaved changes
    await this.checkUnsavedChanges();
    if (this.hasUnsavedChanges) {
      this.snackBar.open('Cannot update from spreadsheet. You have unsaved changes. Please save or discard them first.', 'Close', {
        duration: 5000,
        horizontalPosition: 'center',
        verticalPosition: 'top',
        panelClass: ['error-snackbar']
      });
      return;
    }
    const dialogRef = this.dialog.open(DataSyncModalComponent, {
      height: '400px',
      width: '500px',
      panelClass: 'custom-modalbox',
      data: 'save'
    });

    dialogRef.afterClosed().subscribe(async (result: any) => {
      if (result) {
        await this.checkUnsavedChanges();
      }
    });
  }

  async updateFromSpreadsheet(): Promise<void> {
    // Safety check: prevent update if there are unsaved changes
    await this.checkUnsavedChanges();
    if (this.hasUnsavedChanges) {
      this.snackBar.open('Cannot update from spreadsheet. You have unsaved changes. Please save or discard them first.', 'Close', {
        duration: 5000,
        horizontalPosition: 'center',
        verticalPosition: 'top',
        panelClass: ['error-snackbar']
      });
      return;
    }

    const dialogRef = this.dialog.open(DataSyncModalComponent, {
      height: '400px',
      width: '500px',
      panelClass: 'custom-modalbox',
      data: 'load'
    });

    dialogRef.afterClosed().subscribe(async (result: any) => {
      if (result) {
        await this.checkUnsavedChanges();
      }
    });
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
