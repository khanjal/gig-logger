export interface ISpreadsheet {
    id: string;
    name: string;
    default: string;
    size: number;
    // 'lambda' | 's3' - indicates where the sheet payload was obtained from
    source?: string;
}