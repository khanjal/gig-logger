import type { IAmount } from "@interfaces/sheets/amount.interface";
import type { IRowState } from "@interfaces/sheets/row-state.interface";

export interface IAddress extends IAmount, IRowState {
    id?: number;
    address: string;
    trips: number;
    firstTrip: string;
    lastTrip: string;
}
