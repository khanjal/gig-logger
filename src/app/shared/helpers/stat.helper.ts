import { IShift } from "@interfaces/shift.interface";
import { IStatItem } from "@interfaces/stat-item.interface";
import { ITrip } from "@interfaces/trip.interface";

export class StatHelper {
    static getTripsTotal(trips: ITrip[] = []): IStatItem {
        let item = {} as IStatItem;
        
        item.trips = trips.length;

        trips.forEach(trip => {
            
        })
        item.distance = trips.filter(x => x.distance).map(x => x.distance).reduce((acc, value) => acc + value, 0);
        item.pay = trips.filter(x => x.pay).map(x => x.pay).reduce((acc, value) => acc + value, 0);
        item.tip = trips.filter(x => x.tip).map(x => x.tip).reduce((acc, value) => acc + value, 0);
        item.bonus = trips.filter(x => x.bonus).map(x => x.bonus).reduce((acc, value) => acc + value, 0);
        item.total = trips.filter(x => x.total).map(x => x.total).reduce((acc, value) => acc + value, 0);
        item.cash = trips.filter(x => x.cash).map(x => x.cash).reduce((acc, value) => acc + value, 0);

        item.amountPerTrip = item.total / item.trips;
        item.amountPerDistance = item.total / (!item.distance ? 1 : item.distance);
        item.amountPerTime = trips.filter(x => x.amountPerTime).map(x => x.amountPerTime).reduce((acc, value) => acc + value, 0) / item.trips;

        return item;
    }

    static getShiftsTotal(shifts: IShift[] = []): IStatItem[] {
        return [];
    }
}