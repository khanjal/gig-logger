import type { IAmount } from "@interfaces/sheets/amount.interface";
import type { IRowState } from "@interfaces/sheets/row-state.interface";

export interface IService extends IAmount, IRowState {
    id?: number;
    service: string;
    trips: number;
}