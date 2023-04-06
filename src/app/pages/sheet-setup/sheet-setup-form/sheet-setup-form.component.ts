import { Component } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { GoogleSheetService } from 'src/app/shared/services/googleSheet.service';

@Component({
  selector: 'sheet-setup-form',
  templateUrl: './sheet-setup-form.component.html',
  styleUrls: ['./sheet-setup-form.component.scss']
})
export class SheetSetupFormComponent {
  
  sheetForm = new FormGroup({
    sheetId: new FormControl('')
  });

  saving: boolean = false;

  constructor(
    private _googleService: GoogleSheetService
  ) { }

  public async addSheet() {
    this.saving = true;

    let spreadsheetId: string = this.sheetForm.value.sheetId ?? "";
    // console.log(sheetId);

    if(spreadsheetId.includes("/")) {
      spreadsheetId = new RegExp("/spreadsheets/d/([a-zA-Z0-9-_]+)").exec(spreadsheetId)![1];
    }
    
    let sheetTitle = await this._googleService.getSheetTitle(spreadsheetId);

    if(sheetTitle != "") {
      console.log(sheetTitle);

      // TODO: Verify all the sheets exist
      // Add sheet & load data from it.

      await this._googleService.loadRemoteData(spreadsheetId);

      // TODO: Show sheet in list to remove (delete data)
    }
    else {
      // Error
    }

    this.saving = false;
    this.sheetForm.reset();
  }
}
