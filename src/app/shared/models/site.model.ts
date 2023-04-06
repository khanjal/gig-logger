import { SheetModel } from "./sheet.model";

export class SiteModel {
    sheetId: string = '';
    sheetName: string = '';
    local: SheetModel = new SheetModel;
    remote: SheetModel = new SheetModel;
    lastUpdate: Date = new Date;
}