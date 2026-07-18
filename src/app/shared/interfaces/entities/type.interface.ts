import { IAmount } from "@interfaces/sheets/amount.interface";
import { IRowState } from "@interfaces/sheets/row-state.interface";

export interface IType extends IAmount, IRowState {
    id?: number;
    type: string;
    trips: number;
}