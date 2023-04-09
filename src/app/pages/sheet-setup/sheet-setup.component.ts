import { Component } from '@angular/core';

@Component({
  selector: 'app-sheet-setup',
  templateUrl: './sheet-setup.component.html',
  styleUrls: ['./sheet-setup.component.scss']
})
export class SheetSetupComponent {

  public getDataSize() {
    // return LocalStorageHelper.formatBytes(LocalStorageHelper.getDataSize());
  }
}
