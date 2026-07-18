import type { IRowState } from '@interfaces/sheets/row-state.interface';

export interface IActionRecord extends IRowState {
  action: string;
  actionTime: number;
}
