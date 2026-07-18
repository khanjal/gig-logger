import { IAmount } from "@interfaces/amount.interface";
import { IRowState } from "@interfaces/row-state.interface";

export interface IType extends IAmount, IRowState {
    id?: number;
    type: string;
    trips: number;
}