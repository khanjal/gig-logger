import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { DateHelper } from '@helpers/date.helper';

@Component({
  selector: 'app-stats',
  templateUrl: './stats.component.html',
  styleUrls: ['./stats.component.scss']
})
export class StatsComponent implements OnInit {
  date: string = "all";
  dates: {key: string, value: string}[] = [];
  selectedDate: string = "";

  statForm = new FormGroup({
    date: new FormControl('')
  });

  async ngOnInit(): Promise<void> {

    this.setupDropdown();
  }

  onDateSelected(date: string) {
    this.date = date;
  }

  setupDropdown() {
    var date = new Date();
    this.dates.push({key: "Today", value: DateHelper.getISOFormat(DateHelper.getDateFromDays())});
    // Yesterday
    // this.dates.push(DateHelper.getISOFormat(DateHelper.getDateFromDays(1)));
    this.dates.push({key: "This Week", value: DateHelper.getISOFormat(DateHelper.getMonday())});
    // Last Week
    // this.dates.push(DateHelper.getISOFormat(DateHelper.getMonday(DateHelper.getDateFromDays(7))));
    this.dates.push({key: "This Month", value: DateHelper.getISOFormat(new Date(date.getFullYear(), date.getMonth(), 1))});
    // last month
    var lastMonth = DateHelper.getISOFormat(new Date(date.getFullYear(), date.getMonth()-1, 1));
    // console.log(lastMonth);
    this.dates.push({key: "This Year", value: DateHelper.getISOFormat(new Date(date.getFullYear(), 0, 1))});
  }
}
