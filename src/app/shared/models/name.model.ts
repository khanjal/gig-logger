import { IAddress } from "@interfaces/address.interface";
import { IName } from "@interfaces/name.interface";
import { INote } from "@interfaces/note.interface";

export class NameModel implements IName {
    id: number = 0;
    name: string = "";
    addresses: IAddress[] = [];
    notes: INote[] = [];
    visits: number = 0;
}