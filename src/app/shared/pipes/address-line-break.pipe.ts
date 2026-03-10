import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'addresslinebreak',
    standalone: true
})
export class AddressLineBreakPipe implements PipeTransform {
    transform(address: string, minLength: number = 30): string {
        if (!address || address.length <= minLength) {
            return address;
        }
        return address.replace(/, /g, ',\n');
    }
}
