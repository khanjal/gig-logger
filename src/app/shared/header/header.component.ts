import { Component, OnInit, OnDestroy, Output, EventEmitter, Input, signal } from '@angular/core';
import { ISpreadsheet } from '@interfaces/spreadsheet.interface';
import { CommonService } from '@services/common.service';
import { SpreadsheetService } from '@services/spreadsheet.service';
import { AuthGoogleService } from '@services/auth-google.service';
import { LoggerService } from '@services/logger.service';
import { ThemeService } from '@services/theme.service';

import type { ThemePreference } from '@interfaces/theme.interface';
import { RouterLink, RouterOutlet, NavigationEnd, Router } from '@angular/router';
import { MatToolbar } from '@angular/material/toolbar';
import { MatIcon } from '@angular/material/icon';
import { MatTooltip } from '@angular/material/tooltip';
import { NgIf } from '@angular/common';
import { interval, Subject } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';
import { ShiftService } from '@services/sheets/shift.service';
import { TripService } from '@services/sheets/trip.service';
import { SyncStatusIndicatorComponent } from '@components/sync/sync-status-indicator/sync-status-indicator.component';

@Component({
    selector: 'app-header',
    templateUrl: './header.component.html',
    styleUrls: ['./header.component.scss'],
    standalone: true,
    imports: [
      MatToolbar, 
      RouterLink, 
      MatIcon, 
      MatTooltip,
      RouterOutlet,
      NgIf,
      SyncStatusIndicatorComponent
    ]
})
export class HeaderComponent implements OnInit, OnDestroy {
  @Output() error = new EventEmitter<Error>();
  
  defaultSheet = signal<ISpreadsheet | undefined>(undefined);
  isAuthenticated = signal(false);
  // True when user can't sync remotely but has local spreadsheets
  localOnlyMode = signal(false);
  isLoading = signal(false);
  currentRoute = signal('/');
  isMenuOpen = signal(false);

  // Notification badge counts for unsaved trips and shifts
  public unsavedTripsCount = signal(0);
  public unsavedShiftsCount = signal(0);
  
  // Polling interval for unsaved counts (ms)
  public static readonly DEFAULT_UNSAVED_POLL_INTERVAL = 5000;
  @Input() unsavedPollInterval: number = HeaderComponent.DEFAULT_UNSAVED_POLL_INTERVAL;

  // Timeout for header initialization (ms)
  public static readonly HEADER_INIT_TIMEOUT_MS = 10000;

  // Destroy subject for managing subscription cleanup
  private destroy$ = new Subject<void>();
  private spreadsheetsSubscription?: { unsubscribe: () => void };

  // Theme state
  themePreference = signal<ThemePreference>('system');
  resolvedTheme = signal<'light' | 'dark'>('light');
  toolbarGradient = 'linear-gradient(135deg, var(--primary-800), var(--primary-900))'; // uses theme tokens for gradient

