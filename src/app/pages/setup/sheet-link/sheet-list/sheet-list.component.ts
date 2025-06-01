import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { GigLoggerService } from '@services/gig-logger.service';

@Component({
  selector: 'app-sheet-list',
  standalone: true,
  imports: [],
  templateUrl: './sheet-list.component.html',
  styleUrl: './sheet-list.component.scss'
})
export class SheetListComponent {

  constructor(
    private _gigLoggerService: GigLoggerService,
    private dialogRef: MatDialogRef<SheetListComponent>
  ) { }
  
  listSheets() {
    // Create a new sheet from gig logger
    this._gigLoggerService.listFiles().then(() => {
      // this.parentReload.emit();
    }).catch((error) => {
      console.error('Error listing sheets:', error);
    });
  }
}
