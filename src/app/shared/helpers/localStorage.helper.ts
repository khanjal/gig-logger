import { SiteModel } from "../models/site.model";

export class LocalStorageHelper {
    static getSiteData(): SiteModel {
        let data = localStorage.getItem('gigs') ?? '""';
        let siteData: SiteModel = JSON.parse(data) as SiteModel;

        //console.log(siteData);
        if (!siteData.remote) {
            siteData = new SiteModel();
        }

        return siteData;
    }

    static getSpreadsheetId(): string {
        let siteData = this.getSiteData();

        return siteData.sheetId;
    }

    static getDataSize(): number {
        return (localStorage.getItem('gigs') ?? '""').length;
    }

    static formatBytes(bytes: number, decimals = 2) {
        if (!+bytes) return '0 Bytes'
    
        const k = 1024
        const dm = decimals < 0 ? 0 : decimals
        const sizes = ['Bytes', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB']
    
        const i = Math.floor(Math.log(bytes) / Math.log(k))
    
        return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
    }

    static updateLocalData(data: SiteModel) {
        // Get current data
        let localData = localStorage.getItem('gigs') ?? '""';
        let local: SiteModel = JSON.parse(localData);

        if(local) {
            local.local = data.local;
        }

        // Load gigs into storage
        localStorage.setItem('gigs', JSON.stringify(local));
    }

    static updateRemoteData(data: SiteModel) {
        // Get current data
        let localData = localStorage.getItem('gigs') ?? '""';
        let local: SiteModel = JSON.parse(localData);

        if(local) {
            data.lastUpdate = local.lastUpdate;
            data.local = local.local;
        }

        // Load gigs into storage
        localStorage.setItem('gigs', JSON.stringify(data));
    }
}