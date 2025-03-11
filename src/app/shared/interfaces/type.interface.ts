import { IAmount } from "./amount.interface";

export interface IType extends IAmount {
    id?: number;
    rowId: number;
    saved: boolean;
    type: string;
    visits: number;
}