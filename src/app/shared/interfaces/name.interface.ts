import { IAddress } from "./address.interface";
import { INote } from "./note.interface";

export interface IName {
    id: number;
    name: string;
    addresses: IAddress[];
    notes: INote[];
    visits: number;
}