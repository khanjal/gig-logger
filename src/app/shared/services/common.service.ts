import { Injectable } from '@angular/core';
import { BehaviorSubject } from "rxjs/internal/BehaviorSubject";

@Injectable({
  providedIn: 'root'
})
export class CommonService {
    private headerLinkUpdateSource = new BehaviorSubject<any>("");
    onHeaderLinkUpdate = this.headerLinkUpdateSource.asObservable();

    updateHeaderLink(message: any) {
        this.headerLinkUpdateSource.next(message);
    }
}