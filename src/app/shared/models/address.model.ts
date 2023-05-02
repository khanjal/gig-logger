import { IAddress } from "@interfaces/address.interface";
import { IName } from "@interfaces/name.interface";

export class AddressModel implements IAddress {
    id: number = 0;
    address: string = "";
    names: IName[] = [];
    notes: string[] = [];
    visits: number = 0;
}