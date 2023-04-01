import { Component } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';

@Component({
  selector: 'sheet-setup-form',
  templateUrl: './sheet-setup-form.component.html',
  styleUrls: ['./sheet-setup-form.component.scss']
})
export class SheetSetupFormComponent {
  sheetForm = new FormGroup({
    sheetid: new FormControl('')
  });

  public addSheet() {

  }
}
