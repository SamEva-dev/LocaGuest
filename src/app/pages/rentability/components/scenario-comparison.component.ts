import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RentabilityResult } from '../../../core/models/rentability.models';

interface ComparisonScenario {
  name: string;
  result: RentabilityResult;
}

@Component({
  selector: 'app-scenario-comparison',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm">
      <h3 class="text-lg font-semibold text-slate-900 dark:text-white mb-4">
        Comparaison de scénarios
      </h3>

      @if (scenarios.length >= 2) {
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-slate-200 dark:border-slate-700">
                <th class="text-left py-3 px-4 text-slate-600 dark:text-slate-400 font-medium">KPI</th>
                @for (scenario of scenarios; track scenario.name) {
                  <th class="text-right py-3 px-4 text-slate-900 dark:text-white font-semibold">
                    {{ scenario.name }}
                  </th>
                }
                <th class="text-right py-3 px-4 text-slate-600 dark:text-slate-400 font-medium">Δ</th>
              </tr>
            </thead>
            <tbody>
              <!-- Cashflow mensuel -->
              <tr class="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/30">
                <td class="py-3 px-4 text-slate-700 dark:text-slate-300">Cashflow mensuel</td>
                @for (scenario of scenarios; track scenario.name) {
                  <td class="py-3 px-4 text-right font-medium" 
                      [class.text-emerald-600]="getMonthlyCashflow(scenario.result) > 0"
                      [class.text-red-600]="getMonthlyCashflow(scenario.result) < 0">
                    {{ getMonthlyCashflow(scenario.result) | number:'1.0-0' }} €
                  </td>
                }
                <td class="py-3 px-4 text-right font-bold" [class]="getDeltaClass(getDeltaCashflow())">
                  {{ getDeltaCashflow() > 0 ? '+' : '' }}{{ getDeltaCashflow() | number:'1.0-0' }} €
                </td>
              </tr>

              <!-- Rendement net-net -->
              <tr class="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/30">
                <td class="py-3 px-4 text-slate-700 dark:text-slate-300">Rendement net-net</td>
                @for (scenario of scenarios; track scenario.name) {
                  <td class="py-3 px-4 text-right font-medium text-slate-900 dark:text-white">
                    {{ scenario.result.kpis.netNetYield | number:'1.2-2' }}%
                  </td>
                }
                <td class="py-3 px-4 text-right font-bold" [class]="getDeltaClass(getDeltaNetYield())">
                  {{ getDeltaNetYield() > 0 ? '+' : '' }}{{ getDeltaNetYield() | number:'1.2-2' }}%
                </td>
              </tr>

              <!-- TRI -->
              <tr class="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/30">
                <td class="py-3 px-4 text-slate-700 dark:text-slate-300">TRI (IRR)</td>
                @for (scenario of scenarios; track scenario.name) {
                  <td class="py-3 px-4 text-right font-medium text-slate-900 dark:text-white">
                    {{ scenario.result.kpis.irr | number:'1.2-2' }}%
                  </td>
                }
                <td class="py-3 px-4 text-right font-bold" [class]="getDeltaClass(getDeltaIRR())">
                  {{ getDeltaIRR() > 0 ? '+' : '' }}{{ getDeltaIRR() | number:'1.2-2' }}%
                </td>
              </tr>

              <!-- Cash-on-Cash -->
              <tr class="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/30">
                <td class="py-3 px-4 text-slate-700 dark:text-slate-300">Cash-on-Cash</td>
                @for (scenario of scenarios; track scenario.name) {
                  <td class="py-3 px-4 text-right font-medium text-slate-900 dark:text-white">
                    {{ scenario.result.kpis.cashOnCash | number:'1.2-2' }}%
                  </td>
                }
                <td class="py-3 px-4 text-right font-bold" [class]="getDeltaClass(getDeltaCashOnCash())">
                  {{ getDeltaCashOnCash() > 0 ? '+' : '' }}{{ getDeltaCashOnCash() | number:'1.2-2' }}%
                </td>
              </tr>

              <!-- DSCR -->
              <tr class="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/30">
                <td class="py-3 px-4 text-slate-700 dark:text-slate-300">DSCR</td>
                @for (scenario of scenarios; track scenario.name) {
                  <td class="py-3 px-4 text-right font-medium text-slate-900 dark:text-white">
                    {{ scenario.result.kpis.dscr | number:'1.2-2' }}
                  </td>
                }
                <td class="py-3 px-4 text-right font-bold" [class]="getDeltaClass(getDeltaDSCR())">
                  {{ getDeltaDSCR() > 0 ? '+' : '' }}{{ getDeltaDSCR() | number:'1.2-2' }}
                </td>
              </tr>

              <!-- Plus-value nette -->
              <tr class="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                <td class="py-3 px-4 text-slate-700 dark:text-slate-300">Plus-value nette</td>
                @for (scenario of scenarios; track scenario.name) {
                  <td class="py-3 px-4 text-right font-medium text-emerald-600">
                    {{ scenario.result.kpis.netCapitalGain | number:'1.0-0' }} €
                  </td>
                }
                <td class="py-3 px-4 text-right font-bold" [class]="getDeltaClass(getDeltaCapitalGain())">
                  {{ getDeltaCapitalGain() > 0 ? '+' : '' }}{{ getDeltaCapitalGain() | number:'1.0-0' }} €
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Verdict -->
        <div class="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <div class="flex items-start gap-3">
            <i class="ph ph-info text-blue-600 dark:text-blue-400 text-xl"></i>
            <div>
              <p class="text-sm text-blue-800 dark:text-blue-300">
                <strong>{{ getBetterScenario() }}</strong> présente un meilleur TRI 
                ({{ getBetterIRR() | number:'1.2-2' }}%) et génère 
                {{ Math.abs(getDeltaCashflow()) | number:'1.0-0' }} € de cashflow 
                {{ getDeltaCashflow() > 0 ? 'supplémentaire' : 'en moins' }} par mois.
              </p>
            </div>
          </div>
        </div>
      } @else {
        <div class="text-center py-8 text-slate-500 dark:text-slate-400">
          <i class="ph ph-chart-bar text-4xl mb-3 block"></i>
          <p>Sauvegardez au moins 2 scénarios pour les comparer</p>
        </div>
      }
    </div>
  `
})
export class ScenarioComparisonComponent {
  @Input() scenarios: ComparisonScenario[] = [];

  Math = Math;

  getMonthlyCashflow(result: RentabilityResult): number {
    return result.yearlyResults[0]?.cashflowAfterTax / 12 || 0;
  }

  getDeltaCashflow(): number {
    if (this.scenarios.length < 2) return 0;
    return this.getMonthlyCashflow(this.scenarios[1].result) - this.getMonthlyCashflow(this.scenarios[0].result);
  }

  getDeltaNetYield(): number {
    if (this.scenarios.length < 2) return 0;
    return this.scenarios[1].result.kpis.netNetYield - this.scenarios[0].result.kpis.netNetYield;
  }

  getDeltaIRR(): number {
    if (this.scenarios.length < 2) return 0;
    return this.scenarios[1].result.kpis.irr - this.scenarios[0].result.kpis.irr;
  }

  getDeltaCashOnCash(): number {
    if (this.scenarios.length < 2) return 0;
    return this.scenarios[1].result.kpis.cashOnCash - this.scenarios[0].result.kpis.cashOnCash;
  }

  getDeltaDSCR(): number {
    if (this.scenarios.length < 2) return 0;
    return this.scenarios[1].result.kpis.dscr - this.scenarios[0].result.kpis.dscr;
  }

  getDeltaCapitalGain(): number {
    if (this.scenarios.length < 2) return 0;
    return this.scenarios[1].result.kpis.netCapitalGain - this.scenarios[0].result.kpis.netCapitalGain;
  }

  getDeltaClass(delta: number): string {
    if (delta > 0) return 'text-emerald-600 dark:text-emerald-400';
    if (delta < 0) return 'text-red-600 dark:text-red-400';
    return 'text-slate-500';
  }

  getBetterScenario(): string {
    if (this.scenarios.length < 2) return '';
    const irr0 = this.scenarios[0].result.kpis.irr;
    const irr1 = this.scenarios[1].result.kpis.irr;
    return irr1 > irr0 ? this.scenarios[1].name : this.scenarios[0].name;
  }

  getBetterIRR(): number {
    if (this.scenarios.length < 2) return 0;
    return Math.max(this.scenarios[0].result.kpis.irr, this.scenarios[1].result.kpis.irr);
  }
}
