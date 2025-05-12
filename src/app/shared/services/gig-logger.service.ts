import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { environment } from "src/environments/environment";

// Enums
import { ActionEnum } from "@enums/action.enum";

// Helpers
import { DateHelper } from "@helpers/date.helper";
import { sort } from "@helpers/sort.helper";

// Interfaces
import { ISheet } from "@interfaces/sheet.interface";
import { IDelivery } from "@interfaces/delivery.interface";
import { INote } from "@interfaces/note.interface";
import { ITrip } from "@interfaces/trip.interface";
import { IType } from "@interfaces/type.interface";
import { IAddress } from "@interfaces/address.interface";
import { IShift } from "@interfaces/shift.interface";
import { IWeekday } from "@interfaces/weekday.interface";
import { ISheetProperties } from "@interfaces/sheet-properties.interface";

// Services
import { AddressService } from "./sheets/address.service";
import { DeliveryService } from "./delivery.service";
import { NameService } from "./sheets/name.service";
import { PlaceService } from "./sheets/place.service";
import { ServiceService } from "./sheets/service.service";
import { ShiftService } from "./sheets/shift.service";
import { TripService } from "./sheets/trip.service";
import { WeekdayService } from "./sheets/weekday.service";
import { RegionService } from "./sheets/region.service";
import { TypeService } from "./sheets/type.service";
import { DailyService } from "./sheets/daily.service";
import { MonthlyService } from "./sheets/monthly.service";
import { WeeklyService } from "./sheets/weekly.service";
import { YearlyService } from "./sheets/yearly.service";
import { firstValueFrom } from "rxjs";
import { IService } from "@interfaces/service.interface";
import { IRegion } from "@interfaces/region.interface";
import { IName } from "@interfaces/name.interface";
import { IPlace } from "@interfaces/place.interface";

@Injectable({
    providedIn: 'root'
  })
export class GigLoggerService {
    private apiUrl= environment.gigLoggerApi;

    constructor(
        private _http: HttpClient,
        private _addressService: AddressService,
        private _dailyService: DailyService,
        private _deliveryService: DeliveryService,
        private _monthlyService: MonthlyService,
        private _nameService: NameService,
        private _placeService: PlaceService,
        private _regionService: RegionService,
        private _serviceService: ServiceService,
        private _shiftService: ShiftService,
        private _tripService: TripService,
        private _typeService: TypeService,
        private _weekdayService: WeekdayService,
        private _weeklyService: WeeklyService,
        private _yearlyService: YearlyService
    ) {}

    private setHeader(sheetId?: string) {
        let headers = new HttpHeaders();
        if (sheetId) {
            headers = headers.set('Sheet-Id', sheetId);
        }
        headers = headers.set('Content-Type', "application/json");
        console.log("Headers set:", headers);
        return headers;
    }

    private setOptions(sheetId?: string) {
        const options = {
            withCredentials: true, // Ensures cookies are sent with requests
            headers: this.setHeader(sheetId),
        };

        console.log("Request options:", options);
        return options;
    }

    // Auth
    public async setRefreshToken(refreshToken: string) { 
        console.log("Setting Refresh Token:", refreshToken);
        try {
            if (typeof refreshToken !== 'string') {
                throw new Error('Invalid refresh token format. Expected a string.');
            }

            let body = {} as ISheetProperties;
            body.id = "refreshToken";
            body.name = refreshToken;

            console.log("Sending request to set refresh token with body:", body);

            const response = await firstValueFrom(this._http.post<any>(
                `${this.apiUrl}/auth`, 
                JSON.stringify(body), 
                { headers: this.setHeader() }
            ));

            console.log("Refresh token set successfully:", response);
            return response;
        } catch (error) {
            console.error('Error setting refresh token:', error);
            return null;
        }
    }

    public async clearRefreshToken() { 
        return this._http.post<any>(`${this.apiUrl}/auth/clear`, null);
    }

    public async refreshAuthToken() { 
        try {
            return await firstValueFrom(this._http.post<any>(`${this.apiUrl}/auth/refresh`, this.setOptions()));
        } catch (error) {
            console.error('Error getting access token:', error);
            return null;
        }
    }

    public async getSheetData(sheetId: string) {
        try {
            return await firstValueFrom(this._http.get(`${this.apiUrl}/sheets/all`, this.setOptions(sheetId)));
        } catch (error) {
            console.error('Error getting sheet data:', error);
            return null;
        }
    }

