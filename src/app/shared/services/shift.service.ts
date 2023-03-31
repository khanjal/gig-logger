import { Injectable } from "@angular/core";
import { ShiftModel } from "src/app/shared/models/shift.model";
import { DateHelper } from "../helpers/date.helper";
import { GoogleDriveService } from "./googleSheet.service";

const sheetName = "Shifts";

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

    public async getTodaysShifts():  Promise<ShiftModel[]> {
        let shifts: ShiftModel[] = [];
        let shiftData = localStorage.getItem('shifts') ?? '""';
        shifts = JSON.parse(shiftData);

        if (!shifts) {
            await this.loadShifts();
            shiftData = localStorage.getItem('shifts') ?? "''";
            shifts = JSON.parse(shiftData);
        }

        let datestring = DateHelper.getDateString();

        let todaysShifts: ShiftModel[] = [];

        shifts.forEach(shift => {
            if (shift.date == datestring) {
                todaysShifts.push(shift);
            }
        });

        // console.log(shifts);

        return todaysShifts;
    }

    public async getNextShiftNumber(service: string): Promise<number> {
        let shifts: ShiftModel[] = await this.getTodaysShifts();

        let serviceShifts = shifts.filter(shift => shift.service == service);

        return serviceShifts.length;
    }

    public async addShift(shift: ShiftModel) {
        let shifts = await this.getShifts();

        shifts.push(shift);

        localStorage.setItem('shifts', JSON.stringify(shifts));
    }

    public async loadShifts() {
        // Read Shifts sheet
        let sheet = await this._googleSheetService.getSheetDataByName(sheetName);

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
            shiftModel.saved = true;
            shiftModel.service = row['Service'];
            shiftModel.shiftNumber = row['#'];
            // console.log(shift);

            if (shiftModel.date) {
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