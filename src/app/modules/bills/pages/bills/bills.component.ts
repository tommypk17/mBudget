import {Component, OnInit} from '@angular/core';
import {IBalance, IBill, IIncome, IPayee} from "../../../../models/bill.model";
import {Observable} from "rxjs";
import {BillsService} from "../../../../services/bills.service";
import {SharedService} from "../../../../services/shared.service";
import {FilesService} from "../../../../services/files.service";
import {Month} from "../../../../models/shared.model";
import {AnalyticsService, IIncomingOutgoing} from "../../../../services/analytics.service";

@Component({
  selector: 'app-bills',
  templateUrl: './bills.component.html',
  styleUrls: ['./bills.component.scss']
})
export class BillsComponent implements OnInit{
  currentMonthYear: string = this.sharedService.currentMonthYear();
  payees$: Observable<IPayee[]> = this.billsService.getAllPayees();
  bills$: Observable<IBill[]> = this.billsService.getMonthBills(this.currentMonthYear);
  income$: Observable<IIncome[]> = this.billsService.getMonthIncome(this.currentMonthYear);
  balance$: Observable<IBalance> = this.billsService.getMonthBalance(this.currentMonthYear);
  billMonthYears$: Observable<string[]> = this.billsService.getAllBillMonthYears();
  incomingOutgoing$: Observable<IIncomingOutgoing> = this.analyticsService.monthlyIncomingOutgoing(this.currentMonthYear);

  constructor(private analyticsService: AnalyticsService, private billsService: BillsService, private fileService: FilesService, private sharedService: SharedService) {
  }

  ngOnInit(): void {
  }

  updateBill(bill: IBill): void {
    this.billsService.updateBill(bill).subscribe((res) => {
      this.bills$ = this.billsService.getMonthBills(this.currentMonthYear);
    })
  }

  refreshBills(): void {
    this.bills$ = this.billsService.getMonthBills(this.currentMonthYear);
    this.incomingOutgoing$ = this.analyticsService.monthlyIncomingOutgoing(this.currentMonthYear);
  }

  refreshPayees(): void {
    this.payees$ = this.billsService.getAllPayees();
  }

  refreshIncome(): void {
    this.income$ = this.billsService.getMonthIncome(this.currentMonthYear);
    this.incomingOutgoing$ = this.analyticsService.monthlyIncomingOutgoing(this.currentMonthYear);
  }

  refreshBalance(): void {
    this.incomingOutgoing$ = this.analyticsService.monthlyIncomingOutgoing(this.currentMonthYear);
  }

  refreshMonthYears(): void {
    this.billMonthYears$ = this.billsService.getAllBillMonthYears();
  }

  monthYearSelected(monthYear: string): void {
    this.currentMonthYear = monthYear;
    this.bills$ = this.billsService.getMonthBills(this.currentMonthYear)
    this.income$ = this.billsService.getMonthIncome(this.currentMonthYear)
    this.balance$ = this.billsService.getMonthBalance(this.currentMonthYear)
    this.incomingOutgoing$ = this.analyticsService.monthlyIncomingOutgoing(this.currentMonthYear);
  }
}
