import { Component } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';

@Component({
  selector: 'app-uber-calculator',
  templateUrl: './uber-calculator.component.html',
  styleUrls: ['./uber-calculator.component.scss']
})
export class UberCalculatorComponent {
  uberForm = new FormGroup({
    paidFare: new FormControl(''),
    paidPromotion: new FormControl(''),
    customer1Price: new FormControl(''),
    customer2Price: new FormControl(''),
  });

  customer1Ratio: number | undefined;
  customer1Fare: number | undefined;
  customer1Boost: number | undefined;

  customer2Ratio: number | undefined;
  customer2Fare: number | undefined;
  customer2Boost: number | undefined;

  calculate() {
    const paidFare: number = +(this.uberForm.value.paidFare ?? "1");
    const paidBoost: number = +(this.uberForm.value.paidPromotion ?? "1");
    const customer1Price: number = +(this.uberForm.value.customer1Price ?? "1");
    const customer2Price: number = +(this.uberForm.value.customer2Price ?? "1");

    const ratio = +((customer2Price * (customer1Price / 100)).toFixed(2));
    console.log(ratio);

    if (customer1Price > customer2Price) {
      this.customer1Ratio = 1 - ratio;
      this.customer2Ratio = ratio;
    }
    else {
      this.customer1Ratio = ratio;
      this.customer2Ratio = 1 - ratio;
    }

    // this.ratio = +((customer1Price * (customer2Price/100)).toFixed(2));

    this.customer1Fare = +((paidFare * this.customer1Ratio).toFixed(2));
    this.customer2Fare = +((paidFare * this.customer2Ratio).toFixed(2));

    this.customer1Boost = +((paidBoost * this.customer1Ratio).toFixed(2));
    this.customer2Boost = +((paidBoost * this.customer2Ratio).toFixed(2));
  }

  reset() {
    this.uberForm.reset();
    this.customer1Fare = 0;
    this.customer2Fare = 0;
  }
}
