import { IAmount } from "./amount.interface";
import { IRowState } from "./row-state.interface";

export interface IRegion extends IAmount, IRowState {
    id?: number;
    region: string;
    trips: number;
}