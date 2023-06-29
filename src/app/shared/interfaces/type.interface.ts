import { IAmount } from "./amount.interface";

export interface IType extends IAmount {
    id?: number;
    type: string;
    visits: number;
}