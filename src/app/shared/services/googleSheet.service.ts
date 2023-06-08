import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { GoogleSpreadsheet, GoogleSpreadsheetWorksheet, ServiceAccountCredentials } from 'google-spreadsheet';
import { AddressHelper } from '../helpers/address.helper';
import { NameHelper } from '../helpers/name.helper';
import { PlaceHelper } from '../helpers/place.helper';
import { ServiceHelper } from '../helpers/service.helper';
import { ShiftHelper } from '../helpers/shift.helper';
import { TripHelper } from '../helpers/trip.helper';

import { environment } from '../../../environments/environment';
import { ShiftService } from './shift.service';
import { TripService } from './trip.service';
import { AddressService } from './address.service';
import { NameService } from './name.service';
import { PlaceService } from './place.service';
import { ServiceService } from './service.service';
import { SpreadsheetService } from './spreadsheet.service';
import { WeekdayHelper } from '@helpers/weekday.helper';
import { WeekdayService } from './weekday.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { INote } from '@interfaces/note.interface';
import { IDelivery } from '@interfaces/delivery.interface';
import { DeliveryService } from './delivery.service';
import { ITrip } from '@interfaces/trip.interface';
import { ISpreadsheet } from '@interfaces/spreadsheet.interface';

// https://medium.com/@bluesmike/how-i-implemented-angular8-googlesheets-crud-8883ac3cb6d8
// https://www.npmjs.com/package/google-spreadsheet
// https://theoephraim.github.io/node-google-spreadsheet/#/

@Injectable()
export class GoogleSheetService {
    data: any = null;
    doc: GoogleSpreadsheet | undefined;

    // clientEmail = environment.client_email;
    // privateKey = environment.private_key;

    clientEmail = "";
    privateKey = "";

    constructor(
            public http: HttpClient,
            private _snackBar: MatSnackBar,
            private _addressService: AddressService,
            private _deliveryService: DeliveryService,
            private _nameService: NameService,
            private _placeService: PlaceService,
            private _serviceService: ServiceService,
            private _shiftService: ShiftService,
            private _spreadsheetService: SpreadsheetService,
            private _tripService: TripService,
            private _weekdayService: WeekdayService
        ) { }

    public async addSheet() {
        const spreadsheetId = (await this._spreadsheetService.querySpreadsheets("default", "true"))[0].id;
        const doc = new GoogleSpreadsheet(spreadsheetId);

        await doc.useServiceAccountAuth({client_email: this.clientEmail, private_key: this.privateKey});
        await doc.loadInfo();

        //const sheet = await doc.addSheet({ title: 'test2', headerValues: ['={"Address";SORT(UNIQUE({Trips!Q2:Q}))}', '=ARRAYFORMULA(IFS(ROW($A:$A)=1,"Visits",ISBLANK($A:$A), "",true,COUNTIF(Trips!P:P,$A:$A)+COUNTIF(Trips!Q:Q,$A:$A)))'] });
    }

    public async getSheetDataById(id: number): Promise<GoogleSpreadsheetWorksheet> {
        const spreadsheetId = (await this._spreadsheetService.querySpreadsheets("default", "true"))[0].id;
        const doc = new GoogleSpreadsheet(spreadsheetId);

        await doc.useServiceAccountAuth({client_email: this.clientEmail, private_key: this.privateKey});
        await doc.loadInfo();

        const sheet = doc.sheetsById[id];
        // console.log(sheet.title);
        // console.log(sheet.rowCount);

        return sheet;
    }

    public async getSheetDataByName(name: string): Promise<GoogleSpreadsheetWorksheet> {
        const spreadsheetId = (await this._spreadsheetService.querySpreadsheets("default", "true"))[0].id;
        const doc = new GoogleSpreadsheet(spreadsheetId);

        await doc.useServiceAccountAuth({client_email: this.clientEmail, private_key: this.privateKey});
        await doc.loadInfo();

        const sheet = doc.sheetsByTitle[name];
        // console.log(sheet.title);
        // console.log(sheet.rowCount);

        return sheet;
    }

    public async getSheetTitle(sheetId: string): Promise<string> {
        let doc = new GoogleSpreadsheet(sheetId);
        //console.log(sheetId);
        await doc.useServiceAccountAuth({client_email: this.clientEmail, private_key: this.privateKey});

        try {
            await doc.loadInfo();

            // console.log(doc.title);
    
            return doc.title;    
        } catch (error) {
            return "";
        }
    }

