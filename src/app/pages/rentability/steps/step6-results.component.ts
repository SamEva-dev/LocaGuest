import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';
import { RentabilityResult, RentabilityInput } from '../../../core/models/rentability.models';
import { CashflowChartComponent } from '../components/charts/cashflow-chart.component';
import { InvestmentBreakdownComponent } from '../components/charts/investment-breakdown.component';
import { RentabilityGaugeComponent } from '../components/charts/rentability-gauge.component';
import { YearlyBreakdownComponent } from '../components/charts/yearly-breakdown.component';

@Component({
  selector: 'app-step6-results',
  standalone: true,
  imports: [
    CommonModule, 
    TranslatePipe,
    CashflowChartComponent,
    InvestmentBreakdownComponent,
    RentabilityGaugeComponent,
    YearlyBreakdownComponent
  ],
  template: `
    <div class="max-w-6xl">
      <h2 class="text-xl font-semibold text-slate-900 dark:text-white mb-2">
        {{ 'RENTABILITY.STEP6.TITLE' | translate }}
      </h2>
      <p class="text-slate-600 dark:text-slate-400 mb-6">
        {{ 'RENTABILITY.STEP6.SUBTITLE' | translate }}
      </p>

      @if (result) {
        <div class="mb-6">
          @if (isCertified) {
            <div class="rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-900 px-4 py-3">
              <div class="font-medium">Résultats certifiés serveur</div>
              @if (calculationVersion) {
                <div class="text-sm opacity-80">Version: {{ calculationVersion }}</div>
              }
              @if (inputsHash) {
                <div class="text-xs opacity-80 break-all">Hash: {{ inputsHash }}</div>
              }
            </div>
          } @else {
            <div class="rounded-lg border border-amber-200 bg-amber-50 text-amber-900 px-4 py-3">
              <div class="font-medium">Résultats non certifiés</div>
              @if (calculationVersion) {
                <div class="text-sm opacity-80">Version: {{ calculationVersion }}</div>
              }
            </div>
          }

          @if (warnings?.length) {
            <div class="mt-3 rounded-lg border border-slate-200 bg-white px-4 py-3">
              <div class="font-medium text-slate-900">Avertissements</div>
              <ul class="mt-2 list-disc pl-5 text-sm text-slate-700">
                @for (w of warnings; track w) {
                  <li>{{ w }}</li>
                }
              </ul>
            </div>
          }
        </div>

        <!-- KPIs Grid -->
        <div class="grid grid-cols-4 gap-4 mb-6">
          <!-- Cashflow mensuel -->
          <div class="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
            <div class="text-sm opacity-90 mb-1">{{ 'RENTABILITY.KPI.MONTHLY_CASHFLOW' | translate }}</div>
            <div class="text-3xl font-bold">
              {{ result.yearlyResults[0].cashflowAfterTax / 12 | number:'1.0-0' }} €
            </div>
            <div class="text-xs opacity-75 mt-1">{{ 'RENTABILITY.KPI.AFTER_TAX' | translate }}</div>
          </div>

          <!-- Rendement net-net -->
          <div class="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl p-6 text-white">
            <div class="text-sm opacity-90 mb-1">{{ 'RENTABILITY.KPI.NET_NET_YIELD' | translate }}</div>
            <div class="text-3xl font-bold">{{ result.kpis.netNetYield | number:'1.1-1' }}%</div>
            <div class="text-xs opacity-75 mt-1">{{ 'RENTABILITY.KPI.ANNUAL' | translate }}</div>
          </div>

          <!-- TRI (IRR) -->
          <div class="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white">
            <div class="text-sm opacity-90 mb-1">{{ 'RENTABILITY.KPI.IRR' | translate }}</div>
            <div class="text-3xl font-bold">{{ result.kpis.irr | number:'1.1-1' }}%</div>
            <div class="text-xs opacity-75 mt-1">{{ 'RENTABILITY.KPI.INTERNAL_RETURN' | translate }}</div>
          </div>

          <!-- VAN (NPV) -->
          <div class="bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl p-6 text-white">
            <div class="text-sm opacity-90 mb-1">{{ 'RENTABILITY.KPI.NPV' | translate }}</div>
            <div class="text-3xl font-bold">{{ result.kpis.npv | number:'1.0-0' }} €</div>
            <div class="text-xs opacity-75 mt-1">{{ 'RENTABILITY.KPI.NET_PRESENT_VALUE' | translate }}</div>
          </div>
        </div>

        <!-- Score de rentabilité + Répartition investissement -->
        <div class="grid grid-cols-3 gap-6 mb-6">
          <app-rentability-gauge [kpis]="result.kpis"></app-rentability-gauge>
          <div class="col-span-2">
            <app-investment-breakdown [input]="input" [kpis]="result.kpis"></app-investment-breakdown>
          </div>
        </div>

        <!-- Graphique évolution cashflow -->
        <div class="mb-6">
          <app-cashflow-chart [yearlyResults]="result.yearlyResults"></app-cashflow-chart>
        </div>

        <!-- Ratios financiers -->
        <div class="bg-white dark:bg-slate-800 rounded-xl p-6 mb-6 shadow-sm">
          <h3 class="text-lg font-semibold text-slate-900 dark:text-white mb-4">
            {{ 'RENTABILITY.STEP6.FINANCIAL_RATIOS' | translate }}
          </h3>

          <div class="grid grid-cols-4 gap-6">
            <div>
              <div class="text-sm text-slate-500 mb-1">{{ 'RENTABILITY.KPI.DSCR' | translate }}</div>
              <div class="text-2xl font-bold text-slate-900 dark:text-white">
                {{ result.kpis.dscr | number:'1.2-2' }}
              </div>
              <div class="text-xs text-slate-500 mt-1">
                @if (result.kpis.dscr >= 1.25) {
                  <span class="text-emerald-600">✓ Excellent</span>
                } @else if (result.kpis.dscr >= 1) {
                  <span class="text-amber-600">Acceptable</span>
                } @else {
                  <span class="text-red-600">⚠ Risqué</span>
                }
              </div>
            </div>

            <div>
              <div class="text-sm text-slate-500 mb-1">{{ 'RENTABILITY.KPI.LTV' | translate }}</div>
              <div class="text-2xl font-bold text-slate-900 dark:text-white">
                {{ result.kpis.ltv | number:'1.0-0' }}%
              </div>
              <div class="text-xs text-slate-500 mt-1">
                @if (result.kpis.ltv <= 80) {
                  <span class="text-emerald-600">✓ Bon</span>
                } @else {
                  <span class="text-amber-600">Élevé</span>
                }
              </div>
            </div>

            <div>
              <div class="text-sm text-slate-500 mb-1">{{ 'RENTABILITY.KPI.CASH_ON_CASH' | translate }}</div>
              <div class="text-2xl font-bold text-slate-900 dark:text-white">
                {{ result.kpis.cashOnCash | number:'1.1-1' }}%
              </div>
            </div>

            <div>
              <div class="text-sm text-slate-500 mb-1">{{ 'RENTABILITY.KPI.PAYBACK' | translate }}</div>
              <div class="text-2xl font-bold text-slate-900 dark:text-white">
                {{ result.kpis.paybackYears | number:'1.0-0' }} ans
              </div>
            </div>
          </div>
        </div>

        <!-- Investissement & Sortie -->
        <div class="grid grid-cols-2 gap-6 mb-6">
          <div class="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm">
            <h3 class="text-lg font-semibold text-slate-900 dark:text-white mb-4">
              {{ 'RENTABILITY.STEP6.INVESTMENT' | translate }}
            </h3>

            <div class="space-y-3">
              <div class="flex justify-between">
                <span class="text-slate-600 dark:text-slate-400">{{ 'RENTABILITY.STEP6.TOTAL_INVESTMENT' | translate }}</span>
                <span class="font-medium text-slate-900 dark:text-white">{{ result.kpis.totalInvestment | number:'1.0-0' }} €</span>
              </div>
              <div class="flex justify-between">
                <span class="text-slate-600 dark:text-slate-400">{{ 'RENTABILITY.STEP6.OWN_FUNDS' | translate }}</span>
                <span class="font-medium text-slate-900 dark:text-white">{{ result.kpis.ownFunds | number:'1.0-0' }} €</span>
              </div>
              <div class="flex justify-between text-sm pt-2 border-t border-slate-200 dark:border-slate-700">
                <span class="text-slate-600 dark:text-slate-400">{{ 'RENTABILITY.STEP6.BREAK_EVEN_RENT' | translate }}</span>
                <span class="font-medium text-slate-900 dark:text-white">{{ result.kpis.breakEvenRent | number:'1.0-0' }} €/mois</span>
              </div>
            </div>
          </div>

          <div class="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm">
            <h3 class="text-lg font-semibold text-slate-900 dark:text-white mb-4">
              {{ 'RENTABILITY.STEP6.EXIT' | translate }}
            </h3>

            <div class="space-y-3">
              <div class="flex justify-between">
                <span class="text-slate-600 dark:text-slate-400">{{ 'RENTABILITY.STEP6.EXIT_PRICE' | translate }}</span>
                <span class="font-medium text-slate-900 dark:text-white">{{ result.kpis.exitPrice | number:'1.0-0' }} €</span>
              </div>
              <div class="flex justify-between">
                <span class="text-slate-600 dark:text-slate-400">{{ 'RENTABILITY.STEP6.NET_CAPITAL_GAIN' | translate }}</span>
                <span class="font-medium text-emerald-600 dark:text-emerald-400">{{ result.kpis.netCapitalGain | number:'1.0-0' }} €</span>
              </div>
              <div class="flex justify-between text-sm pt-2 border-t border-slate-200 dark:border-slate-700">
                <span class="text-slate-600 dark:text-slate-400">{{ 'RENTABILITY.STEP6.FINAL_EQUITY' | translate }}</span>
                <span class="font-bold text-blue-600 dark:text-blue-400">{{ result.kpis.finalEquity | number:'1.0-0' }} €</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Tableau annuel (premiers 5 ans) -->
        <div class="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm">
          <h3 class="text-lg font-semibold text-slate-900 dark:text-white mb-4">
            {{ 'RENTABILITY.STEP6.YEARLY_TABLE' | translate }}
          </h3>

          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b border-slate-200 dark:border-slate-700">
                  <th class="text-left py-3 px-2 text-slate-600 dark:text-slate-400 font-medium">{{ 'RENTABILITY.STEP6.YEAR' | translate }}</th>
                  <th class="text-right py-3 px-2 text-slate-600 dark:text-slate-400 font-medium">{{ 'RENTABILITY.STEP6.REVENUE' | translate }}</th>
                  <th class="text-right py-3 px-2 text-slate-600 dark:text-slate-400 font-medium">{{ 'RENTABILITY.STEP6.CHARGES' | translate }}</th>
                  <th class="text-right py-3 px-2 text-slate-600 dark:text-slate-400 font-medium">{{ 'RENTABILITY.STEP6.LOAN' | translate }}</th>
                  <th class="text-right py-3 px-2 text-slate-600 dark:text-slate-400 font-medium">{{ 'RENTABILITY.STEP6.TAX' | translate }}</th>
                  <th class="text-right py-3 px-2 text-slate-600 dark:text-slate-400 font-medium">{{ 'RENTABILITY.STEP6.CASHFLOW' | translate }}</th>
                </tr>
              </thead>
              <tbody>
                @for (year of result.yearlyResults.slice(0, 5); track year.year) {
                  <tr class="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/30">
                    <td class="py-3 px-2 font-medium">{{ year.year }}</td>
                    <td class="py-3 px-2 text-right text-emerald-600">{{ year.netRevenue | number:'1.0-0' }} €</td>
                    <td class="py-3 px-2 text-right text-red-600">{{ year.totalCharges | number:'1.0-0' }} €</td>
                    <td class="py-3 px-2 text-right text-blue-600">{{ year.loanPayment | number:'1.0-0' }} €</td>
                    <td class="py-3 px-2 text-right text-amber-600">{{ year.tax | number:'1.0-0' }} €</td>
                    <td class="py-3 px-2 text-right font-bold" [class.text-emerald-600]="year.cashflowAfterTax > 0" [class.text-red-600]="year.cashflowAfterTax < 0">
                      {{ year.cashflowAfterTax | number:'1.0-0' }} €
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>

      } @else {
        <div class="text-center py-12 text-slate-500">
          {{ 'RENTABILITY.STEP6.NO_RESULTS' | translate }}
        </div>
      }
    </div>
  `
})
export class Step6ResultsComponent {
  @Input() result: RentabilityResult | null = null;
  @Input() input?: Partial<RentabilityInput>;
  @Input() warnings: string[] = [];
  @Input() isCertified: boolean = false;
  @Input() inputsHash: string | null = null;
  @Input() calculationVersion: string | null = null;
}
