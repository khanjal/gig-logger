import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { GoogleSpreadsheet, GoogleSpreadsheetWorksheet } from 'google-spreadsheet';

import keys from '../data/jwt.keys.json';


const doc = new GoogleSpreadsheet('1higrtVaDRpO3-uX92Fn3fJ5RtZ5dpqRI0CQf9eaDlg4');

// https://medium.com/@bluesmike/how-i-implemented-angular8-googlesheets-crud-8883ac3cb6d8
// https://www.npmjs.com/package/google-spreadsheet
// https://theoephraim.github.io/node-google-spreadsheet/#/

@Injectable()
export class GoogleDriveService {
    data: any = null;

    constructor(public http: HttpClient) { }

    private async getSheetData(sheetId: number): Promise<GoogleSpreadsheetWorksheet> {
        await doc.useServiceAccountAuth(keys);
        await doc.loadInfo();

        const sheet = doc.sheetsById[sheetId];

        return sheet;
    }

    public async loadAddresses() {
        // Read Address sheet
        let sheet = await this.getSheetData(670153803);

        console.log(sheet.title);
        console.log(sheet.rowCount);

        let rows = await sheet.getRows();
        let addresses: string[] = [];

        rows.forEach(row => {
            // console.log(row);
            // console.log(row.rowIndex);
            let address = row['Address'];
            // console.log(address);

            if (address) {
                addresses.push(address);
            }
            
        });
        // console.log(addresses);
        console.log(addresses.length);
        // console.log(addresses);

        // Load addresses into storage
        localStorage.setItem('addresses', JSON.stringify(addresses));
    }

    public async loadShifts() {
        // Read Shifts sheet
        let sheet = await this.getSheetData(279895837);

        console.log(sheet.title);
        console.log(sheet.rowCount);

        let rows = await sheet.getRows();
        let shifts: string[] = [];

        rows.forEach(row => {
            // console.log(row);
            // console.log(row.rowIndex);
            let key = row['Key'];
            let date = row['Date'];
            // console.log(shift);

            //console.log(new Date());
            var today  = new Date();
            var datestring = `${today.getMonth() + 1}/${today.getDate()}/${today.getFullYear().toString().substr(-2)}`;
            console.log(datestring);

            if (key && date == datestring) {
                shifts.push(key);
            }
            
        });
        // console.log(shifts);
        console.log(shifts.length);
        // console.log(shifts);

        // Load shifts into storage
        localStorage.setItem('shifts', JSON.stringify(shifts));
    }
}