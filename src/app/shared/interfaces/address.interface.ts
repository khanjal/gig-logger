import type { IAmount } from "./amount.interface";
import type { INote } from "./note.interface";
import type { IRowState } from "./row-state.interface";

export interface IAddress extends IAmount, IRowState {
    id?: number;
    address: string;
    names: string[];
    notes: INote[];
    trips: number;
    firstTrip: string;
    lastTrip: string;
}