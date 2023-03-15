import { Injectable } from "@angular/core";
import { NameModel } from "src/app/models/name.model";
import { GoogleDriveService } from "./googleSheet.service";

const sheetName = "Names";

@Injectable()
export class NameService {

    constructor(private _googleSheetService: GoogleDriveService) { }
    
    public async getNames(): Promise<NameModel[]> {
        let names: NameModel[] = [];
        let nameData = localStorage.getItem('names') ?? '""';
        names = JSON.parse(nameData);
    
        if (!names) {
            await this.loadNames();
            nameData = localStorage.getItem('names') ?? "''";
            names = JSON.parse(nameData);
        }
    
        // console.log(names);

        return names;
    }

    public async loadNames() {
        let sheet = await this._googleSheetService.getSheetDataByName(sheetName);

        console.log(sheet.title);
        console.log(sheet.rowCount);

        let rows = await sheet.getRows();
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

        // Load addresses into storage
        localStorage.setItem('names', JSON.stringify(names));
    }
}