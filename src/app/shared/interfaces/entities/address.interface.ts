import type { IAmount } from "@interfaces/sheets/amount.interface";
import type { INote } from "@interfaces/entities/note.interface";
import type { IRowState } from "@interfaces/sheets/row-state.interface";

export interface IAddress extends IAmount, IRowState {
    id?: number;
    address: string;
    names: string[];
    notes: INote[];
    trips: number;
    firstTrip: string;
    lastTrip: string;
}