import { Table } from "dexie";
import { GenericCrudService } from "./generic-crud.service";
import { ActionEnum } from "@enums/action.enum";
import { clearAction } from "@utils/action.utils";
import { IActionRecord } from "@interfaces/action-record.interface";

export class SyncableCrudService<T extends IActionRecord> extends GenericCrudService<T> {
  constructor(table: Table<T, number>) {
    super(table);
  }

  async getUnsaved(): Promise<T[]> {
    return (await this.list()).filter(x => !x.saved);
  }

  async saveUnsaved(): Promise<void> {
    const unsaved = await this.getUnsaved();
    let rowId: number | undefined;
    
    for (const item of unsaved) {
      if (item.action === ActionEnum.Delete) {
        if (!rowId) {
          rowId = item.rowId;
        }
        await this.delete(item.id!);
        continue;
      }

      const original = await this.get(item.id!);
      if (original && original.actionTime === item.actionTime) {
        clearAction(item);
        await this.update([item]);
      }
    }

    if (rowId !== undefined) {
      await this.updateRowIds(rowId);
    }
  }

  async getMaxRowId(): Promise<number> {
    const items = await this.list();
    if (items.length === 0) return 0;
    return Math.max(...items.map(x => x.rowId || 0));
  }

  async deleteItem(item: T): Promise<void> {
    if (!item.saved) {
      await this.delete(item.id!);
      await this.updateRowIds(item.rowId);
    } else {
      item.action = ActionEnum.Delete;
      item.actionTime = Date.now();
      item.saved = false;
      await this.update([item]);
    }
  }

  async updateRowIds(rowId: number): Promise<void> {
    const maxId = await this.getMaxRowId();
    let nextRowId = rowId + 1;
    
    while (nextRowId <= maxId) {
      const item = await this.getByRowId(nextRowId);
      if (item) {
        item.rowId = rowId;
        await this.update([item]);
        rowId++;
      }
      nextRowId++;
    }
  }
}
