import { Component, EventEmitter, Output } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { ISheet } from '@interfaces/sheet.interface';
import { ISpreadsheet } from '@interfaces/spreadsheet.interface';
import { GigLoggerService } from '@services/gig-logger.service';
import { SpreadsheetService } from '@services/spreadsheet.service';

@Component({
  selector: 'sheet-add-form',
  templateUrl: './sheet-add-form.component.html',
  styleUrls: ['./sheet-add-form.component.scss']
})
export class SheetAddFormComponent {
  @Output("parentReload") parentReload: EventEmitter<any> = new EventEmitter();
  
  sheetForm = new FormGroup({
    sheetId: new FormControl('')
  });

  saving: boolean = false;

  constructor(
    private _gigLoggerService: GigLoggerService,
    private _spreadsheetService: SpreadsheetService
  ) { }

  public async addSheet() {
    this.saving = true;

    let spreadsheetId: string = this.sheetForm.value.sheetId ?? "";
    // console.log(sheetId);

    if(spreadsheetId.includes("/")) {
      let spreadsheetGroups = new RegExp("/spreadsheets/d/([a-zA-Z0-9-_]+)").exec(spreadsheetId);

      if(spreadsheetGroups && spreadsheetGroups?.length > 0) {
        spreadsheetId = spreadsheetGroups[1];
      }
    }

    if(!spreadsheetId) {
      this.saving = false;
      return;
    }

    // console.log(spreadsheetId);
    await this.setupForm(spreadsheetId);

    this.sheetForm.reset();
    this.parentReload.emit();
  }

  public async setupForm(id: string) {
    // let sheetTitle = await this._googleService.getSheetTitle(id);
    let sheetTitle = id.substring(0, 5);

    if(sheetTitle != "") {
      console.log(sheetTitle);
      let spreadsheet = {} as ISpreadsheet;
      spreadsheet.id = id;
      spreadsheet.name = sheetTitle;
      spreadsheet.default = "false";

      // Check for default spreadsheet
      let defaultSpreadsheet = (await this._spreadsheetService.querySpreadsheets("default", "true"))[0];

      if (!defaultSpreadsheet?.id || defaultSpreadsheet.id === spreadsheet.id) {
        console.log("Setting default to true");
        spreadsheet.default = "true";
      }

      // Change this to check spreadsheet details to make sure it's a valid spreadsheet.
      // Add sheet & load data from it.
      await this._spreadsheetService.update(spreadsheet);

      
      if (spreadsheet.default === "true") {
        console.log("Loading default data");
        // await this._googleService.loadRemoteData();
        (await this._gigLoggerService.getSheetData(spreadsheet.id)).subscribe(async (data) => {
            await this._gigLoggerService.loadData(<ISheet>data);
            this.saving = false;
          }
        );
      }
    }
    else {
      // Error
    }
  }
}