    public async loadRemoteData() {
        let defaultSpreadsheet = (await this._spreadsheetService.querySpreadsheets("default", "true"))[0];
        let spreadsheetId = defaultSpreadsheet.id;

        if (!spreadsheetId) {
            return;
        }

        this.doc = new GoogleSpreadsheet(spreadsheetId);
        await this.doc.useServiceAccountAuth({client_email: this.clientEmail, private_key: this.privateKey});
        await this.doc.loadInfo();
        // let sheets = SheetHelper.getSheetNames(this.doc);
        // console.table(sheets);
        // TODO - Check to make sure necessary sheets exist on spreadsheet.

        let sheet, rows;

        let spreadsheet = {} as ISpreadsheet;
        spreadsheet.id = spreadsheetId;
        spreadsheet.name = this.doc.title;
        spreadsheet.default = "false";

        // Set as default if only one
        if ((await this._spreadsheetService.getSpreadsheets()).length === 0 || defaultSpreadsheet?.id === spreadsheetId) {
            spreadsheet.default = "true"
        }
        await this._spreadsheetService.update(spreadsheet);

        // Delete spreadsheetDB to reload.
        // this._spreadsheetService.deleteRemoteData();

        await this.loadSheetData("Addresses");
        await this.loadSheetData("Names");
        await this.loadSheetData("Places");
        await this.loadSheetData("Services");
        await this.loadSheetData("Shifts");
        await this.loadSheetData("Trips");
        await this.loadSheetData("Weekdays");

        this._snackBar.open("Linking Trip Data");
        await this.linkNameData();
        await this.linkAddressData();
        await this.linkPlaceData();
        await this.linkDeliveryData();

        console.log("Primary Spreadsheet Data Loaded");
        this._snackBar.open("Primary Spreadsheet Data Loaded");
    }

    private async loadSheetData(sheetName: string) {
        let sheet = this.doc?.sheetsByTitle[sheetName];
        if (!sheet) {
            this._snackBar.open(`${sheetName} Not Found`);
            return;
        }

        console.log(`Loading ${sheetName}`);

        let rows = await sheet.getRows();
        this._snackBar.open(`Loading ${sheetName}`);

        switch (sheetName) {
            case "Addresses":
                await this._addressService.loadAddresses(AddressHelper.translateSheetData(rows));
                break;
            case "Names":
                await this._nameService.loadNames(NameHelper.translateSheetData(rows));
                break;
            case "Places":
                await this._placeService.loadPlaces(PlaceHelper.translateSheetData(rows));
                break;
            case "Services":
                await this._serviceService.loadServices(ServiceHelper.translateSheetData(rows));
                break;
            case "Shifts":
                await this._shiftService.loadShifts(ShiftHelper.translateSheetData(rows));
                break;
            case "Trips":
                await this._tripService.loadTrips(TripHelper.translateSheetData(rows));
                await this._deliveryService.clear();
                break;
            case "Weekdays":
                await this._weekdayService.loadWeekdays(WeekdayHelper.translateSheetData(rows));
                break;
            default:
                this._snackBar.open(`${sheetName} Not Found`);
                break;
        }
    }

    private async updateSheetData(sheetName: string) {
        let sheet = this.doc?.sheetsByTitle[sheetName];
        if (!sheet) {
            this._snackBar.open(`${sheetName} Not Found`);
            return;
        }

        console.log(`Updating ${sheetName}`);

        let rows = await sheet.getRows();
        this._snackBar.open(`Updating ${sheetName}`);

        switch (sheetName) {
            case "Addresses":
                await this._addressService.updateAddresses(AddressHelper.translateSheetData(rows));
                break;
            case "Names":
                await this._nameService.updateNames(NameHelper.translateSheetData(rows));
                break;
            case "Places":
                await this._placeService.updatePlaces(PlaceHelper.translateSheetData(rows));
                break;
            case "Services":
                await this._serviceService.updateServices(ServiceHelper.translateSheetData(rows));
                break;
            default:
                this._snackBar.open(`${sheetName} Not Found`);
                break;
        }
    }

    public async loadSecondarySheetData() {
        // Load secondary sheet data;
        let secondarySheets = await this._spreadsheetService.querySpreadsheets("default", "false");
        secondarySheets.forEach(async secondarySheet => {
            if (!secondarySheet?.id) {
                console.log("Returning");
                return;
            }
            this._snackBar.open(`Loading Spreadsheet: ${secondarySheet.name}`);
            console.log(secondarySheet.name);

            this.doc = new GoogleSpreadsheet(secondarySheet.id);
            await this.doc.useServiceAccountAuth({client_email: this.clientEmail, private_key: this.privateKey});
            await this.doc.loadInfo();

            // Add basic data.
            await this.updateSheetData("Addresses");
            await this.updateSheetData("Names");
            // await this.updateSheetData("Places");
            // await this.updateSheetData("Services");

            // Get sheet trips.
            let sheet = this.doc?.sheetsByTitle["Trips"];
            let rows = await sheet.getRows();

            let trips = TripHelper.translateSheetData(rows);
            await this.linkDeliveryData(trips);
        });
    }

