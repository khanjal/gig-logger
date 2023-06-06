import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { ISheet } from "@interfaces/sheet.interface";
import { Observable } from "dexie";

@Injectable()
export class GigLoggerService {
    apiUrl = "https://atftzfc4p0.execute-api.us-east-1.amazonaws.com/staging/sheet/";


    constructor(private _http: HttpClient) {}

    public async getSheetData(sheetId: string | undefined) {
        return this._http.get<ISheet>(`${this.apiUrl}${sheetId}/primary`);
    }
}