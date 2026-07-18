import type { IAddress } from "@interfaces/address.interface";
import type { IAmount } from "@interfaces/amount.interface";
import type { IType } from "@interfaces/type.interface";
import type { IRowState } from "@interfaces/row-state.interface";

export interface IPlace extends IAmount, IRowState {
    id?: number;
    place: string;
    addresses: IAddress[];
    types: IType[];
    trips: number;
}