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

    // public async getGoogleData() {
    //     const client = new JWT({
    //         email: keys.client_email,
    //         key: keys.private_key,
    //         scopes: ['https://www.googleapis.com/auth/cloud-platform'],
    //     });
    //     const url = `https://dns.googleapis.com/dns/v1/projects/${keys.project_id}`;
    //     const res = await client.request({url});
    //     console.log(res.data);
    // }

    private async getSheetData(sheetId: number): Promise<GoogleSpreadsheetWorksheet> {
        await doc.useServiceAccountAuth(keys);
        await doc.loadInfo();

        const sheet = doc.sheetsById[670153803];

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
        console.log(addresses);

        // Load addresses into storage
    }

    public async getGoogleData() {
        const doc = new GoogleSpreadsheet('1higrtVaDRpO3-uX92Fn3fJ5RtZ5dpqRI0CQf9eaDlg4');
        // Initialize Auth - see https://theoephraim.github.io/node-google-spreadsheet/#/getting-started/authentication
        
        await doc.useServiceAccountAuth(keys);

        await doc.loadInfo(); // loads document properties and worksheets
        console.log(doc.title);

        const tripsSheet = doc.sheetsById[199523902]; // or use doc.sheetsById[id] or doc.sheetsByTitle[title]
        console.log(tripsSheet.title);
        console.log(tripsSheet.rowCount);

        let tripsRows = await tripsSheet.getRows()
        console.log(tripsRows);

        const shiftsSheet = doc.sheetsById[279895837]; // or use doc.sheetsById[id] or doc.sheetsByTitle[title]
        console.log(shiftsSheet.title);
        console.log(shiftsSheet.rowCount);

        let shiftsRows = await shiftsSheet.getRows()
        console.log(shiftsRows);
    }

    // public getGoogleData() {
    //     //const sheetId = '2PACX-1vT4hWkgwve_E3c_LYCrPhIsVRNnlVnaZiKvn_zZTtfgZodikyJ_GVvchAtu17akW9zj3BFfJ4E9TOEx';
    //     const sheetId = '15Kndr-OcyCUAkBUcq6X3BMqKa_y2fMAXfPFLiSACiys';
    //     const url = `https://spreadsheets.google.com/feeds/list/${sheetId}/od6/public/values?alt=json`;

    //     this.http.get<any>(url).subscribe({
    //     next: data => {
    //         console.log(data);
    //     },
    //     error: error => {
    //         let errorMessage = error.message;
    //         console.error('There was an error!', error);
    //     }
    // })
    // }

    // public getSheetData(): Observable<any> {
    //     const sheetId = '2PACX-1vT4hWkgwve_E3c_LYCrPhIsVRNnlVnaZiKvn_zZTtfgZodikyJ_GVvchAtu17akW9zj3BFfJ4E9TOEx';
    //     const url = `https://spreadsheets.google.com/feeds/list/${sheetId}/od6/public/values?alt=json`;

    //     return this.http.get(url)
    //     .pipe(
    //         map((res: any) => {
    //             const data = res.feed.entry;

    //             const returnArray: Array<any> = [];
    //             if (data && data.length > 0) {
    //                 data.forEach((entry: any) => {
    //                     console.log(entry);
    //                     const obj = {};
    //                     for (const x in entry) {
    //                         if (x.includes('gsx$') && entry[x].$t) {
    //                             //obj[x.split('$')[1]] = entry[x]['$t'];
    //                         }
    //                     }
                    
    //                     returnArray.push(obj);
    //             });
    //         }
    //         return returnArray;
    //         })
    //     );
    // }
}