import { IAmount } from "./amount.interface";

export interface IService extends IAmount {
    id?: number;
    rowId: number;
    service: string;
    visits: number;
}