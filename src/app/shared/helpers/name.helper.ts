import { GoogleSpreadsheetRow } from "google-spreadsheet";
import { NameModel } from "../models/name.model";
import { NumberHelper } from "./number.helper";
import { IName } from "@interfaces/name.interface";

export class NameHelper {

    static translateSheetData(rows: GoogleSpreadsheetRow[]): IName[] {
        let names: IName[] = [];

        rows.forEach(row => {
            // console.log(row);
            // console.log(row.rowIndex);
            let nameData: IName = {} as IName;
            nameData.id = row.rowIndex;
            nameData.name = row['Name'];
            nameData.addresses =  [];
            nameData.notes = [];
            nameData.visits = row['Visits'];

            // Amount data
            nameData.pay = NumberHelper.getNumberFromString(row['Pay']);
            nameData.tip = NumberHelper.getNumberFromString(row['Tip']);
            nameData.bonus = NumberHelper.getNumberFromString(row['Bonus']);
            nameData.total = NumberHelper.getNumberFromString(row['Total']);
            nameData.cash = NumberHelper.getNumberFromString(row['Cash']);

            // console.log(nameModel);

            if (nameData.name) {
                names.push(nameData);
            }
            
        });
        // console.log(names);
        console.log(names.length);
        // console.log(names);

        return names;
    }
}