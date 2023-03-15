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

    public async getSheetDataById(id: number): Promise<GoogleSpreadsheetWorksheet> {
        await doc.useServiceAccountAuth(keys);
        await doc.loadInfo();

        const sheet = doc.sheetsById[id];

        return sheet;
    }

    public async getSheetDataByName(name: string): Promise<GoogleSpreadsheetWorksheet> {
        await doc.useServiceAccountAuth(keys);
        await doc.loadInfo();

        const sheet = doc.sheetsByTitle[name];

        return sheet;
    }
}