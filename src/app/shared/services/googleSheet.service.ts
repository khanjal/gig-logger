import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { JWT } from 'google-auth-library';

import keys from '../data/jwt.keys.json';

@Injectable()
export class GoogleDriveService {
    data: any = null;

    constructor(public http: HttpClient) { }

    public async getGoogleData() {
        const client = new JWT({
            email: keys.client_email,
            key: keys.private_key,
            scopes: ['https://www.googleapis.com/auth/cloud-platform'],
        });
        const url = `https://dns.googleapis.com/dns/v1/projects/${keys.project_id}`;
        const res = await client.request({url});
        console.log(res.data);
        console.log(keys);
    }


    // public getGoogleData() {
    //     //const sheetId = '2PACX-1vT4hWkgwve_E3c_LYCrPhIsVRNnlVnaZiKvn_zZTtfgZodikyJ_GVvchAtu17akW9zj3BFfJ4E9TOEx';
    //     const sheetId = '15Kndr-OcyCUAkBUcq6X3BMqKa_y2fMAXfPFLiSACiys';
    //     const url = `https://spreadsheets.google.com/feeds/list/${sheetId}/od6/public/values?alt=json`;

    //     this.http.get<any>(url).subscribe({
    //     next: data => {
    //         console.log(data);
    //     },
    //     error: error => {
    //         let errorMessage = error.message;
    //         console.error('There was an error!', error);
    //     }
    // })
    // }

    public getSheetData(): Observable<any> {
        const sheetId = '2PACX-1vT4hWkgwve_E3c_LYCrPhIsVRNnlVnaZiKvn_zZTtfgZodikyJ_GVvchAtu17akW9zj3BFfJ4E9TOEx';
        const url = `https://spreadsheets.google.com/feeds/list/${sheetId}/od6/public/values?alt=json`;

        return this.http.get(url)
        .pipe(
            map((res: any) => {
                const data = res.feed.entry;

                const returnArray: Array<any> = [];
                if (data && data.length > 0) {
                    data.forEach((entry: any) => {
                        console.log(entry);
                        const obj = {};
                        for (const x in entry) {
                            if (x.includes('gsx$') && entry[x].$t) {
                                //obj[x.split('$')[1]] = entry[x]['$t'];
                            }
                        }
                    
                        returnArray.push(obj);
                });
            }
            return returnArray;
            })
        );
    }
}