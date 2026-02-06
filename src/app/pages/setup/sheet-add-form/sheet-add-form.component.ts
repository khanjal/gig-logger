import { Component, EventEmitter, Output } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ISpreadsheet } from '@interfaces/spreadsheet.interface';
import { SpreadsheetService } from '@services/spreadsheet.service';
import { environment } from "src/environments/environment";
import { CommonModule } from '@angular/common';
import { BaseButtonComponent, BaseInputComponent } from '@components/base';

@Component({
    selector: 'sheet-add-form',
    templateUrl: './sheet-add-form.component.html',
    styleUrls: ['./sheet-add-form.component.scss'],
    standalone: true,
    imports: [FormsModule, ReactiveFormsModule, CommonModule, BaseButtonComponent, BaseInputComponent]
})
export class SheetAddFormComponent {
  @Output("parentReload") parentReload: EventEmitter<any> = new EventEmitter();
  private demoSheetId = environment.demoSheet;
  
  sheetForm = new FormGroup({
    sheetId: new FormControl(''),
    sheetName: new FormControl('')
  });

  saving: boolean = false;
  defaultSpreadsheet: ISpreadsheet | undefined;

  constructor(
    private _spreadsheetService: SpreadsheetService
  ) { }

  async ngOnInit(): Promise<void> {
    await this.load();
  }

  async load() {
    this.defaultSpreadsheet = (await this._spreadsheetService.querySpreadsheets("default", "true"))[0];
  }
  public async addSheet() {
    this.saving = true;

    let spreadsheetId: string = this.sheetForm.value.sheetId ?? "";

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

    await this.setupSheet(spreadsheetId);

    this.sheetForm.reset();
    this.parentReload.emit();
  }

  public async addDemo() {
    this.saving = true;

    this.sheetForm.controls.sheetId.setValue(this.demoSheetId);
    this.sheetForm.controls.sheetName.setValue("Demo");

    await this.addSheet();
    await this.load();
  }
  public async setupSheet(id: string) {
    await this.load();
  
    let spreadsheet = {} as ISpreadsheet;
    spreadsheet.id = id;
    spreadsheet.default = "false";

    // Check for default spreadsheet
    if (!this.defaultSpreadsheet?.id || this.defaultSpreadsheet.id === spreadsheet.id) {
      spreadsheet.default = "true";
    }

    // Add sheet
    await this._spreadsheetService.update(spreadsheet);
  }          
}