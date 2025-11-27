import { IActionRecord } from './action-record.interface';

export interface IExpense extends IActionRecord {
  id?: number; // Auto-incremented by Dexie
  date: string; // ISO date string or yyyy-mm-dd
  name?: string;
  amount: number;
  category: string;
  note?: string;
}
