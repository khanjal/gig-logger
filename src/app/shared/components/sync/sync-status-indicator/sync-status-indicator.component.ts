import type { OnInit, OnDestroy} from '@angular/core';
import { Component, Input, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SNACKBAR_MESSAGES, SNACKBAR_DEFAULT_ACTION } from '@constants/snackbar.constants';
import { openSnackbar } from '@utils/snackbar.util';
import type { NavigationExtras} from '@angular/router';
import { NavigationEnd, Router } from '@angular/router';
import type { ConnectedPosition} from '@angular/cdk/overlay';
import { OverlayModule } from '@angular/cdk/overlay';
import { Subject, takeUntil, filter } from 'rxjs';
import { SyncStatusService } from '@services/sync-status.service';
import { AuthGoogleService } from '@services/auth-google.service';
import { UiPreferencesService } from '@services/ui-preferences.service';
import { UnsavedDataService } from '@services/unsaved-data.service';

import type { ISyncMessage, ISyncState, SyncOperation } from '@interfaces/sync/sync-status.interface';
import { DataSyncModalComponent } from '@components/data/data-sync-modal/data-sync-modal.component';
import { QuickControlsComponent } from '@components/controls/quick-controls/quick-controls.component';
import { BaseFieldButtonComponent, BaseIconButtonComponent } from '@components/base';
import { ThemeService } from '@services/theme.service';
import type { ThemePreference } from '@interfaces/ui/theme.interface';

/** Savable data types surfaced in the pending-changes breakdown. */
type PendingSection = 'trips' | 'shifts' | 'expenses';

@Component({
  selector: 'app-sync-status-indicator',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatTooltipModule,
    OverlayModule,
    QuickControlsComponent,
    BaseFieldButtonComponent,
    BaseIconButtonComponent
  ],
  templateUrl: './sync-status-indicator.component.html',
  styleUrls: ['./sync-status-indicator.component.scss']
})

