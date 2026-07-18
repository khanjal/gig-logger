import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class LoggerService {
  private logSubject = new Subject<{ level: string; message: string }>();
  public onLog = this.logSubject.asObservable();

  info(message: string, ...optionalParams: unknown[]) {
    console.info(`[INFO]: ${message}`, ...optionalParams);
    this.logSubject.next({ level: 'info', message });
  }

  warn(message: string, ...optionalParams: unknown[]) {
    console.warn(`[WARN]: ${message}`, ...optionalParams);
    this.logSubject.next({ level: 'warn', message });
  }

  error(message: string, ...optionalParams: unknown[]) {
    console.error(`[ERROR]: ${message}`, ...optionalParams);
    this.logSubject.next({ level: 'error', message });
  }

  debug(message: string, ...optionalParams: unknown[]) {
    console.debug(`[DEBUG]: ${message}`, ...optionalParams);
  }
}