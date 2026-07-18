import { IAmount } from "@interfaces/amount.interface";
import { INote } from "@interfaces/note.interface";
import { IRowState } from "@interfaces/row-state.interface";

export interface IName extends IAmount, IRowState {
    id?: number;
    name: string;
    addresses: string[];
    notes: INote[];
    trips: number;
}