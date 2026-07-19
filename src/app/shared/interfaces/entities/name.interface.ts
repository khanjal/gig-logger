import type { IAmount } from "@interfaces/sheets/amount.interface";
import type { IRowState } from "@interfaces/sheets/row-state.interface";

export interface IName extends IAmount, IRowState {
    id?: number;
    name: string;
    trips: number;
}
