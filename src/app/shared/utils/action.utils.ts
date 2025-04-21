import { ActionEnum } from "@enums/action.enum";

interface Actionable {
    action: string;
    actionTime: number;
    saved: boolean;
}

export function clearAction<T extends Actionable>(item: T): void {
    item.action = '';
    item.actionTime = 0;
    item.saved = true;
}

export function updateAction<T extends Actionable>(item: T, action: string): void {
    if (item.action !== ActionEnum.Add) {
        item.action = action;
    }
    item.actionTime = Date.now();
    item.saved = false;
}