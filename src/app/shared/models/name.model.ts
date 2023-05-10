import { IAddress } from "@interfaces/address.interface";
import { IName } from "@interfaces/name.interface";
import { INote } from "@interfaces/note.interface";

export class NameModel implements IName {
    id: number = 0;
    bonus: number = 0;
    cash: number = 0;
    name: string = "";
    addresses: string[] = [];
    pay: number = 0;
    notes: INote[] = [];
    tip: number = 0;
    total: number = 0;
    visits: number = 0;
}