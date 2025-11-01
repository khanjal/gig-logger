import { IAddress } from "./address.interface";
import { IAmount } from "./amount.interface";
import { IType } from "./type.interface";
import { IRowState } from "./row-state.interface";

export interface IPlace extends IAmount, IRowState {
    id?: number;
    place: string;
    addresses: IAddress[];
    types: IType[];
    trips: number;
}