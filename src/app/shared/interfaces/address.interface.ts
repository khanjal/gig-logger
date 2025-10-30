import { IAmount } from "./amount.interface";
import { INote } from "./note.interface";
import { IRowState } from "./row-state.interface";

export interface IAddress extends IAmount, IRowState {
    id?: number;
    address: string;
    names: string[];
    notes: INote[];
    trips: number;
    firstTrip: string;
    lastTrip: string;
}