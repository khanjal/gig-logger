import { Pipe, PipeTransform } from '@angular/core';
import { AddressHelper } from '@helpers/address.helper';

@Pipe({
    name: 'shortaddress'
})
export class ShortAddressPipe implements PipeTransform {

    transform(text: string): string {
        text = AddressHelper.getShortAddress(text);

        return text;
    }
}