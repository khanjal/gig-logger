import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class LoggerService {
  info(message: string, ...optionalParams: any[]) {
    console.info(`[INFO]: ${message}`, ...optionalParams);
  }

  warn(message: string, ...optionalParams: any[]) {
    console.warn(`[WARN]: ${message}`, ...optionalParams);
  }

  error(message: string, ...optionalParams: any[]) {
    console.error(`[ERROR]: ${message}`, ...optionalParams);
  }

  debug(message: string, ...optionalParams: any[]) {
    console.debug(`[DEBUG]: ${message}`, ...optionalParams);
  }
}