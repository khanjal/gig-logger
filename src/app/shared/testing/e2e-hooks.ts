import type { EnvironmentInjector } from '@angular/core';
import { TripService } from '@services/sheets/trip.service';
import { ShiftService } from '@services/sheets/shift.service';
import type { IActionRecord } from '@interfaces/sheets/action-record.interface';

interface E2eHooks {
  setTripAction(rowId: number, action: string | null): Promise<void>;
  setShiftAction(rowId: number, action: string | null): Promise<void>;
}

declare global {
  interface Window {
    __e2e__?: E2eHooks;
  }
}

async function applyAction<T extends IActionRecord>(
  item: T | undefined,
  action: string | null,
  save: (items: T[]) => Promise<void>
): Promise<void> {
  if (!item) return;

  if (action) {
    item.action = action;
    item.actionTime = Date.now();
    item.saved = false;
  } else {
    delete (item as Partial<IActionRecord>).action;
    item.actionTime = 0;
    item.saved = true;
  }

  await save([item]);
}

// Exposes test-only DB manipulation hooks on window for Cypress E2E specs.
// Never installed in production builds.
export function installE2eHooks(injector: EnvironmentInjector): void {
  const tripService = injector.get(TripService);
  const shiftService = injector.get(ShiftService);

  window.__e2e__ = {
    async setTripAction(rowId, action) {
      const trip = await tripService.getByRowId(rowId);
      await applyAction(trip, action, items => tripService.update(items));
    },
    async setShiftAction(rowId, action) {
      const shift = await shiftService.getByRowId(rowId);
      await applyAction(shift, action, items => shiftService.update(items));
    }
  };
}