export class SyncStatusIndicatorComponent implements OnInit, OnDestroy {
  private syncStatusService = inject(SyncStatusService);
  private uiPreferences = inject(UiPreferencesService);
  private unsavedDataService = inject(UnsavedDataService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private router = inject(Router);
  private themeService = inject(ThemeService);
  protected authService = inject(AuthGoogleService);

  @Input() public mode: 'button' | 'panel' = 'button';
  private destroy$ = new Subject<void>();
  private intervalId?: number;
  
  public syncState = signal<ISyncState | null>(null);
  public messages = signal<ISyncMessage[]>([]);
  public timeSinceLastSync = signal('Never');
  public showDetailedView = signal(false);
  public hasUnsavedChanges = signal(false);
  public unsavedCounts = signal<{ trips: number; shifts: number; expenses: number; total: number }>({ trips: 0, shifts: 0, expenses: 0, total: 0 });

  // Definitions for the pending-changes breakdown. Add a new savable type here
  // (plus its count in UnsavedDataService) and it flows into the widget + deep
  // link automatically — no template changes needed.
  private readonly sectionDefs: { key: PendingSection; singular: string; plural: string }[] = [
    { key: 'trips', singular: 'trip', plural: 'trips' },
    { key: 'shifts', singular: 'shift', plural: 'shifts' },
    { key: 'expenses', singular: 'expense', plural: 'expenses' }
  ];

  /** Non-empty pending sections, ready to render as deep-link chips. */
  public pendingSections = computed(() => {
    const counts = this.unsavedCounts();
    return this.sectionDefs
      .map(def => {
        const count = counts[def.key];
        return { key: def.key, count, label: count === 1 ? def.singular : def.plural };
      })
      .filter(section => section.count > 0);
  });

  public menuOpen = signal(false);
  public isPendingRoute = signal(false);
  public autoSaveEnabled = signal(false);
  public isSignedIn = signal<boolean>(false);
  public themePreference = signal<ThemePreference>('system');
  public overlayPositions: ConnectedPosition[] = [
    { originX: 'end', originY: 'bottom', overlayX: 'end', overlayY: 'top', offsetX: 0, offsetY: 6 },
    { originX: 'end', originY: 'top', overlayX: 'end', overlayY: 'bottom', offsetX: 0, offsetY: -6 }
  ];

  public ngOnInit(): void {
    // Keep the trigger highlighted (active-page style) while the pending
    // changes page it links to is open, mirroring routerLinkActive on nav links.
    const updatePendingRoute = () => this.isPendingRoute.set(this.router.url.split('?')[0] === '/pending-changes');
    updatePendingRoute();
    this.router.events
      .pipe(filter(e => e instanceof NavigationEnd), takeUntil(this.destroy$))
      .subscribe(updatePendingRoute);

    // Subscribe to sync state changes
    this.syncStatusService.syncState$
      .pipe(takeUntil(this.destroy$))
      .subscribe(state => {
        this.syncState.set(state);
        this.updateTimeSinceLastSync();
        this.checkUnsavedChanges();
      });

    // Subscribe to messages
    this.syncStatusService.messages$
      .pipe(takeUntil(this.destroy$))
      .subscribe(messages => {
        this.messages.set(messages);
      });

    // Track theme preference
    this.themePreference.set(this.themeService.currentPreference);
    this.themeService.preferenceChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(pref => this.themePreference.set(pref));

    // Subscribe to UI preference for polling/auto-save
    this.uiPreferences.pollingEnabled$
      .pipe(takeUntil(this.destroy$))
      .subscribe(enabled => {
        this.autoSaveEnabled.set(enabled);
      });

    // Track auth state (immediate sync-capable check + profile updates)
    try {
      this.isSignedIn.set(this.authService.isAuthenticatedSync());
    } catch {
      this.isSignedIn.set(false);
    }

    this.authService.profile$
      .pipe(takeUntil(this.destroy$))
      .subscribe(profile => {
        this.isSignedIn.set(!!profile);
      });

    // Perform an async authenticated check to pick up refreshed tokens
    this.authService.isAuthenticated()
      .then(auth => this.isSignedIn.set(!!auth))
      .catch(() => this.isSignedIn.set(false));

    // Update time display and check for unsaved changes every 5 seconds for better responsiveness
    this.intervalId = window.setInterval(() => {
      this.updateTimeSinceLastSync();
      this.checkUnsavedChanges();
    }, 5000);
    
    // Initial check for unsaved changes
    this.checkUnsavedChanges();
  }

  public async toggleAutoSave(enabled: boolean): Promise<void> {
    // Prevent enabling auto-save when user isn't signed in/can't sync
    if (enabled) {
      const canSync = await this.authService.canSync();
      if (!canSync) {
        openSnackbar(this.snackBar, SNACKBAR_MESSAGES.LOGIN_TO_SYNC_CHANGES, { action: SNACKBAR_DEFAULT_ACTION, duration: 5000 });
        // Ensure UI reflects disabled state
        this.autoSaveEnabled.set(false);
        await this.uiPreferences.setPolling(false);
        return;
      }
    }

    this.autoSaveEnabled.set(enabled);
    await this.uiPreferences.setPolling(enabled);
  }

  public setTheme(preference: ThemePreference): void {
    this.themeService.setTheme(preference);
    this.themePreference.set(preference);
  }

  public toggleMenu(): void {
    this.menuOpen.update(v => !v);
  }

  public closeMenu(): void {
    this.menuOpen.set(false);
  }

  private async checkUnsavedChanges(): Promise<void> {
    try {
      const counts = await this.unsavedDataService.getUnsavedCounts();
      this.unsavedCounts.set(counts);
      this.hasUnsavedChanges.set(counts.total > 0);
    } catch {
      // ignore errors getting counts
    }
  }

  public openPendingChanges(section?: PendingSection): void {
    this.closeMenu();
    const extras: NavigationExtras = {};
    if (section) extras.queryParams = { section };
    this.router.navigate(['/pending-changes'], extras);
  }

  public async forceSync(): Promise<void> {    // Safety check: prevent update if there are unsaved changes
    await this.checkUnsavedChanges();

    const canSync = await this.authService.canSync();
    if (!canSync) {
      openSnackbar(this.snackBar, SNACKBAR_MESSAGES.LOGIN_TO_SYNC_CHANGES, { action: SNACKBAR_DEFAULT_ACTION, duration: 5000 });
      return;
    }

    const dialogRef = this.dialog.open(DataSyncModalComponent, {
      panelClass: 'custom-modalbox',
      data: 'save'
    });

    dialogRef.afterClosed().subscribe(async (result: boolean) => {
      if (result) {
        await this.checkUnsavedChanges();
      }
    });
  }

  public async updateFromSpreadsheet(): Promise<void> {
    // Safety check: prevent update if there are unsaved changes
    await this.checkUnsavedChanges();
    if (this.hasUnsavedChanges()) {
      openSnackbar(this.snackBar, SNACKBAR_MESSAGES.CANNOT_UPDATE_UNSAVED_CHANGES, { action: 'Close', duration: 5000, horizontalPosition: 'center', verticalPosition: 'top', panelClass: ['error-snackbar'] });
      return;
    }

    const canSync = await this.authService.canSync();
    if (!canSync) {
      openSnackbar(this.snackBar, SNACKBAR_MESSAGES.LOGIN_TO_LOAD_CHANGES, { action: SNACKBAR_DEFAULT_ACTION, duration: 5000 });
      return;
    }

    const dialogRef = this.dialog.open(DataSyncModalComponent, {
      panelClass: 'custom-modalbox',
      data: 'load'
    });

    dialogRef.afterClosed().subscribe(async (result: boolean) => {
      if (result) {
        await this.checkUnsavedChanges();
      }
    });
  }

  public ngOnDestroy(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    this.destroy$.next();
    this.destroy$.complete();
  }

  private updateTimeSinceLastSync(): void {
    this.timeSinceLastSync.set(this.syncStatusService.getTimeSinceLastSync());
  }

  public getStatusIcon(): string {
    // If signed out, show sync as off
    if (!this.isSignedIn()) return 'cloud_off';

    if (!this.syncState()) return 'cloud_off';

    // Check if auto-sync is disabled
    if (!this.autoSaveEnabled() && this.syncState()!.status === 'idle') {
      return 'sync_disabled';
    }
    
    switch (this.syncState()!.status) {
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

  public getStatusClass(): string {
    // Signed-out state should appear disabled
    if (!this.isSignedIn()) return 'status-disabled';

    if (!this.syncState()) return 'status-idle';

    // Check if auto-sync is disabled
    if (!this.autoSaveEnabled() && this.syncState()!.status === 'idle') {
      return 'status-disabled';
    }

    return `status-${this.syncState()!.status}`;
  }

  public getTooltipText(): string {
    // When not signed in, guide user to sign in for sync
    if (!this.isSignedIn()) return 'Sign in to enable sync';

    if (!this.syncState()) return 'Sync status unknown';

    // Check if auto-sync is disabled
    if (!this.autoSaveEnabled() && this.syncState()!.status === 'idle') {
      return 'Auto-sync disabled';
    }

    switch (this.syncState()!.status) {
      case 'syncing':
        return `${this.syncState()!.message} (${this.syncState()!.progress}%)`;
      case 'success':
        return `${this.syncState()!.message} - ${this.timeSinceLastSync()}`;
      case 'error':
        return this.syncState()!.error || 'Sync failed';
      case 'idle':
      default:
        return `Last sync: ${this.timeSinceLastSync()}`;
    }
  }
  
  public getStatusText(): string {
    if (!this.isSignedIn()) return 'Signed out';

    if (!this.syncState()) return 'Unknown';

    // Check if auto-sync is disabled
    if (!this.autoSaveEnabled() && this.syncState()!.status === 'idle') {
      return 'Disabled';
    }

    return this.syncState()!.message || 'Ready';
  }

  public getOperationText(): string {
    const operation = this.syncState()?.operation;
    if (!operation) return '';
    
    const operationLabels: Record<SyncOperation, string> = {
      'save': 'Saving',
      'load': 'Loading',
      'auto-save': 'Auto-saving'
    };
    
    return operationLabels[operation];
  }

  public getNextCheckText(): string {
    if (!this.isSignedIn()) {
      return 'Sign in to sync';
    }

    if (!this.autoSaveEnabled()) {
      return '-';
    }

    // Auto-save is armed but the timer only runs while there are pending changes.
    if (!this.hasUnsavedChanges()) {
      return 'Idle';
    }

    const next = this.syncState()?.nextSyncIn;
    if (!next || next <= 0) {
      return '-';
    }

    return `in ${next}s`;
  }

  public toggleDetailedView(): void {
    this.showDetailedView.update(v => !v);
  }

  public clearMessages(): void {
    this.syncStatusService.clearMessages();
  }

  public getMessageIcon(type: string): string {
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

  public formatTimestamp(date: Date): string {
    return new Date(date).toLocaleTimeString();
  }
}
