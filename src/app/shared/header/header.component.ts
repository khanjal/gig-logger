import { Component, OnInit, OnDestroy } from '@angular/core';
import { ISpreadsheet } from '@interfaces/spreadsheet.interface';
import { CommonService } from '@services/common.service';
import { SpreadsheetService } from '@services/spreadsheet.service';
import { AuthGoogleService } from '@services/auth-google.service';
import { RouterLink, RouterOutlet } from '@angular/router';
import { MatToolbar } from '@angular/material/toolbar';
import { MatIcon } from '@angular/material/icon';

@Component({
    selector: 'app-header',
    templateUrl: './header.component.html',
    styleUrls: ['./header.component.scss'],
    standalone: true,
    imports: [MatToolbar, RouterLink, MatIcon, RouterOutlet]
})
export class HeaderComponent implements OnInit {
  defaultSheet: ISpreadsheet | undefined;
  isAuthenticated = false;
  
  constructor(
    private _commonService: CommonService,
    private _spreadsheetService: SpreadsheetService,
    private authService: AuthGoogleService,
  ) { 
    this._commonService.onHeaderLinkUpdate.subscribe((data: any) => {
        this.load();
    });
  }

  async ngOnInit(): Promise<void> {
    // Check authentication state
    this.isAuthenticated = await this.authService.isAuthenticated();

    // Load initial data if authenticated
    if (this.isAuthenticated) {
      this.load();
    }
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