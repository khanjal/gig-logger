import { IName } from "./name.interface";
import { INote } from "./note.interface";

export interface IAddress {
    id: number;
    address: string;
    names: IName[];
    notes: INote[];
    visits: number;
}