import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { RentabilityResult, RentabilityInput } from '../../../core/models/rentability.models';

@Component({
  selector: 'app-step7-analysis',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  template: `
    <div class="max-w-4xl">
      <h2 class="text-xl font-semibold text-slate-900 dark:text-white mb-2">
        {{ 'RENTABILITY.STEP7.TITLE' | translate }}
      </h2>
      <p class="text-slate-600 dark:text-slate-400 mb-6">
        {{ 'RENTABILITY.STEP7.SUBTITLE' | translate }}
      </p>

      @if (result && input) {
        <!-- Ajustements rapides -->
        <div class="bg-white dark:bg-slate-800 rounded-xl p-6 mb-6 shadow-sm">
          <h3 class="text-lg font-semibold text-slate-900 dark:text-white mb-4">
            {{ 'RENTABILITY.STEP7.QUICK_ADJUSTMENTS' | translate }}
          </h3>

          <div class="grid grid-cols-3 gap-4">
            <div>
              <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                {{ 'RENTABILITY.STEP7.MONTHLY_RENT' | translate }} (€)
              </label>
              <input type="number" [(ngModel)]="adjustedRent" (ngModelChange)="onAdjustmentChange()"
                class="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white">
            </div>

            <div>
              <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                {{ 'RENTABILITY.STEP7.VACANCY_RATE' | translate }} (%)
              </label>
              <input type="number" [(ngModel)]="adjustedVacancy" (ngModelChange)="onAdjustmentChange()"
                min="0" max="100" step="0.5"
                class="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white">
            </div>

            <div>
              <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                {{ 'RENTABILITY.STEP7.INTEREST_RATE' | translate }} (%)
              </label>
              <input type="number" [(ngModel)]="adjustedRate" (ngModelChange)="onAdjustmentChange()"
                min="0" max="10" step="0.1"
                class="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white">
            </div>
          </div>

          <div class="mt-4 flex gap-3">
            <button (click)="resetAdjustments()"
              class="px-4 py-2 text-sm border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700">
              <i class="ph ph-arrow-counter-clockwise mr-2"></i>
              {{ 'RENTABILITY.STEP7.RESET' | translate }}
            </button>

            <button (click)="applyAdjustments()"
              class="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              <i class="ph ph-calculator mr-2"></i>
              {{ 'RENTABILITY.STEP7.RECALCULATE' | translate }}
            </button>
          </div>
        </div>

        <!-- What-If rapide -->
        <div class="bg-white dark:bg-slate-800 rounded-xl p-6 mb-6 shadow-sm">
          <h3 class="text-lg font-semibold text-slate-900 dark:text-white mb-4">
            {{ 'RENTABILITY.STEP7.WHAT_IF' | translate }}
          </h3>

          <div class="grid grid-cols-2 gap-4">
            <button (click)="whatIf('rent', 10)"
              class="p-4 border-2 border-slate-200 dark:border-slate-700 rounded-lg hover:border-blue-600 dark:hover:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition text-left">
              <div class="font-medium text-slate-900 dark:text-white mb-1">
                {{ 'RENTABILITY.STEP7.RENT_PLUS_10' | translate }}
              </div>
              <div class="text-sm text-slate-500">
                {{ 'RENTABILITY.STEP7.IMPACT_ON_CASHFLOW' | translate }}
              </div>
            </button>

            <button (click)="whatIf('rent', -10)"
              class="p-4 border-2 border-slate-200 dark:border-slate-700 rounded-lg hover:border-red-600 dark:hover:border-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition text-left">
              <div class="font-medium text-slate-900 dark:text-white mb-1">
                {{ 'RENTABILITY.STEP7.RENT_MINUS_10' | translate }}
              </div>
              <div class="text-sm text-slate-500">
                {{ 'RENTABILITY.STEP7.IMPACT_ON_CASHFLOW' | translate }}
              </div>
            </button>

            <button (click)="whatIf('rate', 0.5)"
              class="p-4 border-2 border-slate-200 dark:border-slate-700 rounded-lg hover:border-amber-600 dark:hover:border-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition text-left">
              <div class="font-medium text-slate-900 dark:text-white mb-1">
                {{ 'RENTABILITY.STEP7.RATE_PLUS_HALF' | translate }}
              </div>
              <div class="text-sm text-slate-500">
                {{ 'RENTABILITY.STEP7.IMPACT_ON_LOAN' | translate }}
              </div>
            </button>

            <button (click)="whatIf('vacancy', 5)"
              class="p-4 border-2 border-slate-200 dark:border-slate-700 rounded-lg hover:border-purple-600 dark:hover:border-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition text-left">
              <div class="font-medium text-slate-900 dark:text-white mb-1">
                {{ 'RENTABILITY.STEP7.VACANCY_PLUS_5' | translate }}
              </div>
              <div class="text-sm text-slate-500">
                {{ 'RENTABILITY.STEP7.IMPACT_ON_REVENUE' | translate }}
              </div>
            </button>
          </div>
        </div>

        <!-- Recommandations -->
        <div class="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-6">
          <div class="flex items-start gap-3">
            <i class="ph ph-lightbulb text-emerald-600 dark:text-emerald-400 text-2xl"></i>
            <div>
              <h3 class="text-lg font-semibold text-emerald-900 dark:text-emerald-300 mb-2">
                {{ 'RENTABILITY.STEP7.RECOMMENDATIONS' | translate }}
              </h3>
              <ul class="space-y-2 text-sm text-emerald-800 dark:text-emerald-400">
                <li class="flex items-start gap-2">
                  <i class="ph ph-check-circle text-lg mt-0.5"></i>
                  <span>{{ getRecommendation1() }}</span>
                </li>
                <li class="flex items-start gap-2">
                  <i class="ph ph-check-circle text-lg mt-0.5"></i>
                  <span>{{ getRecommendation2() }}</span>
                </li>
                <li class="flex items-start gap-2">
                  <i class="ph ph-check-circle text-lg mt-0.5"></i>
                  <span>{{ getRecommendation3() }}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

      } @else {
        <div class="text-center py-12 text-slate-500">
          {{ 'RENTABILITY.STEP7.NO_DATA' | translate }}
        </div>
      }
    </div>
  `
})
export class Step7AnalysisComponent {
  @Input() result: RentabilityResult | null = null;
  @Input() input?: Partial<RentabilityInput>;
  @Output() recalculate = new EventEmitter<void>();

