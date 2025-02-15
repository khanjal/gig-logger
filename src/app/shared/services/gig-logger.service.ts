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
import { IShift, updateShiftAction } from "@interfaces/shift.interface";
import { IWeekday } from "@interfaces/weekday.interface";
import { ISheetProperties } from "@interfaces/sheet-properties.interface";

// Services
import { AddressService } from "./address.service";
import { DeliveryService } from "./delivery.service";
import { NameService } from "./name.service";
import { PlaceService } from "./place.service";
import { ServiceService } from "./service.service";
import { ShiftService } from "./shift.service";
import { TripService } from "./trip.service";
import { WeekdayService } from "./weekday.service";
import { RegionService } from "./region.service";
import { TypeService } from "./type.service";
import { DailyService } from "./daily.service";
import { MonthlyService } from "./monthly.service";
import { WeeklyService } from "./weekly.service";
import { YearlyService } from "./yearly.service";
import { lastValueFrom } from "rxjs";

@Injectable()
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

    private setHeader(sheetId: string) {
        let headers = new HttpHeaders();
        headers = headers.set('Sheet-Id', sheetId);
        headers = headers.set('Content-Type', "application/json");
        return headers;
    }

    public async getSheetData(sheetId: string) {
        return this._http.get(`${this.apiUrl}/sheets/all`, { headers: this.setHeader(sheetId) });
    }

    public async getSheetSingle(sheetId: string, sheetName: string) {
        return this._http.get(`${this.apiUrl}/sheets/single/${sheetName}`, { headers: this.setHeader(sheetId) });
    }

    public async getSecondarySheetData(sheetId: string) {
        return this._http.get(`${this.apiUrl}/sheets/multiple?sheetName=names&sheetName=places&sheetName=trips`, { headers: this.setHeader(sheetId) });
    }

    public async warmupLambda(sheetId: string) {
        try {
            return lastValueFrom(this._http.get(`${this.apiUrl}/sheets/check`, { headers: this.setHeader(sheetId) }));
        } catch (error) {
            console.error('Error warming up Lambda:', error);
            // throw error;
            return null;
        }
    }

    public async healthCheck(sheetId: string) {
        return this._http.get(`${this.apiUrl}/sheets/health`, { headers: this.setHeader(sheetId) });
    }

    public async postSheetData(sheetData: ISheet) {
        try {
            return lastValueFrom(this._http.post<any>(`${this.apiUrl}/sheets/save`, JSON.stringify(sheetData), { headers: this.setHeader(sheetData.properties.id) }));
        } catch (error) {
            console.error('Error posting sheet data:', error);
            // throw error;
            return null;
        }
    }

    public async createSheet(properties: ISheetProperties){
        return this._http.post<any>(`${this.apiUrl}/sheets/create`, JSON.stringify(properties), { headers: this.setHeader(properties.id) });
    }

    public async loadData(sheetData: ISheet) {
        await this._addressService.loadAddresses(sheetData.addresses);
        await this._dailyService.loadDaily(sheetData.daily);
        await this._monthlyService.loadMonthly(sheetData.monthly);
        await this._nameService.loadNames(sheetData.names);
        await this._placeService.loadPlaces(sheetData.places);
        await this._regionService.loadRegions(sheetData.regions);
        await this._serviceService.loadServices(sheetData.services);
        await this._shiftService.loadShifts(sheetData.shifts);
        await this._tripService.loadTrips(sheetData.trips);
        await this._typeService.loadTypes(sheetData.types);
        await this._weekdayService.loadWeekdays(sheetData.weekdays);
        await this._weeklyService.loadweekly(sheetData.weekly);
        await this._yearlyService.loadYearly(sheetData.yearly);

        await this.linkNameData();
        await this.linkAddressData();
        await this.linkPlaceData();

        await this._deliveryService.clear();
        await this.linkDeliveries(sheetData.trips);
    }

    public async appendData(sheetData: ISheet) {
        await this._addressService.updateAddresses(sheetData.addresses);
        await this._nameService.updateNames(sheetData.names);

        await this.linkDeliveries(sheetData.trips);
    }

    public async calculateShiftTotals(shifts: IShift[] = []) {
        if (!shifts.length) {
            shifts = await this._shiftService.getPreviousWeekShifts();
        }

        for (let shift of shifts) {
            let trips = await this._tripService.queryTrips("key", shift.key);
            let filteredTrips: ITrip[] = trips.filter(x => !x.exclude && x.action !== ActionEnum.Delete);

            shift.totalTrips = +(shift.trips ?? 0) + filteredTrips.length;
            shift.totalDistance = +(shift.distance ?? 0) + +filteredTrips.filter(x => x.distance != undefined).map((x) => x.distance).reduce((acc, value) => acc + value, 0);
            shift.totalPay = +(shift.pay ?? 0) + +filteredTrips.filter(x => x.pay != undefined).map((x) => x.pay).reduce((acc, value) => acc + value, 0);
            shift.totalTips = +(shift.tip ?? 0) + +filteredTrips.filter(x => x.tip != undefined).map((x) => x.tip).reduce((acc, value) => acc + value, 0);
            shift.totalBonus = +(shift.bonus ?? 0) + +filteredTrips.filter(x => x.bonus != undefined).map((x) => x.bonus).reduce((acc, value) => acc + value, 0);
            shift.totalCash = +(shift.cash ?? 0) + +filteredTrips.filter(x => x.cash != undefined).map((x) => x.cash).reduce((acc, value) => acc + value, 0);
            shift.grandTotal = +(shift.total ?? 0) + +filteredTrips.filter(x => x.total != undefined).map((x) => x.total).reduce((acc, value) => acc + value, 0);

            let duration = DateHelper.getDurationSeconds(shift.start, shift.finish);
            if (duration) {
                shift.amountPerTime = shift.grandTotal / DateHelper.getHoursFromSeconds(duration);
                shift.time = DateHelper.getDurationString(duration);
                updateShiftAction(shift, ActionEnum.Update);
            }

            if (trips?.length === 0 && !shift.saved) {
                this._shiftService.deleteShift(shift.id!);
            }
            else {
                await this._shiftService.updateShift(shift);
            }
        };

        let dates = [... new Set(shifts.map(x => x.date))];

        await this.calculateDailyTotal(dates);
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
            let weekday = (await this._weekdayService.queryWeekdays("day", dayOfWeek))[0];

            if (!weekday) {
                weekday = {} as IWeekday;
                weekday.day = dayOfWeek;
            }

            if (!weekday.currentAmount || weekday.currentAmount != shiftTotal) {
                weekday.currentAmount = shiftTotal;
                await this._weekdayService.updateWeekday(weekday);
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
        let names = await this._nameService.getNames();
        let trips = await this._tripService.getTrips();

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
                await this._nameService.update(name);
            };
            // console.log(`Name: ${name.name}`);
        };
    }

    private async linkAddressData () {
        let addresses = await this._addressService.getAddresses();
        let trips = await this._tripService.getTrips();

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
                await this._addressService.update(address)
            };
            // console.log(`Address: ${address.address}`);
        };
    }

    private async linkPlaceData() {
        let trips = await this._tripService.getTrips();
        let places = await this._placeService.getPlaces();

        for (let place of places) {
            // Addresses
            let tripPlaceAddresses = trips.filter(x => x.place === place.place && x.startAddress);

            for (const tripPlaceAddress of tripPlaceAddresses) {
                if (!place.addresses) {
                    place.addresses = [];
                }

                let placeAddress = place.addresses.find(x => x.address === tripPlaceAddress.startAddress);

                if (placeAddress) {
                    placeAddress.visits++;
                }
                else {
                    let address: IAddress = {} as IAddress;
                    address.address = tripPlaceAddress.startAddress;
                    address.visits = 1;
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
                    placeType.visits++;
                }
                else {
                    let type: IType = {} as IType;
                    type.type = tripPlaceType.type;
                    type.visits = 1;
                    place.types.push(type);    
                }
            };

            await this._placeService.update(place);
        };
    }
}