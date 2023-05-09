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
import { Spreadsheet } from '@models/spreadsheet.model';
import { SpreadsheetService } from './spreadsheet.service';
import { WeekdayHelper } from '@helpers/weekday.helper';
import { WeekdayService } from './weekday.service';
import { SheetHelper } from '@helpers/sheet.helper';
import { AddressModel } from '@models/address.model';
import { NameModel } from '@models/name.model';
import { MatSnackBar } from '@angular/material/snack-bar';
import { INote } from '@interfaces/note.interface';
import { IName } from '@interfaces/name.interface';
import { IAddress } from '@interfaces/address.interface';

// https://medium.com/@bluesmike/how-i-implemented-angular8-googlesheets-crud-8883ac3cb6d8
// https://www.npmjs.com/package/google-spreadsheet
// https://theoephraim.github.io/node-google-spreadsheet/#/

@Injectable()
export class GoogleSheetService {
    data: any = null;
    doc: GoogleSpreadsheet | undefined;

    constructor(
            public http: HttpClient,
            private _snackBar: MatSnackBar,
            private _addressService: AddressService,
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

        await doc.useServiceAccountAuth({client_email: environment.client_email, private_key: environment.private_key});
        await doc.loadInfo();

        //const sheet = await doc.addSheet({ title: 'test2', headerValues: ['={"Address";SORT(UNIQUE({Trips!Q2:Q}))}', '=ARRAYFORMULA(IFS(ROW($A:$A)=1,"Visits",ISBLANK($A:$A), "",true,COUNTIF(Trips!P:P,$A:$A)+COUNTIF(Trips!Q:Q,$A:$A)))'] });
    }

    public async getSheetDataById(id: number): Promise<GoogleSpreadsheetWorksheet> {
        const spreadsheetId = (await this._spreadsheetService.querySpreadsheets("default", "true"))[0].id;
        const doc = new GoogleSpreadsheet(spreadsheetId);

        await doc.useServiceAccountAuth({client_email: environment.client_email, private_key: environment.private_key});
        await doc.loadInfo();

        const sheet = doc.sheetsById[id];
        // console.log(sheet.title);
        // console.log(sheet.rowCount);

        return sheet;
    }

    public async getSheetDataByName(name: string): Promise<GoogleSpreadsheetWorksheet> {
        const spreadsheetId = (await this._spreadsheetService.querySpreadsheets("default", "true"))[0].id;
        const doc = new GoogleSpreadsheet(spreadsheetId);

        await doc.useServiceAccountAuth({client_email: environment.client_email, private_key: environment.private_key});
        await doc.loadInfo();

        const sheet = doc.sheetsByTitle[name];
        // console.log(sheet.title);
        // console.log(sheet.rowCount);

        return sheet;
    }

