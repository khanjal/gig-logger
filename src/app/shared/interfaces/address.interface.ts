import { IAmount } from "./amount.interface";
import { INote } from "./note.interface";

export interface IAddress extends IAmount {
    id?: number;
    address: string;
    names: string[];
    notes: INote[];
    visits: number;
}