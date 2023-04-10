import { Component } from '@angular/core';
import { ISpreadsheet } from '@interfaces/spreadsheet.interface';
import { GoogleSheetService } from '@services/googleSheet.service';
import { SpreadsheetService } from '@services/spreadsheet.service';

@Component({
  selector: 'app-setup',
  templateUrl: './setup.component.html',
  styleUrls: ['./setup.component.scss']
})
export class SetupComponent {

  deleting: boolean = false;
  reloading: boolean = false;
  setting: boolean = false;
  spreadsheets: ISpreadsheet[] | undefined;

  constructor(
    private _googleSheetService: GoogleSheetService,
    private _spreadsheetService: SpreadsheetService
  ) { }

  async ngOnInit(): Promise<void> {
    this.load();
  }

  public async load() {
    this.spreadsheets = await this._spreadsheetService.getSpreadsheets();
  }

  public async reload() {
    this.reloading = true;
    await this._googleSheetService.loadRemoteData();
    this.reloading = false;
  }

  public async setDefault(spreadsheet: ISpreadsheet) {
    this.setting = true;
    // Make current default not default
    let defaultSpreadsheet = (await this._spreadsheetService.querySpreadsheets("default", "true"))[0];
    defaultSpreadsheet.default = "false";
    await this._spreadsheetService.update(defaultSpreadsheet);

    spreadsheet.default = "true";
    await this._spreadsheetService.update(spreadsheet);
    this.load();
    this.reload();
    this.setting = false;
  }

  public async deleteSpreadsheet(spreadsheet: ISpreadsheet) {
    this.deleting = true;
    if (spreadsheet.default === "false") {
      await this._spreadsheetService.deleteSpreadsheet(spreadsheet);
    }

    this.deleting = false;

    this.load();
  }

  public async deleteAllData() {
    this.deleting = true;
    this._spreadsheetService.deleteData();

    this.spreadsheets = [];
    this.deleting = false;

    window.location.reload();
  }

  public getDataSize() {
    // return LocalStorageHelper.formatBytes(LocalStorageHelper.getDataSize());
  }
}
