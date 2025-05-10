import { Pipe, PipeTransform } from '@angular/core';
import { AddressHelper } from '@helpers/address.helper';

@Pipe({
    name: 'shortaddress',
    standalone: true
})
export class ShortAddressPipe implements PipeTransform {

    transform(text: string, place: string = "", length: number = 2): string {
        text = AddressHelper.getShortAddress(text, place, length);

        return text;
    }
}