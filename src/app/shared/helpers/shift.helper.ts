import { GoogleSpreadsheetRow } from "google-spreadsheet";
import { ShiftModel } from "@models/shift.model";
import { DateHelper } from "@helpers/date.helper";
import { NumberHelper } from "@helpers/number.helper";
import { IShift } from "@interfaces/shift.interface";

export class ShiftHelper {
    static getUniqueShifts(shifts: IShift[]): ShiftModel[] {
        let uniqueShifts: IShift[] = [];

        shifts.forEach(shift => {

            let foundShift = uniqueShifts.find(x => x.date == shift.date && x.service == shift.service && x.number == shift.number);

            if (foundShift) {
                return;
            }

            uniqueShifts.push(shift);
        });

        return uniqueShifts;
    }

    static getNextShiftNumber(service: string, shifts: IShift[]): number {
        shifts = this.getUniqueShifts(shifts);

        let serviceShifts = shifts.filter(shift => shift.service == service);

        return serviceShifts.length+1;
    }

    static getTodaysShifts():  ShiftModel[] {
        //let shifts: ShiftModel[] = this.getUniqueShifts();
        let shifts: ShiftModel[] = [];

        let todaysShifts: ShiftModel[] = [];

        shifts.forEach(shift => {
            if (new Date(shift.date).toLocaleDateString() == new Date().toLocaleDateString()) {
                todaysShifts.push(shift);
            }
        });


        return todaysShifts;
    }

    static createNewShift(service: string, shifts: IShift[]): ShiftModel {
        let shift: ShiftModel = new ShiftModel;

        shift.service = service;

        let shiftNumber = this.getNextShiftNumber(service, shifts);

        shift.key = `${DateHelper.getDays()}-${shiftNumber}-${service}`;
        shift.number = shiftNumber ?? 0;
        shift.start = new Date().toLocaleTimeString();
        
        return shift;
    }

    static removeDuplicateShifts(shifts: IShift[]): IShift[] {
        shifts = shifts.filter((value, index, self) => self.map(x => x.key).indexOf(value.key) == index);

        return shifts;
    }

    static sortShiftsDesc(shifts: IShift[]): IShift[] {
        shifts.sort((a,b) => b.key.localeCompare(a.key));

        return shifts;
    }

    static translateSheetData(rows: GoogleSpreadsheetRow[]): IShift[] {
        let shifts: IShift[] = [];

        rows.forEach(row => {
            // console.log(row);
            // console.log(row.rowIndex);
            let shiftModel: IShift = {} as IShift;
            shiftModel.id = row.rowIndex;
            shiftModel.key = row['Key'];
            shiftModel.date = row['Date'];
            shiftModel.saved = "true";
            shiftModel.service = row['Service'];
            shiftModel.number = row['#'];
            shiftModel.total = NumberHelper.getNumberFromString(row['G Total']) ?? 0;
            shiftModel.trips = row['T Trip'] ?? 0;
            // console.log(shift);

            if (shiftModel.date) {
                shifts.push(shiftModel);
            }
            
        });
        // console.log(shifts);
        console.log(shifts.length);
        // console.log(shifts);

        return shifts;
    }
}