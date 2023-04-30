export class TimerService {
    delay(ms: number) {
        return new Promise( resolve => setTimeout(resolve, ms) );
    }
}