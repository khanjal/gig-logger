import { GoogleSpreadsheetRow } from "google-spreadsheet";
import { NumberHelper } from "./number.helper";
import { IService } from "@interfaces/service.interface";

export class ServiceHelper {

    static translateSheetData(rows: GoogleSpreadsheetRow[]): IService[] {
        let services: IService[] = [];

        rows.forEach(row => {
            // console.log(row);
            // console.log(row.rowIndex);
            let service: IService = {} as IService;
            service.service = row['Service'];
            service.id = row.rowIndex;
            service.visits = NumberHelper.getNumberFromString(row['Trips']);

            service.bonus = NumberHelper.getNumberFromString(row['Bonus']);
            service.cash = NumberHelper.getNumberFromString(row['Cash']);
            service.pay = NumberHelper.getNumberFromString(row['Pay']);
            service.tip = NumberHelper.getNumberFromString(row['Tip']);
            service.total = NumberHelper.getNumberFromString(row['Total']);
            // console.log(placeModel);

            if (service.service) {
                services.push(service);
            }
            
        });
        // console.log(services);
        console.log(services.length);
        // console.log(services);

        return services;
    }
}