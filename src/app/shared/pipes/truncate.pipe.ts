import { Pipe, PipeTransform } from '@angular/core';
import { StringHelper } from '@helpers/string.helper';

@Pipe({
    name: 'truncate',
    standalone: true
})
export class TruncatePipe implements PipeTransform {

  transform(text: string, length: number = 20, suffix: string = '...'): string {
    text = StringHelper.truncate(text, length, suffix);

    return text;
  }
}