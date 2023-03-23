import { SheetModel } from "./sheet.model";

export class SiteModel {
    local: SheetModel = new SheetModel;
    remote: SheetModel = new SheetModel;
    lastUpdate: Date = new Date;
}