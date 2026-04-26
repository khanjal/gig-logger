import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ChangeNotificationService {
  private tripKeysSubject = new Subject<string[]>();
  public tripKeys$ = this.tripKeysSubject.asObservable();

  notifyTripKeys(keys: string[]) {
    if (!keys || !keys.length) return;
    this.tripKeysSubject.next(keys);
  }
}
