import { IAddress } from "./address.interface";
import { IAmount } from "./amount.interface";
import { IType } from "./type.interface";

export interface IPlace extends IAmount {
    id?: number;
    rowId: number;
    place: string;
    saved: boolean;
    addresses: IAddress[];
    types: IType[];
    visits: number;
}