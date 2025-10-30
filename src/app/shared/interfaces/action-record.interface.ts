import { IRowState } from './row-state.interface';

export interface IActionRecord extends IRowState {
  action: string;
  actionTime: number;
}
