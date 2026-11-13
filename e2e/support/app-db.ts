import type { Page } from '@playwright/test';

// Reads rows straight out of the app's IndexedDB (Dexie database "spreadsheetDB") so a test
// asserts on what was really persisted, not on what the UI shows.
const SPREADSHEET_DB = 'spreadsheetDB';

export async function readTable<T = Record<string, unknown>>(page: Page, table: string): Promise<T[]> {
  return page.evaluate(([dbName, tableName]) => new Promise<unknown[]>((resolve, reject) => {
    const open = indexedDB.open(dbName);
    open.onerror = () => reject(open.error);
    open.onsuccess = () => {
      const db = open.result;
      try {
        const request = db.transaction(tableName, 'readonly').objectStore(tableName).getAll();
        request.onerror = () => { db.close(); reject(request.error); };
        request.onsuccess = () => { db.close(); resolve(request.result); };
      } catch (error) {
        // A missing object store throws here; reject rather than hang until the test times out.
        db.close();
        reject(error);
      }
    };
  }), [SPREADSHEET_DB, table]) as Promise<T[]>;
}
