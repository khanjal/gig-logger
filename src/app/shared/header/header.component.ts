import { Component, OnInit, OnDestroy } from '@angular/core';
import { ISpreadsheet } from '@interfaces/spreadsheet.interface';
import { CommonService } from '@services/common.service';
import { SpreadsheetService } from '@services/spreadsheet.service';
import { AuthGoogleService } from '@services/auth-google.service';
import { RouterLink, RouterOutlet, NavigationEnd, Router } from '@angular/router';
import { MatToolbar } from '@angular/material/toolbar';
import { MatIcon } from '@angular/material/icon';
import { MatTooltip } from '@angular/material/tooltip';
import { NgIf } from '@angular/common';
import { interval, Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { ShiftService } from '@services/sheets/shift.service';
import { TripService } from '@services/sheets/trip.service';

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
      NgIf
    ]
})
export class HeaderComponent implements OnInit, OnDestroy {
  defaultSheet: ISpreadsheet | undefined;
  isAuthenticated = false;
  isLoading = false;
  currentRoute = '/';
  isMenuOpen = false;

  // Notification badge counts for unsaved trips and shifts
  public unsavedTripsCount: number = 0;
  public unsavedShiftsCount: number = 0;
  
  private headerSubscription: Subscription;
  private routerSubscription: Subscription;
  private unsavedCountInterval: Subscription;

  constructor(
    private _commonService: CommonService,
    private _spreadsheetService: SpreadsheetService,
    private authService: AuthGoogleService,
    private router: Router,
    private shiftService: ShiftService,
    private tripService: TripService
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
    
    // Poll for unsaved counts every 5 seconds
    this.unsavedCountInterval = interval(5000).subscribe(() => this.updateUnsavedCounts());
    // Initial fetch
    this.updateUnsavedCounts();
  }

  async ngOnInit(): Promise<void> {
    // Show loading indicator
    this.setLoadingState(true);
    
    try {
      // Check authentication state
      this.isAuthenticated = await this.authService.isAuthenticated();

      // Load initial data if authenticated
      if (this.isAuthenticated) {
        await this.load();
      }
    } catch (error) {
      console.error('Error during header initialization:', error);
    } finally {
      this.setLoadingState(false);
    }
  }

  public async load(): Promise<void> {
    this.setLoadingState(true);
    
    try {
      // Only load data if authenticated
      if (this.isAuthenticated) {
        this.defaultSheet = (await this._spreadsheetService.querySpreadsheets("default", "true"))[0];
      }
    } catch (error) {
      console.error('Error loading header data:', error);
    } finally {
      this.setLoadingState(false);
    }
  }
  
  private async updateUnsavedCounts() {
    // Only update if authenticated
    if (!this.isAuthenticated) {
      this.unsavedTripsCount = 0;
      this.unsavedShiftsCount = 0;
      return;
    }
    this.unsavedTripsCount = (await this.tripService.getUnsaved()).length;
    this.unsavedShiftsCount = (await this.shiftService.getUnsavedShifts()).length;
  }

  public getToolbarColor(): string {
    const subdomain = window.location.hostname.split('.')[0];
    switch (subdomain) {      case 'gig':
        return 'primary';
      case 'gig-test':
        return 'accent';
      default:
        return 'warn';
    }
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