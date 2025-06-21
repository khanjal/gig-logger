import { Pipe, PipeTransform } from '@angular/core';
import { DateHelper } from '@helpers/date.helper';

@Pipe({
    name: 'noseconds',
    standalone: true
})
export class NoSecondsPipe implements PipeTransform {

    transform(text: string, use24Hour?: boolean): string {
        if (!text) {
            return "";
        }
        // Remove seconds
        let time = DateHelper.removeSeconds(text);
        // Format as 24hr or 12hr
        if (use24Hour) {
            // Convert to 24hr if needed
            const d = new Date('1970-01-01T' + time);
            if (!isNaN(d.getTime())) {
                return d.getHours().toString().padStart(2, '0') + ':' + d.getMinutes().toString().padStart(2, '0');
            }
            // Fallback: try to parse manually
            const match = time.match(/(\d{1,2}):(\d{2}) ?([APap][Mm])?/);
            if (match) {
                let hour = parseInt(match[1], 10);
                const min = match[2];
                const ampm = match[3];
                if (ampm) {
                    if (ampm.toLowerCase() === 'pm' && hour < 12) hour += 12;
                    if (ampm.toLowerCase() === 'am' && hour === 12) hour = 0;
                }
                return hour.toString().padStart(2, '0') + ':' + min;
            }
        } else {
            // Convert to 12hr if needed
            const d = new Date('1970-01-01T' + time);
            if (!isNaN(d.getTime())) {
                let hour = d.getHours();
                const min = d.getMinutes().toString().padStart(2, '0');
                const ampm = hour >= 12 ? 'PM' : 'AM';
                hour = hour % 12;
                if (hour === 0) hour = 12;
                return hour + ':' + min + ' ' + ampm;
            }
            // Fallback: already 12hr
            return time;
        }
        return time;
    }
}