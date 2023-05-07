import { IAddress } from "./address.interface";
import { IAmount } from "./amount.interface";
import { INote } from "./note.interface";

export interface IName extends IAmount {
    id: number;
    name: string;
    addresses: IAddress[];
    notes: INote[];
    visits: number;
}