  constructor(
    private _commonService: CommonService,
    private _spreadsheetService: SpreadsheetService,
    private authService: AuthGoogleService,
    private router: Router,
    private shiftService: ShiftService,
    private tripService: TripService,
    private logger: LoggerService,
    private themeService: ThemeService
  ) { 
    // Subscribe to header updates with automatic cleanup on destroy
    this._commonService.onHeaderLinkUpdate
      .pipe(takeUntil(this.destroy$))
      .subscribe((data: any) => {
        this.load();
      });
    
    // Subscribe to route changes for loading indicator with automatic cleanup
    this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd),
        takeUntil(this.destroy$)
      )
      .subscribe((event: NavigationEnd) => {
        this.currentRoute.set(event.url);
        this.setLoadingState(false); // Hide loading when navigation completes
      });
    
    // Start polling for unsaved counts at configurable interval with automatic cleanup
    interval(this.unsavedPollInterval)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.updateUnsavedCounts());

    this.spreadsheetsSubscription = this._spreadsheetService.spreadsheets$.subscribe((sheets: ISpreadsheet[]) => {
      const availableSheets = sheets ?? [];
      this.defaultSheet.set(availableSheets.find((sheet: ISpreadsheet) => sheet.default === 'true'));

      if (!this.isAuthenticated()) {
        this.localOnlyMode.set(availableSheets.length > 0);
      }
    });

    // Theme updates
    this.themeService.preferenceChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(preference => {
        this.themePreference.set(preference);
      });

    this.themeService.activeTheme$
      .pipe(takeUntil(this.destroy$))
      .subscribe(active => {
        this.resolvedTheme.set(active);
      });
  }

  async ngOnInit(): Promise<void> {
    // Show loading indicator
    this.setLoadingState(true);
    try {
      // Add timeout to prevent hanging
      await Promise.race([
        this.initializeHeader(),
        new Promise<void>((_, reject) => 
          setTimeout(() => reject(new Error('Header initialization timeout')), HeaderComponent.HEADER_INIT_TIMEOUT_MS)
        )
      ]);
      // Initial fetch of unsaved counts (after authentication check)
      await this.updateUnsavedCounts();
    } catch (error) {
      this.logger.error('Error during header initialization:', error);
      this.error.emit(error instanceof Error ? error : new Error('Header initialization failed'));
    } finally {
      this.setLoadingState(false);
    }
  }

  private async initializeHeader(): Promise<void> {
    // Check authentication state
    this.isAuthenticated.set(await this.authService.canSync());
    // Determine whether the app is in local-only mode (signed out or offline but sheets exist)
    try {
      const sheets = (await this._spreadsheetService.getSpreadsheets()) || [];
      this.localOnlyMode.set(!this.isAuthenticated() && sheets.length > 0);
    } catch (e) {
      this.localOnlyMode.set(false);
    }

    // Regardless of auth, try to locate the default sheet so navigation can show when a sheet exists
    try {
      const defaultSheets = (await this._spreadsheetService.querySpreadsheets('default', 'true')) || [];
      this.defaultSheet.set(defaultSheets[0]);
    } catch (e) {
      // ignore - defaultSheet remains whatever it was
    }

    // Load initial data if authenticated
    if (this.isAuthenticated()) {
      await this.load();
    }
  }

  public async load(): Promise<void> {
    this.setLoadingState(true);
    
    try {
      // Add timeout to prevent hanging
      await Promise.race([
        this.loadHeaderData(),
        new Promise<void>((_, reject) => 
          setTimeout(() => reject(new Error('Header data loading timeout')), 8000)
        )
      ]);
    } catch (error) {
      this.logger.error('Error loading header data:', error);
      this.error.emit(error instanceof Error ? error : new Error('Header data loading failed'));
      // Don't throw - allow app to continue with degraded functionality
    } finally {
      this.setLoadingState(false);
    }
  }

  private async loadHeaderData(): Promise<void> {
    // Only load data if authenticated
    if (this.isAuthenticated()) {
      const sheets = (await this._spreadsheetService.querySpreadsheets("default", "true")) || [];
      this.defaultSheet.set(sheets[0]);
    }
  }
  
  private async updateUnsavedCounts() {
    // Check authentication state before updating
    this.isAuthenticated.set(await this.authService.canSync());
    const trips = (await this.tripService.getUnsaved()) || [];
    const shifts = (await this.shiftService.getUnsavedShifts()) || [];
    this.unsavedTripsCount.set(trips.length);
    this.unsavedShiftsCount.set(shifts.length);
  }
  
  /**
   * Sets the loading state for the header loading indicator
   * @param loading - Whether the app is in a loading state
   */
  private setLoadingState(loading: boolean): void {
    // Use setTimeout to ensure smooth animations
    setTimeout(() => {
      this.isLoading.set(loading);
    }, loading ? 0 : 300); // Delay hiding to show completion
  }
    /**
   * Determines if the current route matches the given route
   * @param route - Route to check against
   * @returns True if the current route matches
   */
  public isActiveRoute(route: string): boolean {
      return this.currentRoute() === route || 
        (route === '/' && this.currentRoute() === '/');
  }

  /**
   * Toggles the mobile menu open/closed state
   */
  public toggleMenu(): void {
    this.isMenuOpen.update((open) => !open);
  }  /**
   * Closes the mobile menu
   */
  public closeMenu(): void {
    this.isMenuOpen.set(false);
  }

  ngOnDestroy(): void {
    // Complete the destroy subject to trigger takeUntil in all subscriptions
    this.destroy$.next();
    this.destroy$.complete();
    this.spreadsheetsSubscription?.unsubscribe();
  }

  public cycleTheme(): void {
    const order: ThemePreference[] = ['light', 'dark', 'system'];
    const currentIndex = order.indexOf(this.themePreference());
    const next = order[(currentIndex + 1) % order.length];
    this.themeService.setTheme(next);
  }

  public get themeLabel(): string {
    switch (this.themePreference()) {
      case 'dark':
        return 'Dark';
      case 'light':
        return 'Light';
      default:
        return 'System';
    }
  }

  public get themeIcon(): string {
    if (this.themePreference() === 'system') {
      return 'brightness_auto';
    }
    return this.resolvedTheme() === 'dark' ? 'dark_mode' : 'light_mode';
  }
}