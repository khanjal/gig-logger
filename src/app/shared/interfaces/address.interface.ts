import { IAmount } from "./amount.interface";
import { INote } from "./note.interface";

export interface IAddress extends IAmount {
    id?: number;
    rowId: number;
    address: string;
    saved: boolean;
    names: string[];
    notes: INote[];
    trips: number;
    firstTrip: string;
    lastTrip: string;
}