    public async getSheetSingle(sheetId: string, sheetName: string) {
        return this._http.get(`${this.apiUrl}/sheets/single/${sheetName}`, this.setOptions(sheetId));
    }

    public async getSecondarySheetData(sheetId: string) {
        return this._http.get(`${this.apiUrl}/sheets/multiple?sheetName=names&sheetName=places&sheetName=trips`, this.setOptions(sheetId));
    }

    public async warmupLambda(sheetId: string): Promise<any> {
        try {
            return await firstValueFrom(this._http.get(`${this.apiUrl}/sheets/check`, this.setOptions(sheetId)));
        } catch (error) {
            console.error('Error warming up Lambda:', error);
            return null;
        }
    }

    public async healthCheck(sheetId: string) {
        console.log("Performing health check for sheet ID:", sheetId);
        try {
            return await firstValueFrom(this._http.get(`${this.apiUrl}/sheets/health`, { headers: this.setHeader(sheetId) }));
        } catch (error) {
            console.error('Error getting health check:', error);
            return null;
        }
    }

    public async postSheetData(sheetData: ISheet): Promise<any> {
        try {
            return await firstValueFrom(this._http.post<any>(`${this.apiUrl}/sheets/save`, JSON.stringify(sheetData), this.setOptions(sheetData.properties.id)));
        } catch (error) {
            console.error('Error posting sheet data:', error);
            return null;
        }
    }

    public async createSheet(properties: ISheetProperties){
        return this._http.post<any>(`${this.apiUrl}/sheets/create`, JSON.stringify(properties), this.setOptions(properties.id));
    }

    public async loadData(sheetData: ISheet) {
        await this._addressService.load(sheetData.addresses);
        await this._dailyService.load(sheetData.daily);
        await this._monthlyService.load(sheetData.monthly);
        await this._nameService.load(sheetData.names);
        await this._placeService.load(sheetData.places);
        await this._regionService.load(sheetData.regions);
        await this._serviceService.load(sheetData.services);
        await this._shiftService.load(sheetData.shifts);
        await this._tripService.load(sheetData.trips);
        await this._typeService.load(sheetData.types);
        await this._weekdayService.load(sheetData.weekdays);
        await this._weeklyService.load(sheetData.weekly);
        await this._yearlyService.load(sheetData.yearly);

        await this.linkNameData();
        await this.linkAddressData();
        await this.linkPlaceData();

        await this._deliveryService.clear();
        await this.linkDeliveries(sheetData.trips);
    }

    public async appendData(sheetData: ISheet) {
        await this._addressService.append(sheetData.addresses);
        await this._nameService.append(sheetData.names);

        await this.linkDeliveries(sheetData.trips);
    }

    public async calculateShiftTotals(shifts: IShift[] = []) {
        // Filter out undefined shifts
        shifts = shifts.filter(shift => shift !== undefined);
    
        if (!shifts.length) {
            shifts = await this._shiftService.getPreviousWeekShifts();
        }

        for (let shift of shifts) {
            let trips = (await this._tripService.query("key", shift.key)).filter(x => x.action !== ActionEnum.Delete && !x.exclude);

            shift.totalTrips = +(shift.trips ?? 0) + trips.length;
            shift.totalDistance = +(shift.distance ?? 0) + +trips.filter(x => x.distance != undefined).map((x) => x.distance).reduce((acc, value) => acc + value, 0);
            shift.totalPay = +(shift.pay ?? 0) + +trips.filter(x => x.pay != undefined).map((x) => x.pay).reduce((acc, value) => acc + value, 0);
            shift.totalTips = +(shift.tip ?? 0) + +trips.filter(x => x.tip != undefined).map((x) => x.tip).reduce((acc, value) => acc + value, 0);
            shift.totalBonus = +(shift.bonus ?? 0) + +trips.filter(x => x.bonus != undefined).map((x) => x.bonus).reduce((acc, value) => acc + value, 0);
            shift.totalCash = +(shift.cash ?? 0) + +trips.filter(x => x.cash != undefined).map((x) => x.cash).reduce((acc, value) => acc + value, 0);
            shift.grandTotal = +(shift.total ?? 0) + +trips.filter(x => x.total != undefined).map((x) => x.total).reduce((acc, value) => acc + value, 0);

            if (trips.length > 0) {
                shift = this.calculateDurations(shift, trips);
            }
            
            await this._shiftService.update([shift]);
        };

        let dates = [... new Set(shifts.map(x => x?.date))];

        await this.calculateDailyTotal(dates);
    }

