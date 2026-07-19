import { Injectable } from '@angular/core';
import { BehaviorSubject } from "rxjs/internal/BehaviorSubject";

@Injectable({
  providedIn: 'root'
})
export class CommonService {
    private headerLinkUpdateSource = new BehaviorSubject<unknown>("");
    public onHeaderLinkUpdate = this.headerLinkUpdateSource.asObservable();

    public updateHeaderLink(message: unknown) {
        this.headerLinkUpdateSource.next(message);
    }
}