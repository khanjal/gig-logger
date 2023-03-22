import { GoogleSpreadsheetRow } from "google-spreadsheet";
import { AddressModel } from "../models/address.model";
import { SiteModel } from "../models/site.model";
import { LocalStorageHelper } from "./localStorage.helper";

export class AddressHelper {
    static getShortAddress(address: string): string {
        if (address) {
            let addressArray = address.split(", ");
            return `${ addressArray[0] }, ${ addressArray[1] }`; 
        }
        
        return "";
    }

    static getRemoteAddresses(): AddressModel[] {
        let siteData: SiteModel = LocalStorageHelper.getSiteData();
        let addresses: AddressModel[] = [];

        if (siteData) {
            addresses = siteData.remote.addresses;
        }

        return addresses;
    }

    static translateSheetData(rows: GoogleSpreadsheetRow[]): AddressModel[] {
        let addresses: AddressModel[] = [];

        rows.forEach(row => {
            // console.log(row);
            // console.log(row.rowIndex);
            let addressModel: AddressModel = new AddressModel;
            addressModel.id = row.rowIndex;
            addressModel.address = row['Address'];
            addressModel.names =  row['Names']?.split("; ");
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