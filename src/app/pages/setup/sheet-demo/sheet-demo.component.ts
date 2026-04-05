import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { BaseRectButtonComponent } from '@components/base/base-rect-button/base-rect-button.component';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SNACKBAR_MESSAGES, SNACKBAR_DEFAULT_ACTION } from '@constants/snackbar.constants';
import { openSnackbar } from '@utils/snackbar.util';
import { AuthGoogleService } from '@services/auth-google.service';
import { LoggerService } from '@services/logger.service';
import { MatDialog } from '@angular/material/dialog';
import { DataSyncModalComponent } from '@components/data/data-sync-modal/data-sync-modal.component';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-sheet-demo',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatProgressSpinnerModule, 
    BaseRectButtonComponent
  ],
  templateUrl: './sheet-demo.component.html',
  styleUrl: './sheet-demo.component.scss'
})

export class SheetDemoComponent {
  @Output("parentReload") parentReload: EventEmitter<any> = new EventEmitter();

  creatingDemo: boolean = false;

  constructor(
    private _dialog: MatDialog,
    private _snackBar: MatSnackBar,
    private _logger: LoggerService,
    protected authService: AuthGoogleService
  ) { }

  async createDemoSheet() {
    const canSync = await this.authService.canSync();
    if (!canSync) {
      openSnackbar(this._snackBar, SNACKBAR_MESSAGES.LOGIN_TO_LOAD_SAVE, { action: SNACKBAR_DEFAULT_ACTION, duration: 5000 });
      return;
    }

    this.creatingDemo = true;

    const dialogRef = this._dialog.open(DataSyncModalComponent, {
      panelClass: 'custom-modalbox',
      data: 'create-demo'
    });

    try {
      const result = await firstValueFrom(dialogRef.afterClosed());
      if (result) {
        this.parentReload.emit();
        openSnackbar(this._snackBar, SNACKBAR_MESSAGES.DEMO_SPREADSHEET_CREATED, { action: SNACKBAR_DEFAULT_ACTION, duration: 5000 });
      }
    } catch (error) {
      this._logger.error('Error creating demo spreadsheet', error);
      openSnackbar(this._snackBar, SNACKBAR_MESSAGES.DEMO_SPREADSHEET_ERROR, { action: SNACKBAR_DEFAULT_ACTION, duration: 5000 });
    } finally {
      this.creatingDemo = false;
    }
  }
}
