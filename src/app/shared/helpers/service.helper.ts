import { GoogleSpreadsheetRow } from "google-spreadsheet";
import { ServiceModel } from "../models/service.model";

export class ServiceHelper {

    static translateSheetData(rows: GoogleSpreadsheetRow[]): ServiceModel[] {
        let services: ServiceModel[] = [];

        rows.forEach(row => {
            // console.log(row);
            // console.log(row.rowIndex);
            let serviceModel: ServiceModel = new ServiceModel;
            serviceModel.id = row.rowIndex;
            serviceModel.service = row['Service'];
            serviceModel.visits = row['Trips'];
            // console.log(placeModel);

            if (serviceModel.service) {
                services.push(serviceModel);
            }
            
        });
        // console.log(services);
        console.log(services.length);
        // console.log(services);

        return services;
    }
}