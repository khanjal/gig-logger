import { Injectable } from '@angular/core';
import { BehaviorSubject } from "rxjs/internal/BehaviorSubject";

@Injectable({
  providedIn: 'root'
})
export class CommonService {
    private headerLinkUpdateSource = new BehaviorSubject<unknown>("");
    onHeaderLinkUpdate = this.headerLinkUpdateSource.asObservable();

    updateHeaderLink(message: unknown) {
        this.headerLinkUpdateSource.next(message);
    }
}