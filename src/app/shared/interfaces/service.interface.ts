import { IAmount } from "./amount.interface";

export interface IService extends IAmount {
    id?: number;
    rowId: number;
    saved: boolean;
    service: string;
    trips: number;
}