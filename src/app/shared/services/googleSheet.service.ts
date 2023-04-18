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
import { IShift } from '@interfaces/shift.interface';
import { ITrip } from '@interfaces/trip.interface';
import { WeekdayHelper } from '@helpers/weekday.helper';
import { WeekdayService } from './weekday.service';

// https://medium.com/@bluesmike/how-i-implemented-angular8-googlesheets-crud-8883ac3cb6d8
// https://www.npmjs.com/package/google-spreadsheet
// https://theoephraim.github.io/node-google-spreadsheet/#/

@Injectable()
export class GoogleSheetService {
    data: any = null;

    constructor(
            public http: HttpClient,
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
        console.log(sheet.title);
        console.log(sheet.rowCount);

        return sheet;
    }

    public async getSheetDataByName(name: string): Promise<GoogleSpreadsheetWorksheet> {
        const spreadsheetId = (await this._spreadsheetService.querySpreadsheets("default", "true"))[0].id;
        const doc = new GoogleSpreadsheet(spreadsheetId);

        await doc.useServiceAccountAuth({client_email: environment.client_email, private_key: environment.private_key});
        await doc.loadInfo();

        const sheet = doc.sheetsByTitle[name];
        console.log(sheet.title);
        console.log(sheet.rowCount);

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

        let doc = new GoogleSpreadsheet(spreadsheetId);
        await doc.useServiceAccountAuth({client_email: environment.client_email, private_key: environment.private_key});
        await doc.loadInfo();

        let sheet, rows;

        let spreadsheet = new Spreadsheet;
        spreadsheet.id = spreadsheetId;
        spreadsheet.name = doc.title;
        spreadsheet.default = "false";


        // Set as default if only one
        if ((await this._spreadsheetService.getSpreadsheets()).length === 0 || defaultSpreadsheet?.id === spreadsheetId) {
            spreadsheet.default = "true"
        }
        await this._spreadsheetService.update(spreadsheet);

        // Addresses
        sheet = doc.sheetsByTitle["Addresses"];
        rows = await sheet.getRows();
        let addresses = AddressHelper.translateSheetData(rows);
        await this._addressService.loadAddresses(addresses);

        // Names
        sheet = doc.sheetsByTitle["Names"];
        rows = await sheet.getRows();
        let names = NameHelper.translateSheetData(rows);
        await this._nameService.loadNames(names);

        // Places
        sheet = doc.sheetsByTitle["Places"];
        rows = await sheet.getRows();
        await this._placeService.loadPlaces(PlaceHelper.translateSheetData(rows));

        // Services
        sheet = doc.sheetsByTitle["Services"];
        rows = await sheet.getRows();
        await this._serviceService.loadServices(ServiceHelper.translateSheetData(rows));

        // Shifts
        sheet = doc.sheetsByTitle["Shifts"];
        rows = await sheet.getRows();
        let shifts = ShiftHelper.translateSheetData(rows);
        await this._shiftService.loadShifts(shifts);

        // Trips
        sheet = doc.sheetsByTitle["Trips"];
        rows = await sheet.getRows();
        let trips = TripHelper.translateSheetData(rows);
        await this._tripService.loadTrips(trips);

        // Weekdays
        sheet = doc.sheetsByTitle["Weekdays"];
        rows = await sheet.getRows();
        let weekdays = WeekdayHelper.translateSheetData(rows);
        await this._weekdayService.loadWeekdays(weekdays);

        // Update addresses with names and names with addresses.
        trips.forEach(async trip => {
            // Make sure both address & name exists
            if (!trip.name && !trip.endAddress) {
                return;
            }

            // Add address to name
            //let name = await this._nameService.findRemoteName(trip.name);
            let name = names.find(name => name.name === trip.name);
            if (!name) {
                return;
            }
            if (!name.addresses) {
                name.addresses = [];
            }
            name.addresses?.push(trip.endAddress);
            name.addresses = [...new Set(name.addresses)].sort();
            this._nameService.update(name!);

            // Add name to address
            let address = addresses.find(address => address.address === trip.endAddress);
            if (!address) {
                return;
            }
            if (!address.names) {
                address.names = [];
            }
            address.names?.push(trip.name);
            address.names = [...new Set(address.names)].sort();
            this._addressService.update(address!);
        });
    }

