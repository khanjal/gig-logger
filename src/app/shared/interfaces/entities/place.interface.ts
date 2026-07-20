import type { IAmount } from "@interfaces/sheets/amount.interface";
import type { IRowState } from "@interfaces/sheets/row-state.interface";

export interface IPlace extends IAmount, IRowState {
    id?: number;
    place: string;
    trips: number;
}
