import type { IRowState } from '@interfaces/row-state.interface';

export interface IActionRecord extends IRowState {
  action: string;
  actionTime: number;
}
