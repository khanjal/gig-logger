import type { IMessage } from "@interfaces/message.interface";

/**
 * Raw wire-format response from the sheet endpoints — either the sheet data is
 * returned directly (sheetEntity) or as an S3 link for large payloads.
 */
export interface ISheetApiResponse {
    isStoredInS3?: boolean;
    s3Link?: string;
    sheetEntity?: { messages?: IMessage[]; _source?: string };
    _source?: string;
}
