import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {IBudget} from "../../../../models/budget.model";
import {BudgetsService} from "../../../../services/budgets.service";
import {FormArray, FormArrayName, FormControl, FormGroup, FormGroupDirective, FormGroupName} from "@angular/forms";

@Component({
    selector: 'app-budget-income-debt',
    templateUrl: './budget-income-debt.component.html',
    styleUrls: ['./budget-income-debt.component.scss'],
    standalone: false
})
export class BudgetIncomeDebtComponent implements OnInit{
  fgIncome!: FormGroup;
  fcDebt!: FormControl;

  constructor(private budgetService: BudgetsService, private fgDir: FormGroupDirective) {
  }

  ngOnInit(): void {
    this.fgIncome = this.fgParent.get('income') as FormGroup
    this.fcDebt = this.fgParent.get('debt') as FormControl
    this.fgIncome.setParent(this.fgDir.form)
    this.fcDebt.setParent(this.fgDir.form)
  }

  get fgParent(): FormGroup {
    return this.fgDir.form as FormGroup;
  }

  get incomeHourlyNet(): number {
    return this.fgIncome.get('net')?.value / 4 / 40 | 0;
  }

  get incomeSalaryNet(): number {
    return this.fgIncome.get('net')?.value * 12 | 0;
  }

  get incomeHourlyGross(): number {
    return this.fgIncome.get('gross')?.value / 4 / 40 | 0;
  }

  get incomeSalaryGross(): number {
    return this.fgIncome.get('gross')?.value * 12 | 0;
  }

  get debtToIncome(): number {
    if(this.incomeSalaryGross == 0) return 0;
    return this.fcDebt.value / (this.incomeSalaryGross/12) * 100;
  }

  save(): void {
    this.budgetService.saveDebtToIncome(this.fgParent.getRawValue()).subscribe((res) => {
    })
  }
}
