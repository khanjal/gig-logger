import { Injectable } from "@angular/core";
import { ShiftModel } from "src/app/models/shift.model";
import { GoogleDriveService } from "./googleSheet.service";

const sheetId = 279895837;

@Injectable()
export class ShiftService {

    constructor(private _googleSheetService: GoogleDriveService) { }
        
    public async getShifts(): Promise<ShiftModel[]> {
        let shifts: ShiftModel[] = [];
        let shiftData = localStorage.getItem('shifts') ?? '""';
        shifts = JSON.parse(shiftData);

        if (!shifts) {
            await this.loadShifts();
            shiftData = localStorage.getItem('shifts') ?? "''";
            shifts = JSON.parse(shiftData);
        }

        // console.log(shifts);

        return shifts
    }

    public async loadShifts() {
        // Read Shifts sheet
        let sheet = await this._googleSheetService.getSheetData(sheetId);

        console.log(sheet.title);
        console.log(sheet.rowCount);

        let rows = await sheet.getRows();
        let shifts: ShiftModel[] = [];

        rows.forEach(row => {
            // console.log(row);
            // console.log(row.rowIndex);
            let shiftModel: ShiftModel = new ShiftModel;
            shiftModel.id = row.rowIndex;
            shiftModel.key = row['Key'];
            shiftModel.date = row['Date'];
            shiftModel.service = row['Service'];
            // console.log(shift);

            // console.log(new Date());
            var today  = new Date();
            var datestring = `${today.getMonth() + 1}/${today.getDate()}/${today.getFullYear().toString().substr(-2)}`;
            // console.log(datestring);

            if (shiftModel.id && shiftModel.date == datestring) {
                shifts.push(shiftModel);
            }
            
        });
        // console.log(shifts);
        console.log(shifts.length);
        // console.log(shifts);

        // Load shifts into storage
        localStorage.setItem('shifts', JSON.stringify(shifts));
    }
}