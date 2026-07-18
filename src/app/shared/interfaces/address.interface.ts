import type { IAmount } from "@interfaces/amount.interface";
import type { INote } from "@interfaces/note.interface";
import type { IRowState } from "@interfaces/row-state.interface";

export interface IAddress extends IAmount, IRowState {
    id?: number;
    address: string;
    names: string[];
    notes: INote[];
    trips: number;
    firstTrip: string;
    lastTrip: string;
}