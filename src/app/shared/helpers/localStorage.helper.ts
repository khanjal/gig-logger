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