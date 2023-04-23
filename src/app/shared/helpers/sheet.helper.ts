import { GoogleSpreadsheet, GoogleSpreadsheetWorksheet } from "google-spreadsheet";

export class SheetHelper {
    
    static getSpreadsheetSheets(spreadsheet: GoogleSpreadsheet): GoogleSpreadsheetWorksheet[] {
        let sheets: GoogleSpreadsheetWorksheet[] = [];

        // get all keys of the object
        const keys = Object.keys(spreadsheet);

        // getting value of the keys in array
        for (let i = 0; i < keys.length; i++) {
            if (keys[i] === "_rawSheets") {
                Object.keys(Object.values(spreadsheet)[i]).forEach(key => {
                    sheets.push(Object.values(spreadsheet)[i][key]);
                })
            }
        }

        return sheets;
    }

    static getSheetNames(spreadsheet: GoogleSpreadsheet): string[] {
        let names: string[] = [];

        let sheets = this.getSpreadsheetSheets(spreadsheet);

        names = sheets.map(x => x.a1SheetName);
        console.log(names);

        return names;
    }
}