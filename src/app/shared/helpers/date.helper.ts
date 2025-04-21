export class DateHelper {

    static getDateFromDays(days: number = 0): Date {
        let currentDate = new Date();
        let date = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate()-days);
        let dateString = date;

        return dateString;
    }

    static getDatesArray(days: number = 0): string[] {
        let dates: string[] = [];

        for (let index = 0; index < days; index++) {
            dates.push(DateHelper.getISOFormat(this.getDateFromDays(index)));
        }

        return dates;
    }

    static getDateFromISO(date: string): Date {
        return new Date(`${date}\n`);
    }

    static getISOFormat(date?: Date) {
        if (!date) {
            date = new Date();
        }
        return date.toLocaleDateString("sv-SE"); // Use Swedish (Sweden) since it has the format we want (yyyy-MM-dd).
    }

    static getDays(): number {
        var date = new Date("01/01/1900");
        let time = new Date().getTime() - date.getTime();
        // To calculate the no. of days between two dates
        let days = time / (1000 * 3600 * 24);

        return Math.trunc(days) + 2;
    }

    static getMonthYearString(date: Date) {
        let monthString = `${date.getMonth()+1}-${date.getFullYear()}`;
        return monthString;
    }

    static getFirstDayOfMonth(date: Date) {
        let firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
        return this.getISOFormat(firstDay);
    }

    static getFirstDayOfWeek(): number {
        return 1; // Forcing Monday to be the first day of the week.
    }

    static getTimeString(date?: Date): string {
        if (!date) {
            date = new Date();
        }

        let timeString = date.toLocaleTimeString();
        timeString = this.removeSeconds(timeString);
        return timeString;
    }

    static removeSeconds(time: string): string {
        if (!time) {
            return "";
        }
        
        let splitSpaces = time.split(" ");
        let splittedString = splitSpaces[0].split(":");

        if (splittedString.length < 3) {
            return time;
        }

        time = splittedString.slice(0,-1).join(':');

        if(splitSpaces[1]) {
            time = `${time} ${splitSpaces[1]}`;
        }

        return time;
    }

    static getStartOfWeekDate(date: Date): string {
        const deltaStart =
            this.getFirstDayOfWeek() -
            this.getDayOfWeek(date);

        let startDate = new Date();
        startDate.setDate(startDate.getDate() + deltaStart);

        return this.getISOFormat(startDate);
    }

    static getDurationSeconds(start: string, end: string): number {
        if (!start || !end) {
            return 0;
        }

        let startDate = Date.parse(new Date().toDateString() + ' ' + start) / 1000;
        let endDate = Date.parse(new Date().toDateString() + ' ' + end) / 1000;

        if (endDate < startDate) {
            startDate -= 86400; // Subtract a day if end less than start.
        }

        let diff = (endDate - startDate);
        return diff;
    }

    static getDurationString(diff: number): string {
        const seconds = Math.floor(diff % 60);
        const minutes = Math.floor(diff / 60 ) % 60;
        const hours = Math.floor((diff / (60* 60)) % 60);

        const duration = `${this.pad(hours)}:${this.pad(minutes)}:${this.pad(seconds)}.000`;
        return duration;
    }

    static getDayOfWeek(date: Date = new Date()){
        let dayOfWeek = new Date(date).getDay();

        if (dayOfWeek === 0) {
            return 7; // We want Sunday to be 7
        }
        else {
            return dayOfWeek;
        }
    }

    static getHoursFromSeconds(seconds: number): number {
        return seconds / 3600;
    }

    static getMinutesAndSeconds(seconds: number): string {
        const minutes: number = Math.floor(seconds / 60);
         return minutes.toString().padStart(2, '0') + ':' + 
         Math.floor((seconds - minutes * 60)).toString().padStart(2, '0');
    }

    static getMonday(date: Date = new Date()) {
        var day = date.getDay() || 7;  
        if( day !== 1 ) 
            date.setHours(-24 * (day - 1)); 
        return date;
    }

    static pad(number: number) {
        let numberString = number.toString();
        if (numberString.length < 2) {
            numberString = `0${numberString}`;
        }

        return numberString;
    }
}