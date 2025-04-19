import { ElementRef, Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class GoogleAddressService {
    place!: any;
    formattedAddress!: string;

    public getPlaceAutocomplete(inputElement: ElementRef<any>, callback: (address: string) => void) {
        //@ts-ignore
        const autocomplete = new google.maps.places.Autocomplete(
            inputElement.nativeElement,
            {
                componentRestrictions: { country: 'US' },
                types: ["establishment", "geocode"]  // 'establishment' / 'address' / 'geocode' // we are checking all types
            }
        );

        //@ts-ignore
        google.maps.event.addListener(autocomplete, 'place_changed', () => {
            this.place = autocomplete.getPlace();
            this.formatAddress();
            callback(this.formattedAddress); // Call the provided callback with the selected address
        });
    }

    public attachToModal() {
        const modalContainer = document.querySelector('.mat-mdc-dialog-container'); // Adjust selector if needed
        const pacContainer = document.querySelector('.pac-container');
        if (modalContainer && pacContainer) {
            modalContainer.appendChild(pacContainer); // Move the dropdown into the modal
        }
    }

    public getAddrComponent(place: any, componentTemplate: any) {
        let result;

        for (let i = 0; i < place.address_components.length; i++) {
            const addressType = place.address_components[i].types[0];
            if (componentTemplate[addressType]) {
            result = place.address_components[i][componentTemplate[addressType]];        
            return result;
            }
        }
        return;
    }

    public clearAddressListeners(inputElement: ElementRef<any>) {
    //@ts-ignore
        google.maps.event.clearInstanceListeners(inputElement.nativeElement);
        this.removePacContainers();
    }
    
    public getFormattedAddress(place: any){
        return place['formatted_address'];
    }

    private getPlaceId(place: any){
        return place['place_id'];
    }
    private getStreetNumber(place: any) {
        const COMPONENT_TEMPLATE = { street_number: 'short_name' },
            streetNumber = this.getAddrComponent(place, COMPONENT_TEMPLATE);

        return streetNumber===undefined?'':streetNumber;
    }

    private getStreet(place: any) {
        const COMPONENT_TEMPLATE = { route: 'long_name' },
            street = this.getAddrComponent(place, COMPONENT_TEMPLATE);
        return street;
    }

    private getLocality(place: any) {
        const COMPONENT_TEMPLATE = { locality: 'long_name' },
            city = this.getAddrComponent(place, COMPONENT_TEMPLATE);
        return city;
    }

    private getState(place: any) {
        const COMPONENT_TEMPLATE = { administrative_area_level_1: 'short_name' },
            state = this.getAddrComponent(place, COMPONENT_TEMPLATE);
        return state;
    }

    private getDistrict(place: any) {
        const COMPONENT_TEMPLATE = { administrative_area_level_2: 'short_name' },
            state = this.getAddrComponent(place, COMPONENT_TEMPLATE);
        return state;
    }

    private getCountryShort(place: any) {
        const COMPONENT_TEMPLATE = { country: 'short_name' },
            countryShort = this.getAddrComponent(place, COMPONENT_TEMPLATE);
        return countryShort;
    }

    private getCountry(place:any) {
        const COMPONENT_TEMPLATE = { country: 'long_name' },
            country = this.getAddrComponent(place, COMPONENT_TEMPLATE);
        return country;
    }

    private getPostCode(place: any) {
        const COMPONENT_TEMPLATE = { postal_code: 'long_name' },
            postCode = this.getAddrComponent(place, COMPONENT_TEMPLATE);
        return postCode;
    }

    private getPhone(place: any) {
        const COMPONENT_TEMPLATE = { formatted_phone_number: 'formatted_phone_number' },
            phone = this.getAddrComponent(place, COMPONENT_TEMPLATE);
        return phone;
    }
    
    private formatAddress() {
        this.formattedAddress = this.getFormattedAddress(this.place);
        let name = this.place['name'];

        if (!this.formattedAddress.startsWith(name)) {
            this.formattedAddress = `${name}, ${this.formattedAddress}`;
        }
    }

    private removePacContainers() {
        const pacContainers = document.querySelectorAll('.pac-container');
        pacContainers.forEach(container => container.remove());
    }
}