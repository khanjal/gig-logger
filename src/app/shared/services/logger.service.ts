import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class LoggerService {
  private logSubject = new Subject<{ level: string; message: string }>();
  public onLog = this.logSubject.asObservable();

  info(message: string, ...optionalParams: any[]) {
    console.info(`[INFO]: ${message}`, ...optionalParams);
    this.logSubject.next({ level: 'info', message });
  }

  warn(message: string, ...optionalParams: any[]) {
    console.warn(`[WARN]: ${message}`, ...optionalParams);
    this.logSubject.next({ level: 'warn', message });
  }

  error(message: string, ...optionalParams: any[]) {
    console.error(`[ERROR]: ${message}`, ...optionalParams);
    this.logSubject.next({ level: 'error', message });
  }

  debug(message: string, ...optionalParams: any[]) {
    console.debug(`[DEBUG]: ${message}`, ...optionalParams);
  }
}