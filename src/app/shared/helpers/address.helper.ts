import { GoogleSpreadsheetRow } from "google-spreadsheet";
import { NumberHelper } from "./number.helper";
import { IAddress } from "@interfaces/address.interface";

export class AddressHelper {
    static getShortAddress(address: string): string {
        if (address) {
            let addressArray = address.split(", ");
            let addressString = addressArray[0];

            if (addressArray[1]) {
                addressString = `${ addressString }, ${ addressArray[1] }`;
            }
            return addressString;
        }
        
        return "";
    }

    static getPlaceAddress(place: string, address: string): string {
        if (!place || !address) {
            return address;
        }

        let addressArray = address.split(", ");

        if (addressArray.length === 1) {
            return address;
        }

        if (addressArray[0].toLocaleLowerCase() === place.toLocaleLowerCase())
        {
            return addressArray.slice(1, addressArray.length).join(", ");
        }

        return address;
    }

    static translateSheetData(rows: GoogleSpreadsheetRow[]): IAddress[] {
        let addresses: IAddress[] = [];

        rows.forEach(row => {
            // console.log(row);
            // console.log(row.rowIndex);
            let address: IAddress = {} as IAddress;
            address.id = row.rowIndex;
            address.address = row['Address'];
            address.names =  [];
            address.notes = [];
            address.visits = row['Visits'];

            // Amount data
            address.pay = NumberHelper.getNumberFromString(row['Pay']);
            address.tip = NumberHelper.getNumberFromString(row['Tip']);
            address.bonus = NumberHelper.getNumberFromString(row['Bonus']);
            address.total = NumberHelper.getNumberFromString(row['Total']);
            address.cash = NumberHelper.getNumberFromString(row['Cash']);

            // console.log(addressModel);

            if (address.address) {
                addresses.push(address);
            }
            
        });
        // console.log(addresses);
        console.log(addresses.length);
        // console.log(addresses);

        return addresses;
    }
}