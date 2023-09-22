import { CommonModule } from '@angular/common';
import { Component, ViewChild, EventEmitter, Output, OnInit, AfterViewInit, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';


@Component({
    standalone: true,
    selector: 'AutocompleteComponent',
    template: `
        <input class="input"
            type="text"
            [(ngModel)]="autocompleteInput"
            #addresstext style="padding: 12px 20px; border: 1px solid #ccc; width: 400px"
            >
    `,
    imports:[CommonModule, FormsModule]
})
export class AutocompleteComponent implements OnInit, AfterViewInit {
    @Input() addressType!: string;
    @Output() setAddress: EventEmitter<any> = new EventEmitter();
    @ViewChild('addresstext') addresstext: any;

    autocompleteInput!: string;
    queryWait!: boolean;

    constructor() {
    }

    ngOnInit() {
    }

    ngAfterViewInit() {
        this.getPlaceAutocomplete();
    }

    private getPlaceAutocomplete() {
        const autocomplete = new google.maps.places.Autocomplete(this.addresstext.nativeElement,
            {
                componentRestrictions: { country: 'US' },
                types: [this.addressType]  // 'establishment' / 'address' / 'geocode'
            });
        google.maps.event.addListener(autocomplete, 'place_changed', () => {
            const place = autocomplete.getPlace();
            this.invokeEvent(place);
        });
    }

    invokeEvent(place: Object) {
        this.setAddress.emit(place);
    }

}