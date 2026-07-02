import type { IAmount } from "./amount.interface";
import type { IRowState } from "./row-state.interface";

export interface IService extends IAmount, IRowState {
    id?: number;
    service: string;
    trips: number;
}