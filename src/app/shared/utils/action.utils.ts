import { ActionEnum } from "@enums/action.enum";
import type { IActionRecord } from "@interfaces/sheets/action-record.interface";

export function clearAction<T extends IActionRecord>(item: T): void {
    item.action = '';
    item.actionTime = 0;
    item.saved = true;
}

export function updateAction<T extends IActionRecord>(item: T, action: string): void {
    if (item.action !== ActionEnum.Add) {
        item.action = action;
    }
    item.actionTime = Date.now();
    item.saved = false;
}