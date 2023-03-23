import { GoogleSpreadsheetRow } from "google-spreadsheet";
import { NameModel } from "../models/name.model";
import { SiteModel } from "../models/site.model";
import { LocalStorageHelper } from "./localStorage.helper";

export class NameHelper {
    static getRemoteNames(): NameModel[] {
        let siteData: SiteModel = LocalStorageHelper.getSiteData();
        let names: NameModel[] = [];

        if (siteData) {
            names = siteData.remote.names;
        }

        return names;
    }

    static translateSheetData(rows: GoogleSpreadsheetRow[]): NameModel[] {
        let names: NameModel[] = [];

        rows.forEach(row => {
            // console.log(row);
            // console.log(row.rowIndex);
            let nameModel: NameModel = new NameModel;
            nameModel.id = row.rowIndex;
            nameModel.name = row['Name'];
            nameModel.addresses =  row['Addresses']?.split("; ");
            nameModel.visits = row['Visits'];
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