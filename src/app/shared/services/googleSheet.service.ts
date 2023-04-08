import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { GoogleSpreadsheet, GoogleSpreadsheetWorksheet, ServiceAccountCredentials } from 'google-spreadsheet';
import { SiteModel } from '../models/site.model';
import { AddressHelper } from '../helpers/address.helper';
import { NameHelper } from '../helpers/name.helper';
import { PlaceHelper } from '../helpers/place.helper';
import { ServiceHelper } from '../helpers/service.helper';
import { ShiftHelper } from '../helpers/shift.helper';
import { TripHelper } from '../helpers/trip.helper';
import { LocalStorageHelper } from '../helpers/localStorage.helper';

import { environment } from '../../../environments/environment';
import { ShiftService } from './shift.service';
import { TripService } from './trip.service';
import { AddressService } from './address.service';
import { NameService } from './name.service';
import { PlaceService } from './place.service';
import { ServiceService } from './service.service';

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
            private _shfitService: ShiftService,
            private _tripService: TripService
        ) { }

    public async addSheet() {
        const spreadsheetId = LocalStorageHelper.getSpreadsheetId();
        const doc = new GoogleSpreadsheet(spreadsheetId);

        await doc.useServiceAccountAuth({client_email: environment.client_email, private_key: environment.private_key});
        await doc.loadInfo();

        //const sheet = await doc.addSheet({ title: 'test2', headerValues: ['={"Address";SORT(UNIQUE({Trips!Q2:Q}))}', '=ARRAYFORMULA(IFS(ROW($A:$A)=1,"Visits",ISBLANK($A:$A), "",true,COUNTIF(Trips!P:P,$A:$A)+COUNTIF(Trips!Q:Q,$A:$A)))'] });
    }

    public async getSheetDataById(id: number): Promise<GoogleSpreadsheetWorksheet> {
        const spreadsheetId = LocalStorageHelper.getSpreadsheetId();
        const doc = new GoogleSpreadsheet(spreadsheetId);

        await doc.useServiceAccountAuth({client_email: environment.client_email, private_key: environment.private_key});
        await doc.loadInfo();

        const sheet = doc.sheetsById[id];
        console.log(sheet.title);
        console.log(sheet.rowCount);

        return sheet;
    }

    public async getSheetDataByName(name: string): Promise<GoogleSpreadsheetWorksheet> {
        const spreadsheetId = LocalStorageHelper.getSpreadsheetId();
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

    public async loadRemoteData(spreadsheetId: string) {
        let doc = new GoogleSpreadsheet(spreadsheetId);
        await doc.useServiceAccountAuth({client_email: environment.client_email, private_key: environment.private_key});
        await doc.loadInfo();

        let site: SiteModel = new SiteModel;
        let sheet, rows;

        site.sheetId = spreadsheetId;
        site.sheetName = doc.title;

        // Addresses
        sheet = doc.sheetsByTitle["Addresses"];
        rows = await sheet.getRows();
        // site.remote.addresses = AddressHelper.translateSheetData(rows);
        await this._addressService.loadAddresses(AddressHelper.translateSheetData(rows));

        // Names
        sheet = doc.sheetsByTitle["Names"];
        rows = await sheet.getRows();
        // site.remote.names = NameHelper.translateSheetData(rows);
        await this._nameService.loadNames(NameHelper.translateSheetData(rows));

        // Places
        sheet = doc.sheetsByTitle["Places"];
        rows = await sheet.getRows();
        // site.remote.places = PlaceHelper.translateSheetData(rows);
        await this._placeService.loadPlaces(PlaceHelper.translateSheetData(rows));

        // Services
        sheet = doc.sheetsByTitle["Services"];
        rows = await sheet.getRows();
        // site.remote.services = ServiceHelper.translateSheetData(rows);
        await this._serviceService.loadServices(ServiceHelper.translateSheetData(rows));

        // Shifts
        sheet = doc.sheetsByTitle["Shifts"];
        rows = await sheet.getRows();
        let shifts = ShiftHelper.translateSheetData(rows);
        site.remote.shifts = ShiftHelper.getPastShifts(7, shifts);
        await this._shfitService.loadShifts(shifts);

        // Trips
        sheet = doc.sheetsByTitle["Trips"];
        rows = await sheet.getRows();
        let trips = TripHelper.translateSheetData(rows);
        site.remote.trips = TripHelper.getPastTrips(7, trips);
        await this._tripService.loadTrips(trips);
        // console.log(site.remote.trips);

        LocalStorageHelper.updateRemoteData(site);
    }

    public async saveLocalData() {
        let data = LocalStorageHelper.getSiteData();

        let shiftRows: ({ [header: string]: string | number | boolean; } | (string | number | boolean)[])[] = [];
        data.local.shifts.forEach(async shift => {
            if (shift.saved) {
                return;
            }

            shiftRows.push({ 
                Date: shift.date, 
                Service: shift.service, 
                '#': shift.number 
            });

            shift.saved = true;
        });

        await this.saveSheetData("Shifts", shiftRows);
        // try {
        //     await sheet.addRows(shiftRows);
        // } catch (error) {
        //     console.log(error);
        // }
        

        let tripRows: ({ [header: string]: string | number | boolean; } | (string | number | boolean)[])[] = [];
        data.local.trips.forEach(async trip => {
            if (trip.saved) {
                return;
            }

            tripRows.push({
                Date: trip.date, 
                Service: trip.service,
                '#': trip.number, 
                Place: trip.place,
                Pickup: trip.time,
                Pay: trip.pay,
                Tip: trip.tip ?? "",
                Bonus: trip.bonus ?? "",
                Cash: trip.cash ?? "",
                Name: trip.name,
                'End Address': trip.endAddress,
                Note: trip.note
            });

            trip.saved = true;
        });

        await this.saveSheetData("Trips", tripRows);
        // try {
        //     await sheet.addRows(tripRows);
        // } catch (error) {
        //     console.log(error);
        // }
        
        LocalStorageHelper.updateLocalData(data);
        
    }

    public async saveSheetData(sheetName: string, sheetRows: ({ [header: string]: string | number | boolean; } | (string | number | boolean)[])[]) {
        const spreadsheetId = LocalStorageHelper.getSpreadsheetId();
        const doc = new GoogleSpreadsheet(spreadsheetId);

        await doc.useServiceAccountAuth({client_email: environment.client_email, private_key: environment.private_key});
        await doc.loadInfo();
        console.log(doc.title);

        let sheet = doc.sheetsByTitle[sheetName];

        await sheet.addRows(sheetRows);
    }
}