import { Component, OnInit, OnDestroy, Output, EventEmitter, Input } from '@angular/core';
import { ISpreadsheet } from '@interfaces/spreadsheet.interface';
import { CommonService } from '@services/common.service';
import { SpreadsheetService } from '@services/spreadsheet.service';
import { AuthGoogleService } from '@services/auth-google.service';
import { LoggerService } from '@services/logger.service';
import { RouterLink, RouterOutlet, NavigationEnd, Router } from '@angular/router';
import { MatToolbar } from '@angular/material/toolbar';
import { MatIcon } from '@angular/material/icon';
import { MatTooltip } from '@angular/material/tooltip';
import { NgIf } from '@angular/common';
import { interval, Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
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
  
  defaultSheet: ISpreadsheet | undefined;
  isAuthenticated = false;
  isLoading = false;
  currentRoute = '/';
  isMenuOpen = false;

  // Notification badge counts for unsaved trips and shifts
  public unsavedTripsCount: number = 0;
  public unsavedShiftsCount: number = 0;
  
  // Polling interval for unsaved counts (ms)
  public static readonly DEFAULT_UNSAVED_POLL_INTERVAL = 5000;
  @Input() unsavedPollInterval: number = HeaderComponent.DEFAULT_UNSAVED_POLL_INTERVAL;

  // Timeout for header initialization (ms)
  public static readonly HEADER_INIT_TIMEOUT_MS = 10000;

  private headerSubscription: Subscription;
  private routerSubscription: Subscription;
  private unsavedCountInterval: Subscription;

  constructor(
    private _commonService: CommonService,
    private _spreadsheetService: SpreadsheetService,
    private authService: AuthGoogleService,
    private router: Router,
    private shiftService: ShiftService,
    private tripService: TripService,
    private logger: LoggerService
  ) { 
    // Subscribe to header updates
    this.headerSubscription = this._commonService.onHeaderLinkUpdate.subscribe((data: any) => {
        this.load();
    });
    
    // Subscribe to route changes for loading indicator
    this.routerSubscription = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.currentRoute = event.url;
        this.setLoadingState(false); // Hide loading when navigation completes
      });
    // Start polling for unsaved counts at configurable interval
    this.unsavedCountInterval = interval(this.unsavedPollInterval).subscribe(() => this.updateUnsavedCounts());
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
    this.isAuthenticated = await this.authService.isAuthenticated();

    // Load initial data if authenticated
    if (this.isAuthenticated) {
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
    if (this.isAuthenticated) {
      this.defaultSheet = (await this._spreadsheetService.querySpreadsheets("default", "true"))[0];
    }
  }
  
  private async updateUnsavedCounts() {
    // Check authentication state before updating
    this.isAuthenticated = await this.authService.isAuthenticated();
    if (!this.isAuthenticated) {
      this.unsavedTripsCount = 0;
      this.unsavedShiftsCount = 0;
      return;
    }
    this.unsavedTripsCount = (await this.tripService.getUnsaved()).length;
    this.unsavedShiftsCount = (await this.shiftService.getUnsavedShifts()).length;
  }
  
  /**
   * Sets the loading state for the header loading indicator
   * @param loading - Whether the app is in a loading state
   */
  private setLoadingState(loading: boolean): void {
    // Use setTimeout to ensure smooth animations
    setTimeout(() => {
      this.isLoading = loading;
    }, loading ? 0 : 300); // Delay hiding to show completion
  }
    /**
   * Determines if the current route matches the given route
   * @param route - Route to check against
   * @returns True if the current route matches
   */
  public isActiveRoute(route: string): boolean {
    return this.currentRoute === route || 
           (route === '/' && this.currentRoute === '/');
  }

  /**
   * Toggles the mobile menu open/closed state
   */
  public toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
  }  /**
   * Closes the mobile menu
   */
  public closeMenu(): void {
    this.isMenuOpen = false;
  }

  ngOnDestroy(): void {
    // Unsubscribe to prevent memory leaks
    if (this.headerSubscription) {
      this.headerSubscription.unsubscribe();
    }
    
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
    if (this.unsavedCountInterval) {
      this.unsavedCountInterval.unsubscribe();
    }
  }
}