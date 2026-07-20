import type { OnInit} from '@angular/core';
import { Component, EventEmitter, Output, signal, inject } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import type { ISpreadsheet } from '@interfaces/sheets/spreadsheet.interface';
import { SpreadsheetService } from '@services/spreadsheet.service';
import { environment } from "src/environments/environment";
import { BaseRectButtonComponent } from '@components/base/base-rect-button/base-rect-button.component';
import { BaseInputComponent } from '@components/base/base-input/base-input.component';

@Component({
    selector: 'app-sheet-add-form',
    templateUrl: './sheet-add-form.component.html',
    styleUrls: ['./sheet-add-form.component.scss'],
    standalone: true,
    imports: [FormsModule, ReactiveFormsModule, BaseRectButtonComponent, BaseInputComponent]
})
export class SheetAddFormComponent implements OnInit {
  private _spreadsheetService = inject(SpreadsheetService);

  @Output() public parentReload = new EventEmitter<void>();
  private demoSheetId = environment.demoSheet;
  
  public sheetForm = new FormGroup({
    sheetId: new FormControl(''),
    sheetName: new FormControl('')
  });

  public saving = signal(false);
  public defaultSpreadsheet: ISpreadsheet | undefined;

  public async ngOnInit(): Promise<void> {
    await this.load();
  }

  public async load() {
    this.defaultSpreadsheet = (await this._spreadsheetService.querySpreadsheets("default", "true"))[0];
  }
  public async addSheet() {
    this.saving.set(true);

    let spreadsheetId: string = this.sheetForm.value.sheetId ?? "";

    if(spreadsheetId.includes("/")) {
      const spreadsheetGroups = new RegExp("/spreadsheets/d/([a-zA-Z0-9-_]+)").exec(spreadsheetId);

      if(spreadsheetGroups && spreadsheetGroups?.length > 0) {
        spreadsheetId = spreadsheetGroups[1];
      }
    }

    if(!spreadsheetId) {
      this.saving.set(false);
      return;
    }

    try {
      await this.setupSheet(spreadsheetId);
      this.sheetForm.reset();
      this.parentReload.emit();
    } finally {
      this.saving.set(false);
    }
  }

  public async addDemo() {
    this.saving.set(true);

    this.sheetForm.controls.sheetId.setValue(this.demoSheetId);
    this.sheetForm.controls.sheetName.setValue("Demo");

    await this.addSheet();
    await this.load();
  }
  public async setupSheet(id: string) {
    await this.load();
  
    const spreadsheet = {} as ISpreadsheet;
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