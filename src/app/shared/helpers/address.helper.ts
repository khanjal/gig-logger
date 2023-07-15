import { NumberHelper } from "./number.helper";
import { IAddress } from "@interfaces/address.interface";

export class AddressHelper {
    static getShortAddress(address: string, place: string = "", length: number = 2): string {
        if (!address) {
            return "";
        }

        let addressArray = address.split(", ");

        if (addressArray.length === 1) {
            return this.abbrvAddress(address);
        }

        if (place && 
            (addressArray[0].toLocaleLowerCase().startsWith(place.toLocaleLowerCase()) || 
            (place.toLocaleLowerCase().startsWith(addressArray[0].toLocaleLowerCase())))) {
            return this.abbrvAddress(addressArray.slice(1, length+1).join(", "));
        }

        return this.abbrvAddress(addressArray.slice(0, length+1).join(", "));
    }

    static abbrvAddress(address: string): string {
        let addressParts = address.split(" ");
        let abbreviatedAddress: string = "";

        addressParts.forEach(addressPart => {
            let hasComma = addressPart.includes(',') ? true : false;

            // If part has a comma remove/readd       
            addressPart = addressPart.replace(',', '');
            switch (addressPart.toLowerCase()) {
                // Directions
                case "north":
                    abbreviatedAddress = `${abbreviatedAddress} N`;
                    break;
                case "east":
                    abbreviatedAddress = `${abbreviatedAddress} E`;
                    break;
                case "south":
                    abbreviatedAddress = `${abbreviatedAddress} S`;
                    break;
                case "west":
                    abbreviatedAddress = `${abbreviatedAddress} W`;
                    break;
                // Streets/Roads
                case "avenue":
                    abbreviatedAddress = `${abbreviatedAddress} Ave`;
                    break;
                case "boulevard":
                    abbreviatedAddress = `${abbreviatedAddress} Blvd`;
                    break;
                case "circle":
                    abbreviatedAddress = `${abbreviatedAddress} Cir`;
                    break;
                case "drive":
                    abbreviatedAddress = `${abbreviatedAddress} Dr`;
                    break;
                case "lane":
                    abbreviatedAddress = `${abbreviatedAddress} Ln`;
                    break;
                case "place":
                    abbreviatedAddress = `${abbreviatedAddress} Pl`;
                    break;
                case "road":
                    abbreviatedAddress = `${abbreviatedAddress} Rd`;
                    break;
                case "street":
                    abbreviatedAddress = `${abbreviatedAddress} St`;
                    break;
                case "terrace":
                    abbreviatedAddress = `${abbreviatedAddress} Ter`;
                    break;
                // Apartemnt/Suite/Unit
                default:
                    abbreviatedAddress = `${abbreviatedAddress} ${addressPart}`;
                    break;
            }

            if (hasComma) {
                abbreviatedAddress = `${abbreviatedAddress},`;
            }
        });

        return abbreviatedAddress;
    }

    static abbrvDirection(addressPart: string): string {
        switch (addressPart.toLowerCase()) {
            case "north":
                return 'N';
            case "east":
                return 'E';
            case "south":
                return 'S';
            case "west":
                return 'W';
            default:
                return addressPart;
        }
    }

    static sortAddressAsc(addresses: IAddress[]): IAddress[] {
        addresses.sort((a,b) => a.address.localeCompare(b.address));

        return addresses;
    }
}