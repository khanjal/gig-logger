import type { PipeTransform } from '@angular/core';
import { Pipe } from '@angular/core';
import { StringHelper } from '@helpers/string.helper';

@Pipe({
    name: 'truncate',
    standalone: true
})
export class TruncatePipe implements PipeTransform {

  public transform(text: string, length = 20, suffix = '...'): string {
    text = StringHelper.truncate(text, length, suffix);

    return text;
  }
}