    private calculateDurations(shift: IShift, trips: ITrip[]) {
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

        const tripsActiveTime = trips
            .map(trip => DateHelper.getTimeNumber(trip.duration)) // Convert duration to a number
            .filter(duration => duration > 0) // Filter out invalid or non-positive durations
            .reduce((acc, value) => acc + value, 0); // Sum up the durations

        if (tripsActiveTime > 0) {
            shift.totalActive = DateHelper.getDurationString(tripsActiveTime);
        }
        
        if (mergedTotalTime < tripsActiveTime) {
            shift.active = DateHelper.getDurationString(mergedTotalTime);
        }
        else {
            shift.active = "";
        }

        let duration = DateHelper.getDurationSeconds(shift.start, shift.finish);
        if (duration) {
            shift.amountPerTime = shift.grandTotal / DateHelper.getHoursFromSeconds(duration);
            shift.time = DateHelper.getDurationString(duration);
        }

        return shift;
    }

    public async calculateDailyTotal(dates: string[] = []) {
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

            let shiftTotal = shifts.filter(x => x.date === date).map(x => x.grandTotal).reduce((acc, value) => acc + value, 0);
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
    }

    public async linkDeliveries(trips: ITrip[]) {
        let deliveries: IDelivery[] = await this._deliveryService.getRemoteDeliveries();
        //console.log('Linking Trip Data');

        trips.forEach(async trip => {
            if (!trip.endAddress && !trip.name) {
                return;
            }

            let delivery: IDelivery | undefined;
            let note: INote | undefined;

            // If trip note exists create it.
            if (trip.note) {
                note = {} as INote;
                note.date = trip.date;
                note.text = trip.note;
            }

            delivery = deliveries.find(x => x.address === trip.endAddress && x.name === trip.name);

            if (delivery){
                delivery.bonus += trip.bonus,
                delivery.cash += trip.cash,
                delivery.pay += trip.pay;
                delivery.tip += trip.tip;
                delivery.trips.push(trip);
                delivery.total += trip.total;
                delivery.visits++;
                
                sort(delivery.trips, '-key');

                if (trip.date) {
                    delivery.dates.push(trip.date);
                    delivery.dates = [...new Set(delivery.dates)];
                }
                
                if (trip.place) {
                    delivery.places.push(trip.place);
                    delivery.places = [...new Set(delivery.places)].sort();
                }

                if (trip.service) {
                    delivery.services.push(trip.service);
                    delivery.services = [...new Set(delivery.services)].sort();
                }
                
                if (trip.endUnit) {
                    delivery.units.push(trip.endUnit);
                    delivery.units = [...new Set(delivery.units)];
                }

                if (note) {
                    delivery.notes.push(note);
                }
            }
            else {
                delivery = {} as IDelivery;

                delivery.address = trip.endAddress;
                delivery.bonus = trip.bonus;
                delivery.cash = trip.cash;
                delivery.dates = trip.date ? [trip.date] : [];
                delivery.name = trip.name;
                delivery.notes = note ? [note] : [];
                delivery.pay = trip.pay;
                delivery.places = trip.place ? [trip.place] : [];
                delivery.services = trip.service? [trip.service] : [];
                delivery.tip = trip.tip;
                delivery.trips = [trip];
                delivery.total = trip.total;
                delivery.units = trip.endUnit ? [trip.endUnit] : [];
                delivery.visits = 1;

                deliveries.push(delivery);
            }
        });

        // console.table(deliveries);
        await this._deliveryService.loadDeliveries(deliveries);
    }

    private async linkNameData () {
        let names = await this._nameService.list();
        let trips = await this._tripService.getAll();

        for (let name of names) {
            let addressTrips = trips.filter(x => x.name === name.name && x.endAddress);
            
            // Go through each trip and add addresses and notes
            for (const trip of addressTrips) {
                if (!name.addresses) {
                    name.addresses = [];
                }

                if (!name.addresses.includes(trip.endAddress)) {
                    name.addresses.push(trip.endAddress);
                }
                
                let note = {} as INote;

                if (!name.notes) {
                    name.notes = [];
                }

                // If trip note exists create it.
                if (trip.note) {
                    note.date = trip.date;
                    note.text = trip.note;
                    note.name = trip.name;
                    note.address = trip.endAddress;

                    name.notes.push(note);
                }                
                
                // console.table(name);
                await this._nameService.update([name]);
            };
            // console.log(`Name: ${name.name}`);
        };
    }

