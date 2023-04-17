import { IWeekday } from "@interfaces/weekday.interface";
import { NumberHelper } from "./number.helper";
import { GoogleSpreadsheetRow } from "google-spreadsheet";

export class WeekdayHelper {
    static translateSheetData(rows: GoogleSpreadsheetRow[]): IWeekday[] {
        let weekdays: IWeekday[] = [];

        rows.forEach(row => {
            // console.log(row);
            // console.log(row.rowIndex);
            let weekday: IWeekday = {
                id: row.rowIndex,
                day: row['Day'],
                trips: NumberHelper.getNumberFromString(row['Trips']),
                pay: NumberHelper.getNumberFromString(row['Pay']),
                tips: NumberHelper.getNumberFromString(row['Tips']),
                bonus: NumberHelper.getNumberFromString(row['Bonus']),
                cash: NumberHelper.getNumberFromString(row['Dash']),
                total: NumberHelper.getNumberFromString(row['Total']),
                days: NumberHelper.getNumberFromString(row['# Days']),
                currentAverage: NumberHelper.getNumberFromString(row['Curr Avg']),
                previousAverage: NumberHelper.getNumberFromString(row['Prev Avg'])
            };
            weekdays.push(weekday);
        });

        return weekdays;
    }
}