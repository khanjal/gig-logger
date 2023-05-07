import { GoogleSpreadsheetRow } from "google-spreadsheet";
import { NameModel } from "../models/name.model";
import { NumberHelper } from "./number.helper";

export class NameHelper {

    static translateSheetData(rows: GoogleSpreadsheetRow[]): NameModel[] {
        let names: NameModel[] = [];

        rows.forEach(row => {
            // console.log(row);
            // console.log(row.rowIndex);
            let nameModel: NameModel = new NameModel;
            nameModel.id = row.rowIndex;
            nameModel.name = row['Name'];
            nameModel.addresses =  [];
            nameModel.visits = row['Visits'];

            // Amount data
            nameModel.pay = NumberHelper.getNumberFromString(row['Pay']);
            nameModel.tip = NumberHelper.getNumberFromString(row['Tip']);
            nameModel.bonus = NumberHelper.getNumberFromString(row['Bonus']);
            nameModel.total = NumberHelper.getNumberFromString(row['Total']);
            nameModel.cash = NumberHelper.getNumberFromString(row['Cash']);

            // console.log(nameModel);

            if (nameModel.name) {
                names.push(nameModel);
            }
            
        });
        // console.log(names);
        console.log(names.length);
        // console.log(names);

        return names;
    }
}