    private async linkAddressData () {
        let addresses = await this._addressService.list();
        let trips = await this._tripService.getAll();

        for (let address of addresses) {
            let nameTrips = trips.filter(x => x.endAddress === address.address && x.name);

            // Go through each trip and add addresses and notes
            for (let trip of nameTrips) {
                if (!address.names) {
                    address.names = [];
                }

                if (!address.names.includes(trip.name)) {
                    address.names.push(trip.name);
                }

                let note = {} as INote;

                if (!address.notes) {
                    address.notes = [];
                }
                
                // If trip note exists create it.
                if (trip.note) {
                    note.date = trip.date;
                    note.text = trip.note;
                    note.name = trip.name;
                    note.address = trip.endAddress;

                    address.notes.push(note);
                }                
                
                // console.table(name);
                await this._addressService.append([address])
            };
            // console.log(`Address: ${address.address}`);
        };
    }

    private async linkPlaceData() {
        let trips = await this._tripService.getAll();
        let places = await this._placeService.list();

        for (let place of places) {
            // Addresses
            let tripPlaceAddresses = trips.filter(x => x.place === place.place && x.startAddress);

            for (const tripPlaceAddress of tripPlaceAddresses) {
                if (!place.addresses) {
                    place.addresses = [];
                }

                let placeAddress = place.addresses.find(x => x.address === tripPlaceAddress.startAddress);

                if (placeAddress) {
                    placeAddress.lastTrip = tripPlaceAddress.date;
                    placeAddress.trips++;
                }
                else {
                    let address: IAddress = {} as IAddress;
                    address.address = tripPlaceAddress.startAddress;
                    address.trips = 1;
                    address.lastTrip = tripPlaceAddress.date;
                    place.addresses.push(address);
                }
            };

            if (place.addresses) {
                sort(place.addresses, 'address');
            }

            // Types
            let tripPlaceTypes = trips.filter(x => x.place === place.place && x.type);

            for (const tripPlaceType of tripPlaceTypes) {
                if (!place.types) {
                    place.types = [];
                }
                
                let placeType = place.types.find(x => x.type === tripPlaceType.type);

                if (placeType) {
                    placeType.trips++;
                }
                else {
                    let type: IType = {} as IType;
                    type.type = tripPlaceType.type;
                    type.trips = 1;
                    place.types.push(type);    
                }
            };

            await this._placeService.update([place]);
        };
    }

    async updateAncillaryInfo() {
        // Delete all unsaved services, regions, places, types, names, and addresses
        await this._addressService.deleteUnsaved();
        await this._nameService.deleteUnsaved();
        await this._placeService.deleteUnsaved();
        await this._regionService.deleteUnsaved();
        await this._serviceService.deleteUnsaved();
        await this._typeService.deleteUnsaved();

        let trips = await this._tripService.getPreviousDays(2);

        for (let trip of trips) {
            let endAddress = await this._addressService.find('address', trip.endAddress);
            if (!endAddress && trip.endAddress) {
                await this._addressService.add({ address: trip.endAddress! } as IAddress);
            }

            let name = await this._nameService.find('name', trip.name);
            if (!name && trip.name) {
                await this._nameService.add({ name: trip.name! } as IName);
            }

            let place = await this._placeService.find('place', trip.place);
            if (!place && trip.place) {
                await this._placeService.add({ place: trip.place! } as IPlace);
            }

            let region = await this._regionService.find('region', trip.region);
            if (!region && trip.region) {
                await this._regionService.add({ region: trip.region! } as IRegion);
            }

            let service = await this._serviceService.find('service', trip.service);
            if (!service && trip.service) {
                await this._serviceService.add({ service: trip.service! } as IService);
            }

            let startAddress = await this._addressService.find('address', trip.startAddress);
            if (!startAddress && trip.startAddress) {
                await this._addressService.add({ address: trip.startAddress! } as IAddress);
            }

            let type = await this._typeService.find('type', trip.type);
            if (!type && trip.type) {
                await this._typeService.add({ type: trip.type! } as IType);
            }
        }
      }
}