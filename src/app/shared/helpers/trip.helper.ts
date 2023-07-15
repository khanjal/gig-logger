import { ITrip } from "@interfaces/trip.interface";

export class TripHelper {
    static sortTripsDesc(trips: ITrip[]): ITrip[] {
        // trips.sort((a,b) => a.pickupTime.localeCompare(b.pickupTime) && a.date.localeCompare(b.date));
        trips.sort((a,b) => (b.id ?? 0) - (a.id ?? 0));

        return trips;
    }
}