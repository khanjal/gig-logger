import { IAmount } from "./amount.interface";
import { INote } from "./note.interface";

export interface IName extends IAmount {
    id?: number;
    rowId: number;
    name: string;
    addresses: string[];
    notes: INote[];
    visits: number;
}