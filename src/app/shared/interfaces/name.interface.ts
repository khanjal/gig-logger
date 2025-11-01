import { IAmount } from "./amount.interface";
import { INote } from "./note.interface";
import { IRowState } from "./row-state.interface";

export interface IName extends IAmount, IRowState {
    id?: number;
    name: string;
    addresses: string[];
    notes: INote[];
    trips: number;
}