import { Component, OnInit } from '@angular/core';
import { DateHelper } from '@helpers/date.helper';

@Component({
  selector: 'app-stats',
  templateUrl: './stats.component.html',
  styleUrls: ['./stats.component.scss']
})
export class StatsComponent implements OnInit {
  date: string = "all";

  async ngOnInit(): Promise<void> {

    this.setupDropdown();
    
  }

  setupDropdown() {
    var date = new Date();
    // Today
    let today = DateHelper.getISOFormat(DateHelper.getDateFromDays());
    console.log(today);
    // Yesterday
    let yesterday = DateHelper.getISOFormat(DateHelper.getDateFromDays(1));
    console.log(yesterday);
    // This week
    let thisWeek = DateHelper.getISOFormat(DateHelper.getMonday());
    console.log(thisWeek);
    // Last Week
    let lastWeek = DateHelper.getISOFormat(DateHelper.getMonday(DateHelper.getDateFromDays(7)));
    console.log(lastWeek);
    // This month
    var thisMonth = DateHelper.getISOFormat(new Date(date.getFullYear(), date.getMonth(), 1));
    console.log(thisMonth);
    // last month
    var lastMonth = DateHelper.getISOFormat(new Date(date.getFullYear(), date.getMonth()-1, 1));
    console.log(lastMonth);
    // this year
    var thisYear = DateHelper.getISOFormat(new Date(date.getFullYear(), 0, 1));
    console.log(thisYear);
    // all
  }
}
