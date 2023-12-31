import {Component, OnInit} from '@angular/core';
import {IBalance, IBill, IIncome, IPayee} from "../../../../models/bill.model";
import {Observable} from "rxjs";
import {BillsService} from "../../../../services/bills.service";
import {SharedService} from "../../../../services/shared.service";
import {FilesService} from "../../../../services/files.service";
import {Month} from "../../../../models/shared.model";
import {AnalyticsService, IIncomingOutgoing} from "../../../../services/analytics.service";
import {ActivatedRoute, Router} from "@angular/router";

@Component({
  selector: 'app-bills',
  templateUrl: './bills.component.html',
  styleUrls: ['./bills.component.scss']
})
export class BillsComponent implements OnInit{
  currentMonthYear: string = this.sharedService.currentMonthYear();
  payees: IPayee[] = [];
  bills: IBill[] = [];
  incomes: IIncome[] = [];
  balance: IBalance = {amount: 0, year: this.sharedService.currentYear(), month: this.sharedService.currentMonth()};
  billMonthYears: string[] = [];
  incomingOutgoing: IIncomingOutgoing = {incoming: 0, outgoing: 0, remaining: 0};

  constructor(private router: Router, private route: ActivatedRoute, private analyticsService: AnalyticsService, private billsService: BillsService, private fileService: FilesService, private sharedService: SharedService) {
  }

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      if(params.has('year') && params.has('month')){
        let uncleanMonth = params.get('month')!;
        let uncleanYear = params.get('year')!;
        let cleanMonth = this.sharedService.cleanMonth(uncleanMonth);
        let cleanYear = this.sharedService.cleanYear(uncleanYear);

        if(cleanYear == -1) this.router.navigate(['','bills']);
        if(cleanMonth == 'not a month') this.router.navigate(['', 'bills']);
        this.currentMonthYear = `${cleanMonth} ${cleanYear}`;
      }
      this.loadData();
    });
    this.loadData();
  }

  loadData(): void {
    this.billsService.getMonthBills(this.currentMonthYear).subscribe((res) => {
      this.bills = res;
    })
    this.billsService.getMonthIncome(this.currentMonthYear).subscribe((res) => {
      this.incomes = res;
    })
    this.billsService.getAllPayees().subscribe((res) => {
      this.payees = res;
    });
    this.analyticsService.monthlyIncomingOutgoing(this.currentMonthYear).subscribe((res) => {
      this.incomingOutgoing = res;
    });
    this.billsService.getMonthBalance(this.currentMonthYear).subscribe((res) => {
      this.balance = res;
    });
    this.billsService.getAllBillMonthYears().subscribe((res) => {
      this.billMonthYears = res;
    });
  }

  updateBill(bill: IBill): void {
    this.billsService.updateBill(bill).subscribe((res) => {
      this.billsService.getMonthBills(this.currentMonthYear).subscribe((res) => {
        this.bills = res;
      })
    })
  }

  refreshBills(): void {
    this.billsService.getMonthBills(this.currentMonthYear).subscribe((res) => {
      this.bills = res;
    })
    this.analyticsService.monthlyIncomingOutgoing(this.currentMonthYear).subscribe((res) => {
      this.incomingOutgoing = res;
    });
  }

  refreshPayees(): void {
    this.billsService.getAllPayees().subscribe((res) => {
      this.payees = res;
    });
  }

  refreshIncome(): void {
    this.billsService.getMonthIncome(this.currentMonthYear).subscribe((res) => {
      this.incomes = res;
    })
    this.analyticsService.monthlyIncomingOutgoing(this.currentMonthYear).subscribe((res) => {
      this.incomingOutgoing = res;
    });
  }

  refreshBalance(): void {
    this.billsService.getMonthBalance(this.currentMonthYear).subscribe((res) => {
      this.balance = res;
    });
  }

  refreshMonthYears(): void {
    this.billsService.getAllBillMonthYears().subscribe((res) => {
      this.billMonthYears = res;
    });
  }

  monthYearSelected(monthYear: string): void {
    let selectedMonthYear = this.sharedService.fromMonthYearString(monthYear);
    this.router.navigate(['', 'bills', selectedMonthYear.year, selectedMonthYear.month]);
  }
}