    public async commitShift(shift: IShift) {
        let shiftRow: ({ [header: string]: string | number | boolean; } | (string | number | boolean)[]);

        shiftRow = { 
            Date: shift.date, 
            Service: shift.service, 
            '#': shift.number 
        };
        
        shift.saved = "true";
        await this._shiftService.updateLocalShift(shift);

        await this.saveRowData("Shifts", shiftRow);
    }

    public async commitUnsavedShifts() {
        let shifts = await this._shiftService.queryLocalShifts("saved", "false");
        let shiftRows: ({ [header: string]: string | number | boolean; } | (string | number | boolean)[])[] = [];

        shifts.forEach(async shift => {
            shiftRows.push({ 
                Date: shift.date, 
                Service: shift.service, 
                '#': shift.number 
            });

            shift.saved = "true";
            await this._shiftService.updateLocalShift(shift);
        });

        await this.saveSheetData("Shifts", shiftRows);
    }

    public async commitTrip(trip: ITrip) {
        let tripRow: ({ [header: string]: string | number | boolean; } | (string | number | boolean)[]);

        tripRow = { 
            Date: trip.date, 
                Distance: trip.distance,
                Service: trip.service,
                '#': trip.number, 
                Pickup: trip.pickupTime,
                Place: trip.place,
                Name: trip.name,
                Pay: trip.pay,
                Tip: trip.tip ?? "",
                Bonus: trip.bonus ?? "",
                Cash: trip.cash ?? "",
                'Start Address': trip.startAddress,
                'End Address': trip.endAddress,
                Note: trip.note
        };
        
        trip.saved = "true";
        await this._tripService.updateLocalTrip(trip);

        await this.saveRowData("Trips", tripRow);
    }

    public async commitUnsavedTrips() {
        let trips = await this._tripService.queryLocalTrips("saved", "false");
        let tripRows: ({ [header: string]: string | number | boolean; } | (string | number | boolean)[])[] = [];

        trips.forEach(async trip => {
            tripRows.push({
                Date: trip.date, 
                Distance: trip.distance,
                Service: trip.service,
                '#': trip.number, 
                Place: trip.place,
                Pickup: trip.pickupTime,
                Pay: trip.pay,
                Tip: trip.tip ?? "",
                Bonus: trip.bonus ?? "",
                Cash: trip.cash ?? "",
                Name: trip.name,
                'Start Address': trip.startAddress,
                'End Address': trip.endAddress,
                Note: trip.note
            });

            trip.saved = "true";
            await this._tripService.updateLocalTrip(trip);
        });

        await this.saveSheetData("Trips", tripRows);
    }

    public async saveSheetData(sheetName: string, sheetRows: ({ [header: string]: string | number | boolean; } | (string | number | boolean)[])[]) {
        const spreadsheetId = (await this._spreadsheetService.querySpreadsheets("default", "true"))[0];
        
        if(!spreadsheetId) {
            return;
        }
        
        const doc = new GoogleSpreadsheet(spreadsheetId.id);

        await doc.useServiceAccountAuth({client_email: environment.client_email, private_key: environment.private_key});
        await doc.loadInfo();
        console.log(doc.title);

        let sheet = doc.sheetsByTitle[sheetName];

        await sheet.addRows(sheetRows);
    }

    public async saveRowData(sheetName: string, sheetRow: ({ [header: string]: string | number | boolean; } | (string | number | boolean)[])) {
        const spreadsheetId = (await this._spreadsheetService.querySpreadsheets("default", "true"))[0];
        
        if(!spreadsheetId) {
            return;
        }
        
        const doc = new GoogleSpreadsheet(spreadsheetId.id);

        await doc.useServiceAccountAuth({client_email: environment.client_email, private_key: environment.private_key});
        await doc.loadInfo();
        console.log(doc.title);

        let sheet = doc.sheetsByTitle[sheetName];

        await sheet.addRow(sheetRow);
    }
}