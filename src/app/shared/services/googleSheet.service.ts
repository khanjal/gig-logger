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

const doc = new GoogleSpreadsheet('1higrtVaDRpO3-uX92Fn3fJ5RtZ5dpqRI0CQf9eaDlg4'); // Real
//const doc = new GoogleSpreadsheet('14KaPezs9thWd3qMsMr8uZBoX5LNkPHjl1UPMFKYg3Dw'); // Test

// https://medium.com/@bluesmike/how-i-implemented-angular8-googlesheets-crud-8883ac3cb6d8
// https://www.npmjs.com/package/google-spreadsheet
// https://theoephraim.github.io/node-google-spreadsheet/#/

@Injectable()
export class GoogleDriveService {
    data: any = null;

    constructor(
            public http: HttpClient
        ) { }

    public async addSheet() {
        await doc.useServiceAccountAuth({client_email: environment.client_email, private_key: environment.private_key});
        await doc.loadInfo();

        // const sheet = await doc.addSheet({ title: 'test2', headerValues: ['={"Address";SORT(UNIQUE({Trips!Q2:Q}))}', '=ARRAYFORMULA(IFS(ROW($A:$A)=1,"Visits",ISBLANK($A:$A), "",true,COUNTIF(Trips!P:P,$A:$A)+COUNTIF(Trips!Q:Q,$A:$A)))'] });
    }

    public async getSheetDataById(id: number): Promise<GoogleSpreadsheetWorksheet> {
        await doc.useServiceAccountAuth({client_email: environment.client_email, private_key: environment.private_key});
        await doc.loadInfo();

        const sheet = doc.sheetsById[id];
        console.log(sheet.title);
        console.log(sheet.rowCount);

        return sheet;
    }

    public async getSheetDataByName(name: string): Promise<GoogleSpreadsheetWorksheet> {
        await doc.useServiceAccountAuth({client_email: environment.client_email, private_key: environment.private_key});
        await doc.loadInfo();

        const sheet = doc.sheetsByTitle[name];
        console.log(sheet.title);
        console.log(sheet.rowCount);

        return sheet;
    }

    public async loadRemoteData() {
        await doc.useServiceAccountAuth({client_email: environment.client_email, private_key: environment.private_key});
        await doc.loadInfo();

        let site: SiteModel = new SiteModel;
        let sheet, rows;

        // Addresses
        sheet = doc.sheetsByTitle["Addresses"];
        rows = await sheet.getRows();
        site.remote.addresses = AddressHelper.translateSheetData(rows);

        // Names
        sheet = doc.sheetsByTitle["Names"];
        rows = await sheet.getRows();
        site.remote.names = NameHelper.translateSheetData(rows);

        // Places
        sheet = doc.sheetsByTitle["Places"];
        rows = await sheet.getRows();
        site.remote.places = PlaceHelper.translateSheetData(rows);

        // Services
        sheet = doc.sheetsByTitle["Services"];
        rows = await sheet.getRows();
        site.remote.services = ServiceHelper.translateSheetData(rows);

        // Shifts
        sheet = doc.sheetsByTitle["Shifts"];
        rows = await sheet.getRows();
        let shifts = ShiftHelper.translateSheetData(rows);
        site.remote.shifts = ShiftHelper.getPastShifts(7, shifts);

        // Trips
        sheet = doc.sheetsByTitle["Trips"];
        rows = await sheet.getRows();
        let trips = TripHelper.translateSheetData(rows);
        site.remote.trips = TripHelper.getPastTrips(7, trips);
        // console.log(site.remote.trips);

        LocalStorageHelper.updateRemoteData(site);
    }

    public async saveLocalData() {
        await doc.useServiceAccountAuth({client_email: environment.client_email, private_key: environment.private_key});
        await doc.loadInfo();
        console.log(doc.title);

        let data = LocalStorageHelper.getSiteData();
        let sheet: GoogleSpreadsheetWorksheet;
        
        sheet = doc.sheetsByTitle["Shifts"];
        let shiftRows: ({ [header: string]: string | number | boolean; } | (string | number | boolean)[])[] = [];
        data.local.shifts.forEach(async shift => {
            shiftRows.push({ 
                Date: shift.date, 
                Service: shift.service, 
                '#': shift.shiftNumber 
            });
        });

        await sheet.addRows(shiftRows);
        // try {
        //     await sheet.addRows(shiftRows);
        // } catch (error) {
        //     console.log(error);
        // }
        

        sheet = doc.sheetsByTitle["Trips"];
        let tripRows: ({ [header: string]: string | number | boolean; } | (string | number | boolean)[])[] = [];
        data.local.trips.forEach(async trip => {
            tripRows.push({
                Date: trip.date, 
                Service: trip.service,
                '#': trip.shiftNumber, 
                Place: trip.place,
                Pickup: trip.time,
                Pay: trip.pay,
                Tip: trip.tip ?? "",
                Bonus: trip.bonus ?? "",
                Cash: trip.cash ?? "",
                Name: trip.name,
                'End Address': trip.address
            });
        });
        await sheet.addRows(tripRows);
        // try {
        //     await sheet.addRows(tripRows);
        // } catch (error) {
        //     console.log(error);
        // }
        

        
    }
}