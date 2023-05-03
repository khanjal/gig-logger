import { IAddress } from "@interfaces/address.interface";
import { IName } from "@interfaces/name.interface";
import { INote } from "@interfaces/note.interface";

export class AddressModel implements IAddress {
    id: number = 0;
    address: string = "";
    names: IName[] = [];
    notes: INote[] = [];
    stringNotes: string[] = [];
    visits: number = 0;
}