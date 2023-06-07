import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { IAddress } from "@interfaces/address.interface";
import { ISheet } from "@interfaces/sheet.interface";
import { Observable } from "dexie";
import { map } from "rxjs";

@Injectable()
export class GigLoggerService {
    apiUrl = "https://atftzfc4p0.execute-api.us-east-1.amazonaws.com/staging/sheet/";


    constructor(private _http: HttpClient) {}

    public async getSheetData(sheetId: string | undefined) {
        this._http.get(`${this.apiUrl}${sheetId}/primary`).subscribe(
            (data) => {
                let sheet = {} as ISheet;

                sheet = <ISheet>data;
                //console.log(data["Addresses"])
                console.log(sheet);
                return data;
            }
        );
    }
}