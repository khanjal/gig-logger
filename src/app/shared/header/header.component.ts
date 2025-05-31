import { Component, OnInit, OnDestroy } from '@angular/core';
import { ISpreadsheet } from '@interfaces/spreadsheet.interface';
import { CommonService } from '@services/common.service';
import { SpreadsheetService } from '@services/spreadsheet.service';
import { AuthGoogleService } from '@services/auth-google.service';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { MatToolbar } from '@angular/material/toolbar';
import { MatIcon } from '@angular/material/icon';
import { Subject, takeUntil } from 'rxjs';

@Component({
    selector: 'app-header',
    templateUrl: './header.component.html',
    styleUrls: ['./header.component.scss'],
    standalone: true,
    imports: [MatToolbar, RouterLink, MatIcon, RouterOutlet]
})
export class HeaderComponent implements OnInit, OnDestroy {
  defaultSheet: ISpreadsheet | undefined;
  isAuthenticated = false;
  private destroy$ = new Subject<void>();
  
  constructor(
    private _commonService: CommonService,
    private _spreadsheetService: SpreadsheetService,
    private authService: AuthGoogleService,
    private router: Router
  ) { 
    this._commonService.onHeaderLinkUpdate.subscribe((data: any) => {
        this.load();
    });
  }

  async ngOnInit(): Promise<void> {
    // Check authentication state
    this.isAuthenticated = await this.authService.isAuthenticated();
    
    // Subscribe to authentication changes
    this.authService.profile$
      .pipe(takeUntil(this.destroy$))
      .subscribe(profile => {
        this.isAuthenticated = !!profile;
        // Reload data when authentication changes
        if (this.isAuthenticated) {
          this.load();
        } else {
          this.defaultSheet = undefined;
        }
      });

    // Load initial data if authenticated
    if (this.isAuthenticated) {
      this.load();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  public async load() {
    // Only load data if authenticated
    if (this.isAuthenticated) {
      this.defaultSheet = (await this._spreadsheetService.querySpreadsheets("default", "true"))[0];
    }
  }

  public getToolbarColor(): string {
    const subdomain = window.location.hostname.split('.')[0];
    switch (subdomain) {
      case 'gig':
        return 'primary';
      case 'gig-test':
        return 'accent';
      default:
        return 'warn';
    }
  }
}