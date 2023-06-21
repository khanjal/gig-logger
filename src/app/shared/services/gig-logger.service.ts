import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { ISheet } from "@interfaces/sheet.interface";
import { AddressService } from "./address.service";
import { DeliveryService } from "./delivery.service";
import { NameService } from "./name.service";
import { PlaceService } from "./place.service";
import { ServiceService } from "./service.service";
import { ShiftService } from "./shift.service";
import { SpreadsheetService } from "./spreadsheet.service";
import { TripService } from "./trip.service";
import { WeekdayService } from "./weekday.service";
import { IDelivery } from "@interfaces/delivery.interface";
import { INote } from "@interfaces/note.interface";
import { ITrip } from "@interfaces/trip.interface";
import { RegionService } from "./region.service";

@Injectable()
export class GigLoggerService {
    apiUrl = "https://atftzfc4p0.execute-api.us-east-1.amazonaws.com/staging/sheet/";


    constructor(
        private _http: HttpClient,
        private _addressService: AddressService,
        private _deliveryService: DeliveryService,
        private _nameService: NameService,
        private _placeService: PlaceService,
        private _regionService: RegionService,
        private _serviceService: ServiceService,
        private _shiftService: ShiftService,
        private _spreadsheetService: SpreadsheetService,
        private _tripService: TripService,
        private _weekdayService: WeekdayService
    ) {}

    public async getSheetData(sheetId: string) {
        return this._http.get(`${this.apiUrl}${sheetId}/primary`);
    }

    public async postSheetData(sheetData: ISheet, sheetId: string) {
        return this._http.post<any>(`${this.apiUrl}${sheetId}/trips`, JSON.stringify(sheetData));
    }

    public async loadData(sheetData: ISheet) {
        await this._addressService.loadAddresses(sheetData.addresses);
        await this._nameService.loadNames(sheetData.names);
        await this._placeService.loadPlaces(sheetData.places);
        await this._regionService.load(sheetData.regions);
        await this._serviceService.loadServices(sheetData.services);
        await this._shiftService.loadShifts(sheetData.shifts);
        await this._tripService.loadTrips(sheetData.trips);
        await this._weekdayService.loadWeekdays(sheetData.weekdays);

        await this.linkNameData();
        await this.linkAddressData();
        await this.linkPlaceData();
        await this.linkDeliveries(sheetData.trips);
    }

    public async appendData(sheetData: ISheet) {
        await this._addressService.updateAddresses(sheetData.addresses);
        await this._nameService.updateNames(sheetData.names);
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
                delivery.total += trip.total;
                delivery.visits++;

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
            let placeAddresses = trips.filter(x => x.place === place.place && x.startAddress);

            placeAddresses.forEach(placeAddress => {
                if (!place.addresses) {
                    place.addresses = [];
                }

                place.addresses.push(placeAddress.startAddress);
            });

            place.addresses = [...new Set(place.addresses)].sort();
            await this._placeService.update(place);
        });
    }
}