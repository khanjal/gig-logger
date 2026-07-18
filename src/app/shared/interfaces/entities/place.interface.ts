import type { IAddress } from "@interfaces/entities/address.interface";
import type { IAmount } from "@interfaces/sheets/amount.interface";
import type { IType } from "@interfaces/entities/type.interface";
import type { IRowState } from "@interfaces/sheets/row-state.interface";

export interface IPlace extends IAmount, IRowState {
    id?: number;
    place: string;
    addresses: IAddress[];
    types: IType[];
    trips: number;
}