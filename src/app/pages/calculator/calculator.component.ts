import { Component } from '@angular/core';
import { UberCalculatorComponent } from './uber-calculator/uber-calculator.component';

@Component({
    selector: 'app-calculator',
    templateUrl: './calculator.component.html',
    styleUrls: ['./calculator.component.scss'],
    standalone: true,
    imports: [UberCalculatorComponent]
})
export class CalculatorComponent {

}
