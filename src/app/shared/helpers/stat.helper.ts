import { IShift } from "@interfaces/shift.interface";
import { IStatItem } from "@interfaces/stat-item.interface";
import { ITrip } from "@interfaces/trip.interface";
import { IDaily } from "@interfaces/daily.interface";

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

    static formatDateLabel(dateString: string): string {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return 'Unknown date';
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }

    static getWeekdayAggregatesFromDaily(dailyData: IDaily[], startDate?: string, endDate?: string): Record<string, { count: number; total: number; perTimeSum: number; trips: number }> {
        const map: Record<string, { count: number; total: number; perTimeSum: number; trips: number }> = {};

        let filtered = dailyData;
        if (startDate || endDate) {
            filtered = dailyData.filter(d => {
                if (startDate && d.date < startDate) return false;
                if (endDate && d.date > endDate) return false;
                return true;
            });
        }

        for (const daily of filtered) {
            const weekday = daily.weekday;
            if (!weekday) continue;
            if (!map[weekday]) map[weekday] = { count: 0, total: 0, perTimeSum: 0, trips: 0 };
            map[weekday].count += 1; // count of days
            map[weekday].total += daily.total || 0;
            map[weekday].perTimeSum += daily.amountPerTime || 0;
            map[weekday].trips += daily.trips || 0;
        }

        return map;
    }

    static getBusiestDayFromDaily(dailyData: IDaily[], startDate?: string, endDate?: string): { label: string; count: number; date: string } {
        let filtered = dailyData;
        if (startDate || endDate) {
            filtered = dailyData.filter(d => {
                if (startDate && d.date < startDate) return false;
                if (endDate && d.date > endDate) return false;
                return true;
            });
        }

        if (!filtered.length) return { label: '—', count: 0, date: '' };

        const top = filtered.sort((a, b) => {
            if (b.trips !== a.trips) return b.trips - a.trips;
            return new Date(b.date).getTime() - new Date(a.date).getTime();
        })[0];

        return {
            label: this.formatDateLabel(top.date),
            count: top.trips,
            date: top.date
        };
    }

    static getHighestEarningDayFromDaily(dailyData: IDaily[], startDate?: string, endDate?: string): { label: string; total: number; date: string } {
        let filtered = dailyData;
        if (startDate || endDate) {
            filtered = dailyData.filter(d => {
                if (startDate && d.date < startDate) return false;
                if (endDate && d.date > endDate) return false;
                return true;
            });
        }

        if (!filtered.length) return { label: '—', total: 0, date: '' };

        const top = filtered.sort((a, b) => {
            if (b.total !== a.total) return b.total - a.total;
            return new Date(b.date).getTime() - new Date(a.date).getTime();
        })[0];

        return {
            label: this.formatDateLabel(top.date),
            total: top.total,
            date: top.date
        };
    }
}