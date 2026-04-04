import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';
import { SNACKBAR_DEFAULT_ACTION, SNACKBAR_DEFAULT_DURATION_MS } from '@constants/snackbar.constants';
import type { ISnackbarOptions } from '@interfaces/snackbar-options.interface';

export function openSnackbar(snackBar: MatSnackBar, message: string, opts?: ISnackbarOptions) {
  const defaultConfig: MatSnackBarConfig = { duration: SNACKBAR_DEFAULT_DURATION_MS };
  const config: MatSnackBarConfig = { ...defaultConfig, ...(opts || {}) };
  const action = opts?.action ?? SNACKBAR_DEFAULT_ACTION;
  return snackBar.open(message, action, config);
}
