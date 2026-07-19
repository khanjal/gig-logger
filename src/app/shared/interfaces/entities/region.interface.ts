import type { IAmount } from "@interfaces/sheets/amount.interface";
import type { IRowState } from "@interfaces/sheets/row-state.interface";

export interface IRegion extends IAmount, IRowState {
    id?: number;
    region: string;
    trips: number;
}