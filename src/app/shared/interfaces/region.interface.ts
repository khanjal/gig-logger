import { IAmount } from "@interfaces/amount.interface";
import { IRowState } from "@interfaces/row-state.interface";

export interface IRegion extends IAmount, IRowState {
    id?: number;
    region: string;
    trips: number;
}