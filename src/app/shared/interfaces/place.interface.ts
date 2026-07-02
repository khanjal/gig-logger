import type { IAddress } from "./address.interface";
import type { IAmount } from "./amount.interface";
import type { IType } from "./type.interface";
import type { IRowState } from "./row-state.interface";

export interface IPlace extends IAmount, IRowState {
    id?: number;
    place: string;
    addresses: IAddress[];
    types: IType[];
    trips: number;
}