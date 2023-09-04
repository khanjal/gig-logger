import { BehaviorSubject } from "rxjs/internal/BehaviorSubject";

export class CommonService {
    private headerLinkUpdateSource = new BehaviorSubject<any>("");
    onHeaderLinkUpdate = this.headerLinkUpdateSource.asObservable();

    updateHeaderLink(message: any) {
        this.headerLinkUpdateSource.next(message);
    }
}