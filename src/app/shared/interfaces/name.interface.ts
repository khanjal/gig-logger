import { IAmount } from "./amount.interface";
import { INote } from "./note.interface";

export interface IName extends IAmount {
    id?: number;
    rowId: number;
    name: string;
    saved: boolean;
    addresses: string[];
    notes: INote[];
    trips: number;
}