  adjustedRent = 0;
  adjustedVacancy = 0;
  adjustedRate = 0;

  ngOnChanges() {
    if (this.input) {
      this.adjustedRent = this.input.revenues?.monthlyRent || 0;
      this.adjustedVacancy = this.input.revenues?.vacancyRate || 0;
      this.adjustedRate = this.input.financing?.interestRate || 0;
    }
  }

  onAdjustmentChange() {
    // Live preview could be implemented here
  }

  resetAdjustments() {
    if (this.input) {
      this.adjustedRent = this.input.revenues?.monthlyRent || 0;
      this.adjustedVacancy = this.input.revenues?.vacancyRate || 0;
      this.adjustedRate = this.input.financing?.interestRate || 0;
    }
  }

  applyAdjustments() {
    // Update input data with adjustments
    if (this.input?.revenues) {
      this.input.revenues.monthlyRent = this.adjustedRent;
      this.input.revenues.vacancyRate = this.adjustedVacancy;
    }
    if (this.input?.financing) {
      this.input.financing.interestRate = this.adjustedRate;
    }

    this.recalculate.emit();
  }

  whatIf(param: string, change: number) {
    switch (param) {
      case 'rent':
        this.adjustedRent = (this.input?.revenues?.monthlyRent || 0) * (1 + change / 100);
        break;
      case 'rate':
        this.adjustedRate = (this.input?.financing?.interestRate || 0) + change;
        break;
      case 'vacancy':
        this.adjustedVacancy = Math.min(100, (this.input?.revenues?.vacancyRate || 0) + change);
        break;
    }

    this.applyAdjustments();
  }

  getRecommendation1(): string {
    if (!this.result) return '';
    const cashflow = this.result.yearlyResults[0].cashflowAfterTax;
    if (cashflow < 0) {
      return 'Augmentez le loyer de 10% pour obtenir un cashflow positif.';
    }
    return 'Votre cashflow est positif dès la première année.';
  }

  getRecommendation2(): string {
    if (!this.result) return '';
    if (this.result.kpis.dscr < 1.25) {
      return 'Réduisez le montant emprunté pour améliorer votre DSCR.';
    }
    return 'Votre DSCR est excellent, vous pouvez emprunter davantage.';
  }

  getRecommendation3(): string {
    if (!this.result) return '';
    if (this.result.kpis.irr < 8) {
      return 'Envisagez des travaux pour augmenter le loyer et améliorer le TRI.';
    }
    return 'Votre TRI est supérieur à 8%, c\'est un excellent investissement.';
  }
}
