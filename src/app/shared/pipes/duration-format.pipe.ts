import { Pipe, PipeTransform } from '@angular/core';

/**
 * Formats a duration in seconds or minutes as h:mm or m:ss.
 * Accepts either a number (seconds or minutes) or a string (e.g. '90', '01:30').
 * Usage: {{ duration | durationFormat }}
 */
@Pipe({ name: 'durationFormat', standalone: true })
export class DurationFormatPipe implements PipeTransform {
  transform(value: number | string | null | undefined): string {
    if (value == null || value === '') return '';
    let totalSeconds: number;
    if (typeof value === 'string') {
      if (value.includes(':')) {
        // Try to parse as ISO or time string (e.g., '00:19:00.000')
        const match = value.match(/^(\d{2}):(\d{2}):(\d{2})(?:\.(\d+))?$/);
        if (match) {
          // HH:MM:SS(.sss)
          const hours = parseInt(match[1], 10);
          const minutes = parseInt(match[2], 10);
          // Only use hours and minutes for display (ignore seconds)
          return `${hours}:${minutes.toString().padStart(2, '0')}`;
        } else if (value.includes(':')) {
          // Already formatted as m:ss or h:mm
          // If it's m:ss or h:mm, trim off seconds if present
          const parts = value.split(':');
          if (parts.length === 2) {
            // m:ss, show as m:00
            return `${parseInt(parts[0], 10)}:00`;
          } else if (parts.length === 3) {
            // h:mm:ss, show as h:mm
            return `${parseInt(parts[0], 10)}:${parts[1].padStart(2, '0')}`;
          }
          return value;
        } else {
          totalSeconds = parseInt(value, 10);
        }
      } else {
        totalSeconds = parseInt(value, 10);
      }
    } else {
      totalSeconds = value;
    }
    if (isNaN(totalSeconds) || totalSeconds < 0) return '';
    // Only use hours and minutes for display (ignore seconds)
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    return `${hours}:${minutes.toString().padStart(2, '0')}`;
  }
}
