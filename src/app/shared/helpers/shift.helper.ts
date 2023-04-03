import { GoogleSpreadsheetRow } from "google-spreadsheet";
import { ShiftModel } from "../models/shift.model";
import { SiteModel } from "../models/site.model";
import { DateHelper } from "./date.helper";
import { LocalStorageHelper } from "./localStorage.helper";
import { NumberHelper } from "./number.helper";

export class ShiftHelper {

    static getAllShifts(): ShiftModel[] {
        let shifts = [...this.getLocalShifts(), ...this.getRemoteShifts()];
        return shifts;
    }

    static getUniqueShifts(): ShiftModel[] {
        let shifts = this.getRemoteShifts();
        let localShifts = this.getLocalShifts();

        localShifts.forEach(localShift => {
            let foundShift = shifts.find(x => x.date == localShift.date && x.service == localShift.service && x.shiftNumber == localShift.shiftNumber);

            if (foundShift) {
                return;
            }

            shifts.push(localShift);
        });

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

    static getPastShifts(days: number = 0, shifts?: ShiftModel[]):  ShiftModel[] {
        if (!shifts) {
            shifts = this.getAllShifts();
        }

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

        let todaysShifts: ShiftModel[] = [];

        shifts.forEach(shift => {
            if (new Date(shift.date).toLocaleDateString() == new Date().toLocaleDateString()) {
                todaysShifts.push(shift);
            }
        });


        return todaysShifts;
    }

    static addShift(shift: ShiftModel) {
        let shifts = this.getLocalShifts();

        shifts.push(shift);

        let gigs = LocalStorageHelper.getSiteData();
        gigs.local.shifts = shifts;

        LocalStorageHelper.updateLocalData(gigs);
    }

    static clearSavedShifts() {
        let shifts = this.getLocalShifts();

        shifts = shifts.filter(x => !x.saved);

        let gigs = LocalStorageHelper.getSiteData();
        gigs.local.shifts = shifts;

        LocalStorageHelper.updateLocalData(gigs);
    }

    static createNewShift(service: string): ShiftModel {
        let shift: ShiftModel = new ShiftModel;

        shift.service = service;

        let shiftNumber = this.getNextShiftNumber(service);

        shift.id = ShiftHelper.getLocalShifts().length++;
        shift.shiftNumber = shiftNumber;
        shift.start = new Date().toLocaleTimeString();
        
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
            shiftModel.total = NumberHelper.getNumberFromString(row['G Total']);
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