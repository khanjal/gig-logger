import type { IGigSheets } from "@interfaces/sheets/gig-sheets.interface";
import type { IMessage } from "@interfaces/sheets/message.interface";
import type { ISheetProperties } from "@interfaces/sheets/sheet-properties.interface";

export interface ISheet {
    properties: ISheetProperties;
    sheets: IGigSheets;
    messages: IMessage[];
}
