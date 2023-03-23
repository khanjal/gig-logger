import { Injectable } from "@angular/core";
import { GoogleSpreadsheetWorksheet } from "google-spreadsheet";
import { AddressModel } from "src/app/shared/models/address.model";
import { GoogleDriveService } from "./googleSheet.service";

const sheetName = "Addresses";

@Injectable()
export class AddressService {

    constructor(private _googleSheetService: GoogleDriveService) { }
    
    public async getAddresses(): Promise<AddressModel[]> {
        let addresses: AddressModel[] = [];
        let addressData = localStorage.getItem('addresses') ?? '""';
        addresses = JSON.parse(addressData);
    
        if (!addresses) {
            await this.loadAddresses();
            addressData = localStorage.getItem('addresses') ?? "''";
            addresses = JSON.parse(addressData);
        }
    
        // console.log(addresses);

        return addresses;
    }

    public async getSheetData(sheet: GoogleSpreadsheetWorksheet): Promise<AddressModel[]> {
        console.log(sheet.title);
        console.log(sheet.rowCount);

        let rows = await sheet.getRows();
        let addresses: AddressModel[] = [];

        rows.forEach(row => {
            // console.log(row);
            // console.log(row.rowIndex);
            let address: string[] = row['Address'].split(", ");
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

    public async loadAddresses() {
        // Read Address sheet
        let sheet = await this._googleSheetService.getSheetDataByName(sheetName);

        let addresses = this.getSheetData(sheet);

        // Load addresses into storage
        localStorage.setItem('addresses', JSON.stringify(addresses));
    }
}