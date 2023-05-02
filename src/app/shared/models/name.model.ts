import { IAddress } from "@interfaces/address.interface";
import { IName } from "@interfaces/name.interface";

export class NameModel implements IName {
    id: number = 0;
    name: string = "";
    addresses: IAddress[] = [];
    notes: string[] = [];
    visits: number = 0;
}