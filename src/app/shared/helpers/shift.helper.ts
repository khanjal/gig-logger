import { DateHelper } from "@helpers/date.helper";
import { IShift } from "@interfaces/shift.interface";
import { sort } from "./sort.helper";
import { ActionEnum } from "@enums/action.enum";
import { updateAction } from "@utils/action.utils";

export class ShiftHelper {
    static compareShifts(o1: IShift, o2: IShift): boolean {
        return o1?.date === o2?.date && o1?.service === o2?.service && o1?.number === o2?.number
    }

    static getUniqueShifts(shifts: IShift[]): IShift[] {
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
        sort(serviceShifts, '-number');

        return serviceShifts.length > 0 ? serviceShifts[0].number+1 : 1;
    }

    static getTodaysShifts():  IShift[] {
        let shifts: IShift[] = [];
        let todaysShifts: IShift[] = [];

        shifts.forEach(shift => {
            if (DateHelper.getISOFormat(new Date(shift.date)) == DateHelper.getISOFormat()) {
                todaysShifts.push(shift);
            }
        });


        return todaysShifts;
    }

    static createNewShift(service: string, shifts: IShift[]): IShift {
        let shift: IShift = {} as IShift;

        shift.service = service;

        let shiftNumber = this.getNextShiftNumber(service, shifts);

        shift.key = `${DateHelper.getDays()}-${shiftNumber}-${service}`;
        shift.date = DateHelper.getISOFormat(DateHelper.getDateFromDays());
        shift.number = shiftNumber ?? 0;
        shift.start = new Date().toLocaleTimeString();
        shift.total = 0;
        shift.trips = 0;
        updateAction(shift, ActionEnum.Add);
        
        return shift;
    }

    static removeDuplicateShifts(shifts: IShift[]): IShift[] {
        shifts = shifts.filter((value, index, self) => self.map(x => x.key).indexOf(value.key) == index);

        return shifts;
    }
}