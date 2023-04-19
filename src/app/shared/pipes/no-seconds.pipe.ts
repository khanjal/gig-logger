import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'noseconds'
})
export class NoSecondsPipe implements PipeTransform {

    transform(text: string): string {
        let splitSpaces = text.split(" ");
        let splittedString = splitSpaces[0].split(":");

        text = splittedString.slice(0,-1).join(':');

        if(splitSpaces[1]) {
            text = `${text} ${splitSpaces[1]}`;
        }

        return text;
    }
}