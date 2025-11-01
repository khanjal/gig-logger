import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'ordinal', standalone: true })
export class OrdinalPipe implements PipeTransform {
  transform(value: string | number | null): string {
    if (value === null || value === undefined) return '';
    const num = parseInt(value.toString(), 10);
    if (isNaN(num)) return value.toString();
    const suffix =
      num % 10 === 1 && num % 100 !== 11
        ? 'st'
        : num % 10 === 2 && num % 100 !== 12
        ? 'nd'
        : num % 10 === 3 && num % 100 !== 13
        ? 'rd'
        : 'th';
    return num + suffix;
  }
}
