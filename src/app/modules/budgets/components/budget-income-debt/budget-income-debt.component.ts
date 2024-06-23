import {Component, EventEmitter, Input, Output} from '@angular/core';
import {IBudget} from "../../../../models/budget.model";
import {BudgetsService} from "../../../../services/budgets.service";

@Component({
  selector: 'app-budget-income-debt',
  templateUrl: './budget-income-debt.component.html',
  styleUrls: ['./budget-income-debt.component.scss']
})
export class BudgetIncomeDebtComponent {
  @Output('budgetChanged') budgetChanged: EventEmitter<void> = new EventEmitter<void>();
  @Input('budget') budget!: IBudget;

  constructor(private budgetService: BudgetsService) {
  }

  get incomeHourlyNet(): number {
    return this.budget.income.net / 4 / 40 | 0;
  }

  get incomeSalaryNet(): number {
    return this.budget.income.net * 12 | 0;
  }

  get incomeHourlyGross(): number {
    return this.budget.income.gross / 4 / 40 | 0;
  }

  get incomeSalaryGross(): number {
    return this.budget.income.gross * 12 | 0;
  }

  get debtToIncome(): number {
    if(this.incomeSalaryGross == 0) return 0;
    return this.budget.debt / (this.incomeSalaryGross/12) * 100;
  }

  save(): void {
    this.budgetService.saveDebtToIncome(this.budget).subscribe((res) => {
      this.budgetChanged.emit();
    })
  }
}
