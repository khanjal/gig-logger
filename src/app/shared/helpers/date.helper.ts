// Sort and organize DateHelper methods, group similar ones, and combine duplicates
// - Combine getISOFormat, getDateISO, getDateKey (all return yyyy-MM-dd)
// - Group parsing, formatting, and calculation utilities
// - Add comments for clarity

export class DateHelper {
    // --- Date Parsing & Formatting ---

    /**
     * Parse a 'YYYY-MM-DD' string as a local date.
     */
    static parseLocalDate(dateString: string): Date {
        if (!dateString) return new Date();
        const [year, month, day] = dateString.split('-').map(Number);
        return new Date(year, month - 1, day);
    }

    /**
     * Format a date as 'yyyy-MM-dd' (ISO, local time).
     */
    static toISO(date?: Date): string {
        if (!date) date = new Date();
        return date.toLocaleDateString('sv-SE');
    }

    /**
     * Format an ISO date string (YYYY-MM-DD) to a locale-specific date string.
     * Avoids timezone issues by parsing components directly.
     */
    static formatLocaleDateString(dateString: string, locale: string = 'en-US', options?: Intl.DateTimeFormatOptions): string {
        const date = this.parseLocalDate(dateString);
        if (isNaN(date.getTime())) return 'Unknown date';
        return date.toLocaleDateString(locale, options);
    }

    // --- Date Calculation ---

    /**
     * Get the number of days since 1900-01-01 (Excel style).
     */
    static getDays(date?: Date): number {
        const d = date ? new Date(date) : new Date();
        const base = new Date('1900-01-01');
        const time = d.getTime() - base.getTime();
        const days = time / (1000 * 60 * 60 * 24);
        const dayNumber = Math.floor(days) + 2;
        return dayNumber;
    }

