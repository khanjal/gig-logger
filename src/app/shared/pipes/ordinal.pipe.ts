import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'ordinal', standalone: true })
export class OrdinalPipe implements PipeTransform {
  transform(value: any): string {
    const num = parseInt(value, 10);
    if (isNaN(num)) return value;
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
