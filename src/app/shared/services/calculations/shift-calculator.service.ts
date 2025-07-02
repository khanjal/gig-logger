import { Injectable } from "@angular/core";
import { IShift } from "@interfaces/shift.interface";
import { ITrip } from "@interfaces/trip.interface";
import { IWeekday } from "@interfaces/weekday.interface";
import { ActionEnum } from "@enums/action.enum";
import { DateHelper } from "@helpers/date.helper";
import { ShiftService } from "../sheets/shift.service";
import { TripService } from "../sheets/trip.service";
import { WeekdayService } from "../sheets/weekday.service";
import { LoggerService } from "../logger.service";

@Injectable({
    providedIn: 'root'
})
export class ShiftCalculatorService {

    constructor(
        private _shiftService: ShiftService,
        private _tripService: TripService,
        private _weekdayService: WeekdayService,
        private _logger: LoggerService
    ) {}

    private handleError(operation: string, error: any): void {
        this._logger.error(`${operation} failed`, {
            message: error.message || 'Unknown error',
            timestamp: new Date().toISOString(),
            operation
        });
    }

    public async calculateShiftTotals(shifts: IShift[] = []) {
        try {
            this._logger.info('Calculating shift totals');
            
            // Filter out undefined shifts
            shifts = shifts.filter(shift => shift !== undefined);
        
            if (!shifts.length) {
                shifts = await this._shiftService.getPreviousWeekShifts();
            }

            for (let shift of shifts) {
                let trips = (await this._tripService.query("key", shift.key))
                    .filter(x => x.action !== ActionEnum.Delete && !x.exclude);

                shift.totalTrips = +(shift.trips ?? 0) + trips.length;
                shift.totalDistance = +(shift.distance ?? 0) + this.sumTripField(trips, 'distance');
                shift.totalPay = +(shift.pay ?? 0) + this.sumTripField(trips, 'pay');
                shift.totalTips = +(shift.tip ?? 0) + this.sumTripField(trips, 'tip');
                shift.totalBonus = +(shift.bonus ?? 0) + this.sumTripField(trips, 'bonus');
                shift.totalCash = +(shift.cash ?? 0) + this.sumTripField(trips, 'cash');
                shift.grandTotal = +(shift.total ?? 0) + this.sumTripField(trips, 'total');

                if (trips.length > 0) {
                    shift = this.calculateDurations(shift, trips);
                }
                
                await this._shiftService.update([shift]);
            };

            let dates = [... new Set(shifts.map(x => x?.date))];
            await this.calculateDailyTotal(dates);
            
            this._logger.info('Shift totals calculated successfully');
        } catch (error) {
            this.handleError('calculateShiftTotals', error);
            throw error;
        }
    }

    private sumTripField(trips: ITrip[], field: keyof ITrip): number {
        return trips
            .filter(x => x[field] !== undefined)
            .map(x => +(x[field] as number))
            .reduce((acc, value) => acc + value, 0);
    }

    // Converts minutes since midnight to 'HH:mm' string
    private minutesToTimeString(minutes: number): string {
        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
    }

