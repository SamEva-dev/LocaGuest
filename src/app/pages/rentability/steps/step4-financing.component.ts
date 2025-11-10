import { Component, Input, Output, EventEmitter, OnInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { FinancingAssumptions } from '../../../core/models/rentability.models';

@Component({
  selector: 'app-step4-financing',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslatePipe],
  template: `
    <div class="max-w-4xl">
      <h2 class="text-xl font-semibold text-slate-900 dark:text-white mb-2">
        {{ 'RENTABILITY.STEP4.TITLE' | translate }}
      </h2>
      <p class="text-slate-600 dark:text-slate-400 mb-6">
        {{ 'RENTABILITY.STEP4.SUBTITLE' | translate }}
      </p>

      <form [formGroup]="form" class="space-y-6">
        <!-- Montant et durée -->
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              {{ 'RENTABILITY.STEP4.LOAN_AMOUNT' | translate }} (€)
            </label>
            <input type="number" formControlName="loanAmount" min="0" step="1000"
              class="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white">
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              {{ 'RENTABILITY.STEP4.DURATION' | translate }} ({{ 'RENTABILITY.MONTHS' | translate }})
            </label>
            <input type="number" formControlName="duration" min="12" step="12"
              class="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white">
            <p class="text-xs text-slate-500 mt-1">{{ (form.get('duration')?.value / 12) || 0 }} {{ 'RENTABILITY.YEARS' | translate }}</p>
          </div>
        </div>

        <!-- Type et taux -->
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              {{ 'RENTABILITY.STEP4.LOAN_TYPE' | translate }}
            </label>
            <select formControlName="loanType"
              class="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white">
              <option value="fixed">{{ 'RENTABILITY.LOAN_TYPES.FIXED' | translate }}</option>
              <option value="variable">{{ 'RENTABILITY.LOAN_TYPES.VARIABLE' | translate }}</option>
              <option value="mixed">{{ 'RENTABILITY.LOAN_TYPES.MIXED' | translate }}</option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              {{ 'RENTABILITY.STEP4.INTEREST_RATE' | translate }} (%)
            </label>
            <input type="number" formControlName="interestRate" min="0" max="10" step="0.01"
              class="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white">
          </div>
        </div>

        <!-- Assurance et différé -->
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              {{ 'RENTABILITY.STEP4.INSURANCE_RATE' | translate }} (%)
            </label>
            <input type="number" formControlName="insuranceRate" min="0" max="1" step="0.01"
              class="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white">
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              {{ 'RENTABILITY.STEP4.DEFERRED_MONTHS' | translate }}
            </label>
            <input type="number" formControlName="deferredMonths" min="0" max="24"
              class="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white">
          </div>
        </div>

        <!-- Type de différé -->
        @if ((form.get('deferredMonths')?.value || 0) > 0) {
          <div>
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              {{ 'RENTABILITY.STEP4.DEFERRED_TYPE' | translate }}
            </label>
            <select formControlName="deferredType"
              class="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white">
              <option value="total">{{ 'RENTABILITY.DEFERRED_TYPES.TOTAL' | translate }}</option>
              <option value="partial">{{ 'RENTABILITY.DEFERRED_TYPES.PARTIAL' | translate }}</option>
            </select>
          </div>
        }

        <!-- Options -->
        <div class="space-y-3">
          <label class="flex items-center gap-3 p-4 border border-slate-200 dark:border-slate-700 rounded-lg cursor-pointer">
            <input type="checkbox" formControlName="includeNotaryInLoan"
              class="w-5 h-5 text-blue-600 border-slate-300 rounded">
            <span class="font-medium text-slate-900 dark:text-white">
              {{ 'RENTABILITY.STEP4.INCLUDE_NOTARY' | translate }}
            </span>
          </label>

          <label class="flex items-center gap-3 p-4 border border-slate-200 dark:border-slate-700 rounded-lg cursor-pointer">
            <input type="checkbox" formControlName="includeRenovationInLoan"
              class="w-5 h-5 text-blue-600 border-slate-300 rounded">
            <span class="font-medium text-slate-900 dark:text-white">
              {{ 'RENTABILITY.STEP4.INCLUDE_RENOVATION' | translate }}
            </span>
          </label>
        </div>

        <!-- Pénalités remboursement anticipé -->
        <div>
          <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            {{ 'RENTABILITY.STEP4.EARLY_REPAYMENT_PENALTY' | translate }} (%)
          </label>
          <input type="number" formControlName="earlyRepaymentPenalty" min="0" max="3" step="0.1"
            class="w-48 px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white">
        </div>

        <!-- Mensualité estimée -->
        <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4 rounded-lg">
          <div class="flex justify-between items-center">
            <span class="font-medium text-blue-900 dark:text-blue-300">
              {{ 'RENTABILITY.STEP4.MONTHLY_PAYMENT' | translate }}
            </span>
            <span class="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {{ monthlyPayment() | number:'1.0-0' }} €
            </span>
          </div>
          <p class="text-sm text-blue-700 dark:text-blue-400 mt-2">
            {{ 'RENTABILITY.STEP4.INCLUDING_INSURANCE' | translate }}
          </p>
        </div>
      </form>
    </div>
  `
})
export class Step4FinancingComponent implements OnInit {
  @Input() data?: Partial<FinancingAssumptions> | undefined;
  @Output() dataChange = new EventEmitter<{data: FinancingAssumptions, isValid: boolean}>();

  form: FormGroup;

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      loanAmount: [160000, [Validators.required, Validators.min(0)]],
      loanType: ['fixed', Validators.required],
      interestRate: [3.5, [Validators.required, Validators.min(0)]],
      duration: [240, [Validators.required, Validators.min(12)]],
      insuranceRate: [0.36, [Validators.required, Validators.min(0)]],
      deferredMonths: [0, [Validators.required, Validators.min(0)]],
      deferredType: ['none'],
      earlyRepaymentPenalty: [3, [Validators.required, Validators.min(0)]],
      includeNotaryInLoan: [false],
      includeRenovationInLoan: [false]
    });

    effect(() => {
      this.form.valueChanges.subscribe(() => {
        this.emitChanges();
      });
    });
  }

  ngOnInit() {
    if (this.data) {
      this.form.patchValue(this.data);
    }
    setTimeout(() => this.emitChanges(), 0);
  }

  monthlyPayment(): number {
    const amount = this.form.get('loanAmount')?.value || 0;
    const rate = (this.form.get('interestRate')?.value || 0) / 100 / 12;
    const months = this.form.get('duration')?.value || 1;
    const insurance = amount * (this.form.get('insuranceRate')?.value || 0) / 100 / 12;

    if (rate === 0) return (amount / months) + insurance;

    const payment = amount * (rate * Math.pow(1 + rate, months)) / (Math.pow(1 + rate, months) - 1);
    return payment + insurance;
  }

  private emitChanges() {
    this.dataChange.emit({
      data: this.form.value as FinancingAssumptions,
      isValid: this.form.valid
    });
  }
}
