import { IAmount } from "./amount.interface";

export interface IRegion extends IAmount {
    id?: number;
    rowId: number;
    saved: boolean;
    region: string;
    trips: number;
}