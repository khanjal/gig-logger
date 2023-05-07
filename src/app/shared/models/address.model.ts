import { IAddress } from "@interfaces/address.interface";
import { IName } from "@interfaces/name.interface";
import { INote } from "@interfaces/note.interface";

export class AddressModel implements IAddress {
    id: number = 0;
    address: string = "";
    bonus: number = 0;
    cash: number = 0;
    names: IName[] = [];
    notes: INote[] = [];
    pay: number = 0;
    tip: number = 0;
    total: number = 0;
    visits: number = 0;
}