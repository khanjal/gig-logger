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
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';

@Component({
    selector: 'app-header',
    templateUrl: './header.component.html',
    styleUrls: ['./header.component.scss'],
    standalone: true,    imports: [
      MatToolbar, 
      RouterLink, 
      MatIcon, 
      MatTooltip,
      RouterOutlet,
      NgIf
    ]
})
export class HeaderComponent implements OnInit, OnDestroy {  defaultSheet: ISpreadsheet | undefined;
  isAuthenticated = false;
  isLoading = false;
  currentRoute = '/';
  isMenuOpen = false;
  pageTitle = 'Home';
  
  private headerSubscription: Subscription;
  private routerSubscription: Subscription;
  
  constructor(
    private _commonService: CommonService,
    private _spreadsheetService: SpreadsheetService,
    private authService: AuthGoogleService,
    private router: Router
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
        this.updatePageTitle(event.url);
        this.setLoadingState(false); // Hide loading when navigation completes
      });
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
      
      // Set initial page title
      this.updatePageTitle(this.router.url);
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
  }
  /**
   * Closes the mobile menu
   */
  public closeMenu(): void {
    this.isMenuOpen = false;
  }

  /**
   * Updates the page title based on the current route
   * @param route - The current route URL
   */
  private updatePageTitle(route: string): void {
    const routeMap: { [key: string]: string } = {
      '/': 'Home',
      '/trips': 'Trips',
      '/shifts': 'Shifts',
      '/stats': 'Statistics',
      '/calculator': 'Calculator',
      '/setup': 'Settings'
    };

    // Handle route parameters and query strings
    const cleanRoute = route.split('?')[0].split(';')[0];
    
    this.pageTitle = routeMap[cleanRoute] || 'Gig Logger';
  }

  ngOnDestroy(): void {
    // Unsubscribe to prevent memory leaks
    if (this.headerSubscription) {
      this.headerSubscription.unsubscribe();
    }
    
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
  }
}