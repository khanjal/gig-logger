import { IAmount } from "./amount.interface";
import { IName } from "./name.interface";
import { INote } from "./note.interface";

export interface IAddress extends IAmount {
    id: number;
    address: string;
    names: IName[];
    notes: INote[];
    visits: number;
}