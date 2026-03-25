import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';
import { SNACKBAR_DEFAULT_ACTION } from '@constants/snackbar.constants';

export interface OpenSnackbarOptions extends MatSnackBarConfig {
  action?: string;
}

export function openSnackbar(snackBar: MatSnackBar, message: string, opts?: OpenSnackbarOptions) {
  const defaultConfig: MatSnackBarConfig = { duration: 3000 };
  const config: MatSnackBarConfig = { ...defaultConfig, ...(opts || {}) };
  const action = opts?.action ?? SNACKBAR_DEFAULT_ACTION;
  return snackBar.open(message, action, config);
}
