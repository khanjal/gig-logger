import { GoogleSpreadsheetRow } from "google-spreadsheet";
import { AddressModel } from "@models/address.model";

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
            return addressArray[0];
        }

        if (addressArray[0].toLocaleLowerCase() === place.toLocaleLowerCase())
        {
            return addressArray[1];
        }

        return `${addressArray[0]}, ${addressArray[1]}`;
    }

    static translateSheetData(rows: GoogleSpreadsheetRow[]): AddressModel[] {
        let addresses: AddressModel[] = [];

        rows.forEach(row => {
            // console.log(row);
            // console.log(row.rowIndex);
            let addressModel: AddressModel = new AddressModel;
            addressModel.id = row.rowIndex;
            addressModel.address = row['Address'];
            addressModel.names =  [];
            addressModel.visits = row['Visits'];
            // console.log(addressModel);

            if (addressModel.address) {
                addresses.push(addressModel);
            }
            
        });
        // console.log(addresses);
        console.log(addresses.length);
        // console.log(addresses);

        return addresses;
    }
}