    private async linkDeliveryData(trips: ITrip[] = []) {
        // Update addresses with names, names with addresses, and places with addresses.
        this._snackBar.open("Linking Data");
                
        // Load data needed.
        if (trips.length === 0) {
            trips = await this._tripService.getRemoteTrips();
        }
        
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
                if (!name.addresses.includes(trip.endAddress)) {
                    name.addresses.push(trip.endAddress);
                }
                
                let note = {} as INote;
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
                if (!address.names.includes(trip.name)) {
                    address.names.push(trip.name);
                }

                let note = {} as INote;
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
                place.addresses.push(placeAddress.startAddress);
            });

            place.addresses = [...new Set(place.addresses)].sort();
            await this._placeService.update(place);
        });
    }

    public async commitUnsavedShifts() {
        let shifts = await this._shiftService.queryLocalShifts("saved", "false");
        let shiftRows: ({ [header: string]: string | number | boolean; } | (string | number | boolean)[])[] = [];

        // console.log('Unsaved shifts');
        // console.table(shifts);

        shifts.forEach(async shift => {
            // Delete empty shifts and continue to next
            if (shift?.id && shift?.total === 0 && shift?.trips === 0){
                // console.log('Deleting shift:');
                // console.table(shift);

                this._shiftService.deleteLocal(shift.id);
                return;
            }

            // console.log('Saving Shift:');
            // console.table(shift);

            shiftRows.push({ 
                Date: shift.date.trim(), 
                Service: shift.service.trim(),
                Start: shift.start,
                End: shift.end,
                '#': shift.number 
            });

            shift.saved = true;
            await this._shiftService.updateLocalShift(shift);
        });

        // Only save if there are shift rows.
        // TODO: Save shifts individually. 
        if (shiftRows.length) {
            await this.saveSheetData("Shifts", shiftRows);
        }
    }

    public async commitUnsavedTrips() {
        let trips = await this._tripService.queryLocalTrips("saved", "false");
        let tripRows: ({ [header: string]: string | number | boolean; } | (string | number | boolean)[])[] = [];

        // console.log('Unsaved trips:')
        // console.table(trips);

        trips.forEach(async trip => {
            tripRows.push({
                Date: trip.date.trim(), 
                Distance: trip.distance,
                Service: trip.service?.trim(),
                '#': trip.number, 
                Place: trip.place?.trim(),
                Pickup: trip.pickupTime?.trim(),
                Dropoff: trip.dropoffTime?.trim(),
                Pay: trip.pay,
                Tip: trip.tip ?? "",
                Bonus: trip.bonus ?? "",
                Cash: trip.cash ?? "",
                Name: trip.name?.trim(),
                'Start Address': trip.startAddress?.trim(),
                'End Address': trip.endAddress?.trim(),
                'End Unit': trip.endUnit?.trim(),
                'Order #': trip.orderNumber?.trim(),
                'Odo Start': trip.startOdometer,
                'Odo End': trip.endOdometer,
                Note: trip.note?.trim()
            });

            trip.saved = true;
            await this._tripService.updateLocalTrip(trip);
        });

        // Only save if there are trip rows.
        // TODO: Save trips individually.
        if (tripRows.length) {
            await this.saveSheetData("Trips", tripRows);
        }
    }

    public async saveSheetData(sheetName: string, sheetRows: ({ [header: string]: string | number | boolean; } | (string | number | boolean)[])[]) {
        const spreadsheetId = (await this._spreadsheetService.querySpreadsheets("default", "true"))[0];
        
        if(!spreadsheetId) {
            return;
        }
        
        const doc = new GoogleSpreadsheet(spreadsheetId.id);

        await doc.useServiceAccountAuth({client_email: this.clientEmail, private_key: this.privateKey});
        await doc.loadInfo();
        // console.log(doc.title);

        let sheet = doc.sheetsByTitle[sheetName];

        await sheet.addRows(sheetRows);
    }

    public async saveRowData(sheetName: string, sheetRow: ({ [header: string]: string | number | boolean; } | (string | number | boolean)[])) {
        const spreadsheetId = (await this._spreadsheetService.querySpreadsheets("default", "true"))[0];
        
        if(!spreadsheetId) {
            return;
        }
        this._snackBar.open(`Saving ${{sheetName}}`);

        const doc = new GoogleSpreadsheet(spreadsheetId.id);

        await doc.useServiceAccountAuth({client_email: this.clientEmail, private_key: this.privateKey});
        await doc.loadInfo();
        // console.log(doc.title);

        let sheet = doc.sheetsByTitle[sheetName];

        await sheet.addRow(sheetRow);
    }
}