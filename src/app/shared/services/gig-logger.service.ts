import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";

@Injectable()
export class GigLoggerService {
    apiUrl = "https://atftzfc4p0.execute-api.us-east-1.amazonaws.com/staging/sheet/";


    constructor(private http: HttpClient) {}

    public async getSheetData(sheetId: string | undefined) {
        let sheetData = this.http.get(`${this.apiUrl}${sheetId}/primary`);
        console.log(sheetData);
    }

}