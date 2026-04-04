import { MatSnackBarConfig } from '@angular/material/snack-bar';

export interface ISnackbarOptions extends MatSnackBarConfig {
  action?: string;
}