    public async getSheetTitle(sheetId: string): Promise<string> {
        let doc = new GoogleSpreadsheet(sheetId);
        //console.log(sheetId);
        await doc.useServiceAccountAuth({client_email: environment.client_email, private_key: environment.private_key});

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
        await this.doc.useServiceAccountAuth({client_email: environment.client_email, private_key: environment.private_key});
        await this.doc.loadInfo();
        let sheets = SheetHelper.getSheetNames(this.doc);
        // TODO - Check to make sure necessary sheets exist on spreadsheet.

        let sheet, rows;

        let spreadsheet = new Spreadsheet;
        spreadsheet.id = spreadsheetId;
        spreadsheet.name = this.doc.title;
        spreadsheet.default = "false";

        // Set as default if only one
        if ((await this._spreadsheetService.getSpreadsheets()).length === 0 || defaultSpreadsheet?.id === spreadsheetId) {
            spreadsheet.default = "true"
        }
        await this._spreadsheetService.update(spreadsheet);

        await this.loadSheetData("Addresses");
        await this.loadSheetData("Names");
        await this.loadSheetData("Places");
        await this.loadSheetData("Services");
        await this.loadSheetData("Shifts");
        await this.loadSheetData("Trips");
        await this.loadSheetData("Weekdays");

        // Update addresses with names, names with addresses, and places with addresses.
        this._snackBar.open("Linking Data");
        
        // Load data needed.
        let trips = await this._tripService.getRemoteTrips();
        let places = await this._placeService.getRemotePlaces();
        let names = await this._nameService.getRemoteNames();
        let addresses = await this._addressService.getRemoteAddresses();
        
        trips.forEach(async trip => {
            let note = {} as INote;

            // If trip note exists create it.
            if (trip.note) {
                note.date = trip.date;
                note.text = trip.note;
                note.name = trip.name;
                note.address = trip.endAddress;
            }

            // Add addresses to name
            let name = names.find(name => name.name === trip.name);

            if (name && trip.endAddress) {
                let nameAddress = name.addresses.find(x => x.address === trip.endAddress);
                let address = addresses.find(address => address.address === trip.endAddress);

                if(!nameAddress && address) {
                    let basicAddress = {} as IAddress;
                    basicAddress.id = address.id;
                    basicAddress.address = address.address;
                    basicAddress.pay = address.pay;
                    basicAddress.tip = address.tip;

                    name.addresses.push(basicAddress);
                    this._nameService.update(name);
                }
            }

            // Add note to name
            if (name && trip.note) {
                name.notes.push(note);
                this._nameService.update(name!);
            }

            // Add name to address
            let address = addresses.find(address => address.address === trip.endAddress);

            if (address && trip.name) {
                let addressName = address.names.find(x => x.name === trip.name);
                let name = names.find(name => name.name === trip.name);

                if (!addressName && name) {
                    let basicName = {} as IName;
                    basicName.id = name.id;
                    basicName.name = name.name;
                    basicName.pay = name.pay;
                    basicName.tip = name.tip;

                    address.names.push(name);
                    this._addressService.update(address);
                }
            }

            // Add note to address.
            if (address && trip.note) {
                address.notes.push(note);
                this._addressService.update(address!);
            }

            // Add address to place
            let place = places.find(place => place.place === trip.place);
            if (place && trip.startAddress && !place.addresses.includes(trip.startAddress)) {
                // console.log(`Adding ${trip.startAddress} to ${place.place}`);
                place.addresses.push(trip.startAddress);
                place.addresses = [...new Set(place.addresses)].sort();
                this._placeService.update(place!);    
            }
            
        });

        this._snackBar.open("Spreadsheet Data Loaded");
    }

    private async loadSheetData(sheetName: string) {
        let sheet = this.doc?.sheetsByTitle[sheetName];
        if (!sheet) {
            this._snackBar.open(`${sheetName} Not Found`);
            return;
        }

        let rows = await sheet.getRows();
        this._snackBar.open(`Loading ${sheetName}`);

        switch (sheetName) {
            case "Address":
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
                break;
            case "Weekdays":
                await this._weekdayService.loadWeekdays(WeekdayHelper.translateSheetData(rows));
                break;
            default:
                this._snackBar.open(`${sheetName} Not Found`);
                break;
        }
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

            shift.saved = "true";
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
                Service: trip.service.trim(),
                '#': trip.number, 
                Place: trip.place.trim(),
                Pickup: trip.pickupTime.trim(),
                Dropoff: trip.dropoffTime.trim(),
                Pay: trip.pay,
                Tip: trip.tip ?? "",
                Bonus: trip.bonus ?? "",
                Cash: trip.cash ?? "",
                Name: trip.name.trim(),
                'Start Address': trip.startAddress.trim(),
                'End Address': trip.endAddress.trim(),
                Note: trip.note.trim()
            });

            trip.saved = "true";
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

        await doc.useServiceAccountAuth({client_email: environment.client_email, private_key: environment.private_key});
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

        await doc.useServiceAccountAuth({client_email: environment.client_email, private_key: environment.private_key});
        await doc.loadInfo();
        // console.log(doc.title);

        let sheet = doc.sheetsByTitle[sheetName];

        await sheet.addRow(sheetRow);
    }
}