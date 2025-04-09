import { Component, OnInit } from '@angular/core';
import { ISpreadsheet } from '@interfaces/spreadsheet.interface';
import { CommonService } from '@services/common.service';
import { SpreadsheetService } from '@services/spreadsheet.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit {
  defaultSheet: ISpreadsheet | undefined;
  
  constructor(
    private _commonService: CommonService,
    private _spreadsheetService: SpreadsheetService,
    private router: Router
  ) { 
    this._commonService.onHeaderLinkUpdate.subscribe((data: any) => {
        this.load();
      })
  }

  async ngOnInit(): Promise<void> {
    this.load();
  }

  public async load() {
    this.defaultSheet = (await this._spreadsheetService.querySpreadsheets("default", "true"))[0];
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
