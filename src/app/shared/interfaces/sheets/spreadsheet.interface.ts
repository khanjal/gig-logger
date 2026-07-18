export interface ISpreadsheet {
    id: string;
    name: string;
    default: string;
    size: number;
    // 'lambda' (Direct Service) | 's3' (Cloud Storage) - indicates where the sheet payload was obtained from
    source?: string;
}