import { GoogleSpreadsheetRow } from "google-spreadsheet";
import { ShiftModel } from "../models/shift.model";
import { SiteModel } from "../models/site.model";
import { DateHelper } from "./date.helper";
import { NumberHelper } from "./number.helper";
import { TripHelper } from "./trip.helper";
import { IShift } from "@interfaces/shift.interface";
import { ITrip } from "@interfaces/trip.interface";

export class ShiftHelper {
    static getAllShifts(): ShiftModel[] {
        let shifts = [...this.getLocalShifts(), ...this.getRemoteShifts()];
        return shifts;
    }

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

    static getLocalShifts(): ShiftModel[] {
        let siteData: SiteModel = new SiteModel;
        let shifts: ShiftModel[] = [];

        if (siteData) {
            shifts = siteData.local.shifts;
        }

        return shifts;
    }

    static getPastShifts(days: number = 0, shifts?: ShiftModel[]):  ShiftModel[] {
        if (!shifts) {
            //shifts = this.getUniqueShifts();
            shifts = [];
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
        let siteData: SiteModel = new SiteModel;
        let shifts: ShiftModel[] = [];

        if (siteData) {
            shifts = siteData.remote.shifts;
        }

        return shifts;
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

    static addShift(shift: ShiftModel) {
        let shifts = this.getLocalShifts();

        shifts.push(shift);

        // let gigs = LocalStorageHelper.getSiteData();
        // gigs.local.shifts = shifts;

        // LocalStorageHelper.updateLocalData(gigs);
    }

    static clearSavedShifts() {
        let shifts = this.getLocalShifts();

        shifts = shifts.filter(x => !x.saved);

        // let gigs = LocalStorageHelper.getSiteData();
        // gigs.local.shifts = shifts;

        // LocalStorageHelper.updateLocalData(gigs);
    }

    static createNewShift(service: string, shifts: IShift[]): ShiftModel {
        let shift: ShiftModel = new ShiftModel;

        shift.service = service;

        let shiftNumber = this.getNextShiftNumber(service, shifts);

        shift.key = `${DateHelper.getDays}-${shiftNumber}-${service}`;
        shift.number = shiftNumber ?? 0;
        shift.start = new Date().toLocaleTimeString();
        
        return shift;
    }

    static sortShiftsDesc(shifts: IShift[]): IShift[] {
        shifts.sort((a,b) => b.key.localeCompare(a.key));

        return shifts;
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
            shiftModel.saved = "true";
            shiftModel.service = row['Service'];
            shiftModel.number = row['#'];
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

    static updateAllShiftTotals() {
        this.updateLocalShiftTotals();
        this.updateRemoteShiftTotals();
    }

    static updateLocalShiftTotals() {
        let shifts = this.getLocalShifts();
        
        shifts = this.updateShiftTotals(shifts);

        // let data = LocalStorageHelper.getSiteData();
        // data.local.shifts = shifts;

        // LocalStorageHelper.updateLocalData(data);
    }

    static updateRemoteShiftTotals() {
        let shifts = this.getRemoteShifts();
        
        shifts = this.updateShiftTotals(shifts);

        // let data = LocalStorageHelper.getSiteData();
        // data.remote.shifts = shifts;

        // LocalStorageHelper.updateRemoteData(data);
    }

    static updateShiftTotals(shifts: ShiftModel[]): ShiftModel[] {
        let trips = TripHelper.getAllTrips();

        shifts.forEach(shift => {
            shift.total = 0;
            shift.trips = 0;
            let filteredTrips = trips.filter(x => x.date === shift.date && x.service === shift.service && x.number === shift.number);
            
            filteredTrips.forEach(trip => {
                shift.total += trip.total;
                shift.trips++;
            });
        });
        
        return shifts;
    }
}