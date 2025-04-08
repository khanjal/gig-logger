import { Pipe, PipeTransform } from '@angular/core';
import { DateHelper } from '@helpers/date.helper';

@Pipe({
    name: 'noseconds'
})
export class NoSecondsPipe implements PipeTransform {

    transform(text: string): string {
        if (!text) {
            return "";
        }

        return DateHelper.removeSeconds(text);
    }
}