import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'orderBy', standalone: true })
export class OrderByPipe implements PipeTransform {
  transform<T>(array: T[], property: keyof T, direction: 'asc' | 'desc' = 'asc'): T[] {
    if (!Array.isArray(array) || !property) return array;
    const sorted = [...array].sort((a, b) => {
      if (a[property] == null) return 1;
      if (b[property] == null) return -1;
      if (a[property]! < b[property]!) return direction === 'asc' ? -1 : 1;
      if (a[property]! > b[property]!) return direction === 'asc' ? 1 : -1;
      return 0;
    });
    return sorted;
  }
}
