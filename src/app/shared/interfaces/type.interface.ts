import { IAmount } from "./amount.interface";
import { IRowState } from "./row-state.interface";

export interface IType extends IAmount, IRowState {
    id?: number;
    type: string;
    trips: number;
}