    public calculateDurations(shift: IShift, trips: ITrip[]): IShift {
        // Find earliest pickup and latest pickup/dropoff
        const pickupTimes = trips
            .map(trip => trip.pickupTime)
            .filter(Boolean)
            .map(time => DateHelper.convertToTimestamp(time));
        const dropoffTimes = trips
            .map(trip => trip.dropoffTime)
            .filter(Boolean)
            .map(time => DateHelper.convertToTimestamp(time));

        if (pickupTimes.length) {
            const earliestPickup = Math.min(...pickupTimes);
            shift.start = this.minutesToTimeString(earliestPickup);
        }
        if (pickupTimes.length || dropoffTimes.length) {
            const latestPickup = pickupTimes.length ? Math.max(...pickupTimes) : 0;
            const latestDropoff = dropoffTimes.length ? Math.max(...dropoffTimes) : 0;
            const latest = Math.max(latestPickup, latestDropoff);
            if (latest > 0) {
                shift.finish = this.minutesToTimeString(latest);
            }
        }

        // Calculate total time as the duration between new start and finish
        if (shift.start && shift.finish) {
            const duration = DateHelper.getDurationSeconds(shift.start, shift.finish);
            shift.time = DateHelper.getDurationString(duration);
            shift.totalTime = DateHelper.getDurationString(duration); // Ensure totalTime is set
        }

        const tripsActiveTime = trips
            .map(trip => DateHelper.getTimeNumber(trip.duration))
            .filter(duration => duration > 0)
            .reduce((acc, value) => acc + value, 0);

        const uniqueTimeRanges = trips
            .map(trip => ({ pickupTime: trip.pickupTime, dropoffTime: trip.dropoffTime }))
            .filter((timeSet, index, self) =>
                self.findIndex(t => 
                    t.pickupTime === timeSet.pickupTime && t.dropoffTime === timeSet.dropoffTime
                ) === index
            );

        let mergedTotalTime = 0;
        const mergedTimeSets = uniqueTimeRanges.reduce((acc: { pickupTime: string; dropoffTime: string }[], currentSet: { pickupTime: string; dropoffTime: string }) => {
            const lastSet = acc[acc.length - 1];

            const pickupTimestamp = DateHelper.convertToTimestamp(currentSet.pickupTime);
            const dropoffTimestamp = DateHelper.convertToTimestamp(lastSet?.dropoffTime);

            if (lastSet && pickupTimestamp < dropoffTimestamp) {
                const currentSetDropoff = DateHelper.convertToTimestamp(currentSet.dropoffTime);

                if (currentSetDropoff > dropoffTimestamp) {
                    currentSet.pickupTime = lastSet.dropoffTime;
                    mergedTotalTime += DateHelper.getDurationSeconds(currentSet.pickupTime, currentSet.dropoffTime);
                    acc.push({ ...currentSet });
                }
            }
            else {
                mergedTotalTime += DateHelper.getDurationSeconds(currentSet.pickupTime, currentSet.dropoffTime);
                acc.push({ ...currentSet });
            }

            return acc;
        }, [] as { pickupTime: string; dropoffTime: string }[]);

        if (tripsActiveTime > 0) {
            shift.totalActive = DateHelper.getDurationString(tripsActiveTime);
        }
        
        if (mergedTotalTime < tripsActiveTime) {
            shift.active = DateHelper.getDurationString(mergedTotalTime);
        }
        else {
            shift.active = "";
        }

        if (shift.start && shift.finish) {
            const duration = DateHelper.getDurationSeconds(shift.start, shift.finish);
            if (duration) {
                shift.amountPerTime = shift.grandTotal / DateHelper.getHoursFromSeconds(duration);
            }
        }

        return shift;
    }

    public async calculateDailyTotal(dates: string[] = []) {
        try {
            this._logger.info('Calculating daily totals');
            
            let currentDate = DateHelper.getStartOfWeekDate(new Date);
            let individualDates = true;
            let shifts: IShift[] = [];

            if (!dates.length) {
                shifts = await this._shiftService.getShiftsByStartDate(currentDate);
                dates = [... new Set(shifts.flatMap(x => x.date))];
                individualDates = false;
            }

            for (const date of dates) {
                if (date < currentDate) {
                    return;
                }

                if (individualDates) {
                    shifts = await this._shiftService.getShiftsByDate(date);
                }

                let shiftTotal = shifts
                    .filter(x => x.date === date)
                    .map(x => x.grandTotal)
                    .reduce((acc, value) => acc + value, 0);
                    
                let dayOfWeek = DateHelper.getDayOfWeek(new Date(DateHelper.getDateFromISO(date)));
                let weekday = (await this._weekdayService.query("day", dayOfWeek))[0];

                if (!weekday) {
                    weekday = {} as IWeekday;
                    weekday.day = dayOfWeek;
                }

                if (!weekday.currentAmount || weekday.currentAmount != shiftTotal) {
                    weekday.currentAmount = shiftTotal;
                    await this._weekdayService.update([weekday]);
                }
            };
            
            this._logger.debug('Daily totals calculated successfully');
        } catch (error) {
            this.handleError('calculateDailyTotal', error);
            throw error;
        }
    }
}