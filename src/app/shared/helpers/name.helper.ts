import { GoogleSpreadsheetRow } from "google-spreadsheet";
import { NumberHelper } from "./number.helper";
import { IName } from "@interfaces/name.interface";

export class NameHelper {

    static translateSheetData(rows: GoogleSpreadsheetRow[]): IName[] {
        let names: IName[] = [];

        rows.forEach(row => {
            // console.log(row);
            // console.log(row.rowIndex);
            let name: IName = {} as IName;
            name.id = row.rowIndex;
            name.name = row['Name'];
            name.addresses =  [];
            name.notes = [];
            name.visits = NumberHelper.getNumberFromString(row['Visits']);

            // Amount data
            name.pay = NumberHelper.getNumberFromString(row['Pay']);
            name.tip = NumberHelper.getNumberFromString(row['Tip']);
            name.bonus = NumberHelper.getNumberFromString(row['Bonus']);
            name.total = NumberHelper.getNumberFromString(row['Total']);
            name.cash = NumberHelper.getNumberFromString(row['Cash']);

            // console.log(nameModel);

            if (name.name) {
                names.push(name);
            }
            
        });
        // console.log(names);
        console.log(names.length);
        // console.table(names);

        return names;
    }
}