import { liveQuery } from 'dexie';
import { from } from 'rxjs';
import { spreadsheetDB } from '@data/spreadsheet.db';
import { ITrip } from '@interfaces/trip.interface';
import { DateHelper } from '@helpers/date.helper';
import { TripHelper } from '@helpers/trip.helper';
import { ActionEnum } from '@enums/action.enum';
import { Injectable } from '@angular/core';
import { SyncableCrudService } from '@services/syncable-crud.service';
import { updateAction } from '@utils/action.utils';

@Injectable({
    providedIn: 'root'
  })
export class TripService extends SyncableCrudService<ITrip> {
        constructor() {
            super(spreadsheetDB.trips); // Pass the table reference
        }

    trips$ = from(liveQuery(() => spreadsheetDB.trips.toArray()));
    
    public async addNext(trip: ITrip) {
        let nextTrip = {} as ITrip;
        updateAction(nextTrip, ActionEnum.Add);
        nextTrip.rowId = await this.getMaxRowId() + 1;
        nextTrip.key = trip.key;
        nextTrip.date = trip.date;
        nextTrip.region = trip.region;
        nextTrip.service = trip.service;
        nextTrip.number = trip.number;
        nextTrip.place = trip.place;
        nextTrip.type = trip.type;
        nextTrip.startAddress = trip.startAddress;
        nextTrip.pickupTime = trip.dropoffTime;
        // Ensure optional string fields are initialized to avoid rendering "undefined"
        nextTrip.note = '';
        nextTrip.endUnit = '';
        nextTrip.orderNumber = '';
        nextTrip.name = '';
        nextTrip.endAddress = '';
        nextTrip.dropoffTime = '';
        nextTrip.duration = '';
        nextTrip.distance = 0;
        nextTrip.pay = 0;
        nextTrip.tip = 0;
        nextTrip.bonus = 0;
        nextTrip.cash = 0;
        nextTrip.startOdometer = 0;
        nextTrip.endOdometer = 0;
        nextTrip.exclude = false;
        await this.add(nextTrip);
    }

    async clone(trip: ITrip) {
        let cloneTrip = trip;
        delete cloneTrip.id;
        cloneTrip.rowId = await this.getMaxRowId() + 1;
        updateAction(cloneTrip, ActionEnum.Add);
        await this.add(cloneTrip);
    }

    /**
     * Split a trip into two rows by dividing pay and distance.
     * The original trip is updated to the first half (rounded down to nearest $0.25),
     * the new trip receives the remaining amount so totals match the original.
     */
    public async split(trip: ITrip, copyOption?: 'place' | 'customer' | 'neither') {
        if (!trip) return;

        // Work with numeric defaults
        const totalPay = Number(trip.pay) || 0;
        const totalDistance = Number(trip.distance) || 0;

        // Pay splitting: operate in cents and allocate quarters (25c)
        const totalCents = Math.round(totalPay * 100);
        const halfCents = totalCents / 2;
        // floor to nearest 25 cents for the first half
        const firstHalfQuarters = Math.floor(halfCents / 25);
        const firstHalfCents = firstHalfQuarters * 25;
        const secondHalfCents = totalCents - firstHalfCents;

        const firstPay = firstHalfCents / 100;
        const secondPay = secondHalfCents / 100;

        // Distance splitting: round first half to one decimal, keep remainder exact so sums match
        const halfDistance = totalDistance / 2;
        const firstDistance = Math.round(halfDistance * 10) / 10;
        const secondDistance = +(totalDistance - firstDistance).toFixed(3);

        // Start with a minimal new trip - essential routing/context fields only
        const newTrip: ITrip = {} as ITrip;
        newTrip.rowId = await this.getMaxRowId() + 1;

        // Core fields that always carry over (define the route context)
        newTrip.pickupTime = trip.pickupTime;
        newTrip.date = trip.date;
        newTrip.service = trip.service;
        newTrip.region = trip.region;
        newTrip.number = trip.number;
        newTrip.key = trip.key;

        // Assign split values
        newTrip.pay = secondPay;
        newTrip.distance = secondDistance;

        // Add optional fields based on copy preference
        if (copyOption === 'place') {
            // Keep pickup location info for same-location doubles
            newTrip.place = trip.place;
            newTrip.startAddress = trip.startAddress;
        } else if (copyOption === 'customer') {
            // Keep customer name for same-customer doubles
            newTrip.name = trip.name;
            newTrip.endAddress = trip.endAddress;
            newTrip.endUnit = trip.endUnit;
        } else if (!copyOption) {
            // Default: keep both place and customer info
            newTrip.place = trip.place;
            newTrip.startAddress = trip.startAddress;
            newTrip.endAddress = trip.endAddress;
            newTrip.endUnit = trip.endUnit;
            newTrip.name = trip.name;
        }
        // 'neither': everything stays cleared (already initialized above)

        // Recalculate total for new trip (total = pay + tip + bonus)
        TripHelper.updateTotal(newTrip);

        // Update original trip values
        trip.pay = firstPay;
        trip.distance = firstDistance;
        // Recalculate total for original trip (total = pay + tip + bonus)
        TripHelper.updateTotal(trip);

        // Mark actions
        updateAction(newTrip, ActionEnum.Add);
        updateAction(trip, ActionEnum.Update);

        // Persist both: update original, add new
        await this.update([trip]);
        await this.add(newTrip);
    }

    public async getSaved(): Promise<ITrip[]> {
        return (await this.list()).filter(x => x.saved);
    }

    public async getBetweenDates(startDate: string, endDate: string): Promise<ITrip[]> {
        let trips = await spreadsheetDB.trips.where("date").between(startDate, endDate, true, true).toArray();

        return trips;
    }

    public async getByDate(date: string): Promise<ITrip[]> {
        let trips = await spreadsheetDB.trips.where("date").equals(date).toArray();

        return trips;
    }

    public async getPreviousDays(days: number): Promise<ITrip[]> {
        let date = DateHelper.toISO(DateHelper.getDateFromDays(days));
        let trips = await spreadsheetDB.trips.where("date").aboveOrEqual(date).toArray();

        return trips;
    }

    
}