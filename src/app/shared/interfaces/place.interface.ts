import { IAmount } from "./amount.interface";
import { IType } from "./type.interface";

export interface IPlace extends IAmount {
    id?: number;
    place: string;
    addresses: string[];
    types: IType[];
    visits: number;
}