    static getDateFromDays(days: number = 0): Date {
        let currentDate = new Date();
        let date = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() - days);
        return date;
    }

    static getDatesArray(days: number = 0): string[] {
        let dates: string[] = [];
        for (let index = 0; index < days; index++) {
            dates.push(DateHelper.toISO(this.getDateFromDays(index)));
        }
        return dates;
    }

    static getDateFromISO(date: string): Date {
        return new Date(`${date}\n`);
    }

    // --- Time Formatting & Calculation ---

    static getTimeString(date?: Date): string {
        if (!date) date = new Date();
        let timeString = date.toLocaleTimeString();
        timeString = this.removeSeconds(timeString);
        return timeString;
    }

    static removeSeconds(time: string): string {
        if (!time) return '';
        let splitSpaces = time.split(' ');
        let splittedString = splitSpaces[0].split(':');
        if (splittedString.length < 3) return time;
        time = splittedString.slice(0, -1).join(':');
        if (splitSpaces[1]) time = `${time} ${splitSpaces[1]}`;
        return time;
    }

    // --- Week & Month Utilities ---

    static getMonthYearString(date: Date) {
        return `${date.getMonth() + 1}-${date.getFullYear()}`;
    }

    static getFirstDayOfMonth(date: Date) {
        let firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
        return this.toISO(firstDay);
    }

    static getFirstDayOfWeek(): number {
        return 1; // Forcing Monday to be the first day of the week.
    }

    static getStartOfWeekDate(date: Date): string {
        const deltaStart = this.getFirstDayOfWeek() - this.getDayOfWeek(date);
        let startDate = new Date();
        startDate.setDate(startDate.getDate() + deltaStart);
        return this.toISO(startDate);
    }

    static getDayOfWeek(date: Date = new Date()) {
        let dayOfWeek = new Date(date).getDay();
        return dayOfWeek === 0 ? 7 : dayOfWeek;
    }

    // --- Duration & Time Calculations ---

    static getDurationSeconds(start: string, end: string): number {
        if (!start || !end) return 0;
        let startDate = Date.parse(new Date().toDateString() + ' ' + start) / 1000;
        let endDate = Date.parse(new Date().toDateString() + ' ' + end) / 1000;
        if (endDate < startDate) startDate -= 86400;
        return endDate - startDate;
    }

    static getTimeNumber(time: string): number {
        if (!time) return 0;
        let timeParts = time.split(':');
        let hours = parseInt(timeParts[0]);
        let minutes = parseInt(timeParts[1]);
        let seconds = parseInt(timeParts[2]);
        return (hours * 3600) + (minutes * 60) + seconds;
    }

    static convertToTimestamp(time: string): number {
        if (!time) return 0;
        const [hoursMinutes, period] = time.split(' ');
        const [hours, minutes] = hoursMinutes.split(':').map(Number);
        if (!period) return hours * 60 + minutes;
        let totalHours = hours % 12 + (period.toLowerCase() === 'pm' ? 12 : 0);
        return totalHours * 60 + minutes;
    }

    static getDurationString(diff: number): string {
        const seconds = Math.floor(diff % 60);
        const minutes = Math.floor(diff / 60) % 60;
        const hours = Math.floor((diff / (60 * 60)) % 60);
        return `${this.pad(hours)}:${this.pad(minutes)}:${this.pad(seconds)}.000`;
    }

    static getHoursFromSeconds(seconds: number): number {
        return seconds / 3600;
    }

    static getMinutesAndSeconds(seconds: number): string {
        const minutes: number = Math.floor(seconds / 60);
        return minutes.toString().padStart(2, '0') + ':' + Math.floor((seconds - minutes * 60)).toString().padStart(2, '0');
    }

    static weekdayLabel(dayIndex: number, style: 'short' | 'long' = 'short'): string {
        const short = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const long = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const idx = ((dayIndex % 7) + 7) % 7;
        return style === 'long' ? long[idx] : short[idx];
    }

    /**
     * Convert weekday name (full or abbreviated) to day index (0=Sunday, 6=Saturday).
     * Returns undefined if weekday name is not recognized.
     */
    static weekdayToIndex(weekday: string): number | undefined {
        if (!weekday) return undefined;
        const weekdayMap: Record<string, number> = {
            'sun': 0, 'sunday': 0,
            'mon': 1, 'monday': 1,
            'tue': 2, 'tuesday': 2,
            'wed': 3, 'wednesday': 3,
            'thu': 4, 'thursday': 4,
            'fri': 5, 'friday': 5,
            'sat': 6, 'saturday': 6
        };
        return weekdayMap[weekday.toLowerCase()];
    }
    
    /**
     * Normalizes weekday names by expanding abbreviated forms to full names.
     * If a full weekday name is passed (e.g., "Monday"), it returns the original value unchanged.
     * @param weekday - Abbreviated (e.g., "Mon") or full weekday name (e.g., "Monday")
     * @returns Full weekday name or original value if not an abbreviation
     */
    static expandWeekday(weekday: string): string {
        if (!weekday) return weekday;
        const weekdayMap: Record<string, string> = {
            'sun': 'Sunday',
            'mon': 'Monday',
            'tue': 'Tuesday',
            'wed': 'Wednesday',
            'thu': 'Thursday',
            'fri': 'Friday',
            'sat': 'Saturday'
        };
        const expanded = weekdayMap[weekday.toLowerCase()];
        return expanded || weekday; // Return original if not found
    }
    
    /**
     * Converts minutes since midnight to 'HH:mm' string format
     */
    static minutesToTimeString(minutes: number): string {
        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
    }

    // --- Miscellaneous ---

    static getMonday(date: Date = new Date()) {
        var day = date.getDay() || 7;
        if (day !== 1) date.setHours(-24 * (day - 1));
        return date;
    }

    static pad(number: number) {
        let numberString = number.toString();
        if (numberString.length < 2) numberString = `0${numberString}`;
        return numberString;
    }

    static prefers24Hour(): boolean {
        const testDate = new Date(Date.UTC(2020, 0, 1, 13, 0, 0));
        const formatted = testDate.toLocaleTimeString(undefined, { hour: 'numeric' });
        return !formatted.match(/AM|PM/i);
    }
}