import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { environment } from "src/environments/environment";

// Interfaces
import { ISheet } from "@interfaces/sheet.interface";
import { IDelivery } from "@interfaces/delivery.interface";
import { INote } from "@interfaces/note.interface";
import { ITrip } from "@interfaces/trip.interface";
import { IType } from "@interfaces/type.interface";
import { IAddress } from "@interfaces/address.interface";

// Helpers
import { AddressHelper } from "@helpers/address.helper";
import { DateHelper } from "@helpers/date.helper";

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
import { sort } from "@helpers/sort.helper";
import { DateAdapter } from "@angular/material/core";

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

    public async getSheetData(sheetId: string) {
        return this._http.get(`${this.apiUrl}${sheetId}/primary`);
    }

    public async getSecondarySheetData(sheetId: string) {
        return this._http.get(`${this.apiUrl}${sheetId}/secondary`);
    }

    public async warmupLambda(sheetId: string) {
        return this._http.get(`${this.apiUrl}${sheetId}/warmup`);
    }

    public async postSheetData(sheetData: ISheet, sheetId: string) {
        return this._http.post<any>(`${this.apiUrl}${sheetId}/trips`, JSON.stringify(sheetData));
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

    public async calculateShiftTotals() {
        let shifts = await this._shiftService.getPreviousWeekShifts();

        shifts.forEach(async shift => {
            let trips = (await this._tripService.queryTrips("key", shift.key));
            let filteredTrips = trips.filter(x => !x.exclude);

            shift.totalTrips = shift.trips + filteredTrips.length;
            shift.grandTotal = shift.total;
            shift.grandTotal += (filteredTrips.filter(x => x.total).map((x) => x.total).reduce((acc, value) => acc + value, 0));

            if (trips?.length === 0 && !shift.saved) {
                this._shiftService.deleteLocal(shift.id!);
            }
            else {
                await this._shiftService.updateShift(shift);
            }
        });

        await this.calculateDailyTotal();
    }

    public async calculateDailyTotal() {
        let date = DateHelper.getStartOfWeekDate(new Date);
        let shifts = await this._shiftService.getShiftsByStartDate(date);
        let dates = [... new Set(shifts.flatMap(x => x.date))];

        dates.forEach(async date => {
            let shiftTotal = shifts.filter(x => x.date === date).map(x => x.grandTotal).reduce((acc, value) => acc + value, 0);

            let dayOfWeek = DateHelper.getDayOfWeek(new Date(DateHelper.getDateFromISO(date)));
            let weekday = (await this._weekdayService.queryWeekdays("day", dayOfWeek))[0];

            if (weekday && weekday.currentAmount != shiftTotal) {
                weekday.currentAmount = shiftTotal;
                await this._weekdayService.updateWeekday(weekday);
            }
        });
    }

    public async linkDeliveries(trips: ITrip[]) {
        let deliveries: IDelivery[] = await this._deliveryService.getRemoteDeliveries();
        console.log('Linking Trip Data');

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
        let names = await this._nameService.getRemoteNames();
        let trips = await this._tripService.getRemoteTrips();

        names.forEach(async name => {
            let addressTrips = trips.filter(x => x.name === name.name && x.endAddress);
            
            // Go through each trip and add addresses and notes
            addressTrips.forEach(async trip => {
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
            });
            // console.log(`Name: ${name.name}`);
        });
    }

    private async linkAddressData () {
        let addresses = await this._addressService.getRemoteAddresses();
        let trips = await this._tripService.getRemoteTrips();

        addresses.forEach(async address => {
            let nameTrips = trips.filter(x => x.endAddress === address.address && x.name);

            // Go through each trip and add addresses and notes
            nameTrips.forEach(async trip => {
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
            });
            // console.log(`Address: ${address.address}`);
        });
    }

    private async linkPlaceData() {
        let trips = await this._tripService.getRemoteTrips();
        let places = await this._placeService.getRemotePlaces();

        places.forEach(async place => {
            // Addresses
            let tripPlaceAddresses = trips.filter(x => x.place === place.place && x.startAddress);

            tripPlaceAddresses.forEach(tripPlaceAddress => {
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
            });

            sort(place.addresses, 'address');

            // Types
            let tripPlaceTypes = trips.filter(x => x.place === place.place && x.type);

            tripPlaceTypes.forEach(tripPlaceType => {
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
            });

            await this._placeService.update(place);
        });
    }
}