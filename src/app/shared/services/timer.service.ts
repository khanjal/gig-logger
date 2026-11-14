import { Injectable } from "@angular/core";
import type { Observable } from "rxjs";
import { map, take, timer } from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class TimerService {
    public delay(ms: number) {
        return new Promise( resolve => setTimeout(resolve, ms) );
    }

    /**
     * Emits the number of whole ticks remaining, counting down to 0, then completes.
     *
     * Returned as an observable rather than a promise so a caller can cancel it by
     * unsubscribing - a countdown the user is allowed to interrupt cannot be built
     * on top of a bare setTimeout.
     */
    public countdown(totalMs: number, tickMs: number): Observable<number> {
        const ticks = Math.max(1, Math.round(totalMs / tickMs));

        return timer(tickMs, tickMs).pipe(
            map(elapsed => ticks - elapsed - 1),
            take(ticks)
        );
    }
}
