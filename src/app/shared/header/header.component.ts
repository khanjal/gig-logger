import { Component, OnInit } from '@angular/core';
import { ISpreadsheet } from '@interfaces/spreadsheet.interface';
import { CommonService } from '@services/common.service';
import { SpreadsheetService } from '@services/spreadsheet.service';

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

}
