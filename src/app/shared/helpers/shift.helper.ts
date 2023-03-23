import { GoogleSpreadsheetRow } from "google-spreadsheet";
import { ShiftModel } from "../models/shift.model";
import { SiteModel } from "../models/site.model";
import { DateHelper } from "./date.helper";
import { LocalStorageHelper } from "./localStorage.helper";

export class ShiftHelper {
    static getAllShifts(): ShiftModel[] {
        let shifts = [...this.getLocalShifts(), ...this.getRemoteShifts()];

        return shifts;
    }

    static getLocalShifts(): ShiftModel[] {
        let siteData: SiteModel = LocalStorageHelper.getSiteData();
        let shifts: ShiftModel[] = [];

        if (siteData) {
            shifts = siteData.local.shifts;
        }

        return shifts;
    }

    static getPastShifts(days: number = 0):  ShiftModel[] {
        let shifts = this.getAllShifts();

        let datestring = DateHelper.getDateString(days);

        let pastShifts: ShiftModel[] = [];

        shifts.forEach(shift => {
            if (new Date(shift.date) >= new Date(datestring)) {
                pastShifts.push(shift);
            }
        });

        // console.log(pastShifts);

        return pastShifts;
    }

    static getRemoteShifts(): ShiftModel[] {
        let siteData: SiteModel = LocalStorageHelper.getSiteData();
        let shifts: ShiftModel[] = [];

        if (siteData) {
            shifts = siteData.remote.shifts;
        }

        return shifts;
    }

    static getNextShiftNumber(service: string): number {
        let shifts: ShiftModel[] = this.getTodaysShifts();

        let serviceShifts = shifts.filter(shift => shift.service == service);

        return serviceShifts.length+1;
    }

    static getTodaysShifts():  ShiftModel[] {
        let shifts: ShiftModel[] = this.getAllShifts();
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

    static addShift(shift: ShiftModel) {
        let shifts = this.getLocalShifts();

        shifts.push(shift);

        let gigs = LocalStorageHelper.getSiteData();

        gigs.local.shifts = shifts;

        LocalStorageHelper.updateLocalData(gigs);
    }

    static createNewShift(service: string): ShiftModel {
        let shift: ShiftModel = new ShiftModel;
        // let datestring = DateHelper.getDateString();
        let datestring = new Date().toLocaleDateString();

        shift.date = datestring;
        shift.service = service;

        let shiftNumber = this.getNextShiftNumber(service);

        shift.shiftNumber = shiftNumber;
        
        return shift;
    }

    static translateSheetData(rows: GoogleSpreadsheetRow[]): ShiftModel[] {
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

        return shifts;
    }
}