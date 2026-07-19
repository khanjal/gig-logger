import type { IAmount } from "@interfaces/sheets/amount.interface";
import type { INote } from "@interfaces/entities/note.interface";
import type { IRowState } from "@interfaces/sheets/row-state.interface";

export interface IName extends IAmount, IRowState {
    id?: number;
    name: string;
    addresses: string[];
    notes: INote[];
    trips: number;
}