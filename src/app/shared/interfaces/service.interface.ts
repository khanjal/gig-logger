import { IAmount } from "./amount.interface";
import { IRowState } from "./row-state.interface";

export interface IService extends IAmount, IRowState {
    id?: number;
    service: string;
    trips: number;
}