import type { PipeTransform } from '@angular/core';
import { Pipe } from '@angular/core';

@Pipe({
    name: 'addresslinebreak',
    standalone: true
})
export class AddressLineBreakPipe implements PipeTransform {
    public transform(address: string, minLength = 30): string {
        if (!address || address.length <= minLength) {
            return address;
        }
        return address.replace(/, /g, ',\n');
    }
}
