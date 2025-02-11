import { IAmount } from "./amount.interface";

export interface IType extends IAmount {
    id?: number;
    rowId: number;
    type: string;
    visits: number;
}