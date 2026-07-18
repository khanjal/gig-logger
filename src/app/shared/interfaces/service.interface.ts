import type { IAmount } from "@interfaces/amount.interface";
import type { IRowState } from "@interfaces/row-state.interface";

export interface IService extends IAmount, IRowState {
    id?: number;
    service: string;
    trips: number;
}