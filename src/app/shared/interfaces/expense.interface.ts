export interface IExpense {
  id?: number; // Auto-incremented by Dexie
  date: string; // ISO date string or yyyy-mm-dd
  amount: number;
  category: string;
  note?: string;
  action?: string;
  actionTime?: number;
}
